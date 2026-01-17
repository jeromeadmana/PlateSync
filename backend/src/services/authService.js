import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import config from '../config/index.js';
import { validateEmail, validateEmployeeId } from '../utils/validators.js';
import logger from '../utils/logger.js';

class AuthService {
  async login(email, password) {
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const user = db.queryOne(
      `SELECT u.*, c.subscription_status, s.status as store_status
       FROM users u
       JOIN companies c ON u.company_id = c.id
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE u.email = ?`,
      [email]
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('User account is disabled');
    }

    if (user.subscription_status !== 'active') {
      throw new Error('Company subscription is not active');
    }

    if (user.store_id && user.store_status !== 'active') {
      throw new Error('Store is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    const token = this.generateToken(user);

    logger.info(`User logged in: ${user.email} (${user.role})`);

    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  async quickLogin(companyId, employeeId) {
    if (!validateEmployeeId(employeeId)) {
      throw new Error('Invalid employee ID format');
    }

    const user = db.queryOne(
      `SELECT u.*, c.subscription_status, s.status as store_status
       FROM users u
       JOIN companies c ON u.company_id = c.id
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE u.company_id = ? AND u.employee_id = ?`,
      [companyId, employeeId]
    );

    if (!user) {
      throw new Error('Employee not found');
    }

    if (user.status !== 'active') {
      throw new Error('User account is disabled');
    }

    if (user.subscription_status !== 'active') {
      throw new Error('Company subscription is not active');
    }

    if (user.store_id && user.store_status !== 'active') {
      throw new Error('Store is not active');
    }

    db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    logger.info(`Quick login: Employee ${employeeId} (${user.name})`);

    return this.sanitizeUser(user);
  }

  async getEmployeeList(companyId, storeId = null) {
    let query = `
      SELECT id, name, employee_id, role
      FROM users
      WHERE company_id = ? AND status = 'active'
    `;
    const params = [companyId];

    if (storeId) {
      query += ' AND (store_id = ? OR store_id IS NULL)';
      params.push(storeId);
    }

    query += ' ORDER BY employee_id';

    return db.query(query, params);
  }

  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      storeId: user.store_id
    };

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiry
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  sanitizeUser(user) {
    const {
      password_hash,
      subscription_status,
      store_status,
      ...sanitized
    } = user;
    return sanitized;
  }

  async createUser(userData, creatorRole, creatorCompanyId) {
    const {
      email,
      password,
      name,
      role,
      companyId,
      storeId
    } = userData;

    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (creatorRole === 'company_admin' && companyId !== creatorCompanyId) {
      throw new Error('Company admin can only create users in their own company');
    }

    const existingUser = db.queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const employeeId = this.generateEmployeeId(companyId);

    const passwordHash = await bcrypt.hash(password, config.auth.bcryptRounds);

    const result = db.run(
      `INSERT INTO users (
        company_id, store_id, email, password_hash, name,
        employee_id, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, storeId || null, email, passwordHash, name, employeeId, role, 'active']
    );

    logger.info(`User created: ${email} (Employee ID: ${employeeId})`);

    return {
      id: result.lastInsertRowid,
      employeeId
    };
  }

  generateEmployeeId(companyId) {
    const lastUser = db.queryOne(
      `SELECT employee_id FROM users
       WHERE company_id = ?
       ORDER BY CAST(employee_id AS INTEGER) DESC
       LIMIT 1`,
      [companyId]
    );

    if (!lastUser) {
      return '1001';
    }

    const nextId = parseInt(lastUser.employee_id, 10) + 1;
    return nextId.toString();
  }
}

export default new AuthService();
