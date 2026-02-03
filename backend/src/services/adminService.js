import db from '../db/index.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
import { USER_STATUS, MENU_ITEM_STATUS, TABLE_STATUS } from '../config/constants.js';

class AdminService {
  // ==================== USER MANAGEMENT ====================

  getUsers(companyId, storeId = null, filters = {}) {
    let query = `
      SELECT u.*, s.name as store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.company_id = ?
    `;
    const params = [companyId];

    if (storeId) {
      query += ' AND u.store_id = ?';
      params.push(storeId);
    }

    if (filters.role) {
      query += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND u.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY u.created_at DESC';

    return db.query(query, params);
  }

  getUser(userId) {
    const user = db.queryOne(
      `SELECT u.*, s.name as store_name, c.name as company_name
       FROM users u
       LEFT JOIN stores s ON u.store_id = s.id
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password hash from response
    delete user.password_hash;
    return user;
  }

  async createUser(data) {
    const { companyId, storeId, email, password, name, employeeId, role } = data;

    // Check if email already exists
    const existingEmail = db.queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Check if employee ID already exists for this company
    const existingEmployee = db.queryOne(
      'SELECT id FROM users WHERE company_id = ? AND employee_id = ?',
      [companyId, employeeId]
    );
    if (existingEmployee) {
      throw new Error('Employee ID already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.run(
      `INSERT INTO users (company_id, store_id, email, password_hash, name, employee_id, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, storeId || null, email, passwordHash, name, employeeId, role, USER_STATUS.ACTIVE]
    );

    logger.info(`User created: ${name} (${email}) with role ${role}`);

    return result.lastInsertRowid;
  }

  updateUser(userId, data) {
    const { name, email, role, storeId, status } = data;

    const user = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is changing and if new email already exists
    if (email && email !== user.email) {
      const existingEmail = db.queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    db.run(
      `UPDATE users
       SET name = ?, email = ?, role = ?, store_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, email, role, storeId || null, status, userId]
    );

    logger.info(`User updated: ID ${userId}`);
  }

  async resetUserPassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    db.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, userId]
    );

    logger.info(`Password reset for user ID ${userId}`);
  }

  deleteUser(userId) {
    const user = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }

    db.run('DELETE FROM users WHERE id = ?', [userId]);
    logger.info(`User deleted: ID ${userId} (${user.email})`);
  }

  // ==================== TABLE MANAGEMENT ====================

  getTables(storeId, status = null) {
    let query = 'SELECT * FROM tables WHERE store_id = ?';
    const params = [storeId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY table_number';

    return db.query(query, params);
  }

  getTable(tableId) {
    const table = db.queryOne('SELECT * FROM tables WHERE id = ?', [tableId]);
    if (!table) {
      throw new Error('Table not found');
    }
    return table;
  }

  createTable(data) {
    const { storeId, tableNumber, status, tabletUrl } = data;

    // Check if table number already exists for this store
    const existing = db.queryOne(
      'SELECT id FROM tables WHERE store_id = ? AND table_number = ?',
      [storeId, tableNumber]
    );
    if (existing) {
      throw new Error('Table number already exists for this store');
    }

    const result = db.run(
      'INSERT INTO tables (store_id, table_number, status, tablet_url) VALUES (?, ?, ?, ?)',
      [storeId, tableNumber, status || TABLE_STATUS.AVAILABLE, tabletUrl || null]
    );

    logger.info(`Table created: ${tableNumber} at store ${storeId}`);

    return result.lastInsertRowid;
  }

  updateTable(tableId, data) {
    const { tableNumber, status, tabletUrl } = data;

    const table = db.queryOne('SELECT * FROM tables WHERE id = ?', [tableId]);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table number is changing and if new number already exists
    if (tableNumber && tableNumber !== table.table_number) {
      const existing = db.queryOne(
        'SELECT id FROM tables WHERE store_id = ? AND table_number = ? AND id != ?',
        [table.store_id, tableNumber, tableId]
      );
      if (existing) {
        throw new Error('Table number already exists for this store');
      }
    }

    db.run(
      `UPDATE tables
       SET table_number = ?, status = ?, tablet_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [tableNumber, status, tabletUrl, tableId]
    );

    logger.info(`Table updated: ID ${tableId}`);
  }

  deleteTable(tableId) {
    const table = db.queryOne('SELECT * FROM tables WHERE id = ?', [tableId]);
    if (!table) {
      throw new Error('Table not found');
    }

    // Check if table has active carts or orders
    const activeCarts = db.queryOne(
      `SELECT COUNT(*) as count FROM customer_carts
       WHERE table_id = ? AND status IN ('draft', 'ready_for_review', 'reviewed')`,
      [tableId]
    );

    if (activeCarts.count > 0) {
      throw new Error('Cannot delete table with active carts');
    }

    const activeOrders = db.queryOne(
      `SELECT COUNT(*) as count FROM orders
       WHERE table_id = ? AND status NOT IN ('paid', 'cancelled')`,
      [tableId]
    );

    if (activeOrders.count > 0) {
      throw new Error('Cannot delete table with active orders');
    }

    db.run('DELETE FROM tables WHERE id = ?', [tableId]);
    logger.info(`Table deleted: ID ${tableId} (${table.table_number})`);
  }

  // ==================== CATEGORY MANAGEMENT ====================

  createCategory(data) {
    const { storeId, name, sortOrder } = data;

    // Check if category name already exists for this store
    const existing = db.queryOne(
      'SELECT id FROM categories WHERE store_id = ? AND name = ?',
      [storeId, name]
    );
    if (existing) {
      throw new Error('Category name already exists for this store');
    }

    const result = db.run(
      'INSERT INTO categories (store_id, name, sort_order) VALUES (?, ?, ?)',
      [storeId, name, sortOrder || 0]
    );

    logger.info(`Category created: ${name} at store ${storeId}`);

    return result.lastInsertRowid;
  }

  updateCategory(categoryId, data) {
    const { name, sortOrder } = data;

    const category = db.queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if name is changing and if new name already exists
    if (name && name !== category.name) {
      const existing = db.queryOne(
        'SELECT id FROM categories WHERE store_id = ? AND name = ? AND id != ?',
        [category.store_id, name, categoryId]
      );
      if (existing) {
        throw new Error('Category name already exists for this store');
      }
    }

    db.run(
      'UPDATE categories SET name = ?, sort_order = ? WHERE id = ?',
      [name, sortOrder, categoryId]
    );

    logger.info(`Category updated: ID ${categoryId}`);
  }

  deleteCategory(categoryId) {
    const category = db.queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has menu items
    const itemCount = db.queryOne(
      'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
      [categoryId]
    );

    if (itemCount.count > 0) {
      throw new Error('Cannot delete category with menu items. Remove or reassign items first.');
    }

    db.run('DELETE FROM categories WHERE id = ?', [categoryId]);
    logger.info(`Category deleted: ID ${categoryId} (${category.name})`);
  }

  // ==================== STORE MANAGEMENT ====================

  getStores(companyId) {
    return db.query(
      'SELECT * FROM stores WHERE company_id = ? ORDER BY name',
      [companyId]
    );
  }

  getStore(storeId) {
    const store = db.queryOne('SELECT * FROM stores WHERE id = ?', [storeId]);
    if (!store) {
      throw new Error('Store not found');
    }
    return store;
  }
}

export default new AdminService();
