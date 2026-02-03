import express from 'express';
import adminService from '../services/adminService.js';
import menuService from '../services/menuService.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdminRole } from '../middleware/permissions.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// ==================== USER MANAGEMENT ====================

router.get('/users', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const storeId = req.query.storeId || null;
  const filters = {
    role: req.query.role,
    status: req.query.status
  };

  const users = adminService.getUsers(companyId, storeId, filters);

  res.json({
    success: true,
    data: users
  });
}));

router.get('/users/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const user = adminService.getUser(req.params.id);

  res.json({
    success: true,
    data: user
  });
}));

router.post('/users', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { email, password, name, employeeId, role, storeId } = req.body;

  if (!email || !password || !name || !employeeId || !role) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Email, password, name, employee ID, and role are required',
      code: 'MISSING_FIELDS'
    });
  }

  const userId = await adminService.createUser({
    companyId: req.user.companyId,
    storeId,
    email,
    password,
    name,
    employeeId,
    role
  });

  res.status(201).json({
    success: true,
    data: { userId },
    message: 'User created successfully'
  });
}));

router.put('/users/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { name, email, role, storeId, status } = req.body;

  if (!name || !email || !role || !status) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Name, email, role, and status are required',
      code: 'MISSING_FIELDS'
    });
  }

  adminService.updateUser(req.params.id, {
    name,
    email,
    role,
    storeId,
    status
  });

  res.json({
    success: true,
    message: 'User updated successfully'
  });
}));

router.put('/users/:id/password', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Password must be at least 6 characters',
      code: 'INVALID_PASSWORD'
    });
  }

  await adminService.resetUserPassword(req.params.id, password);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

router.delete('/users/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  adminService.deleteUser(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// ==================== TABLE MANAGEMENT ====================

router.get('/tables', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;
  const status = req.query.status;

  const tables = adminService.getTables(storeId, status);

  res.json({
    success: true,
    data: tables
  });
}));

router.get('/tables/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const table = adminService.getTable(req.params.id);

  res.json({
    success: true,
    data: table
  });
}));

router.post('/tables', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { tableNumber, status, tabletUrl } = req.body;

  if (!tableNumber) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Table number is required',
      code: 'MISSING_FIELDS'
    });
  }

  const tableId = adminService.createTable({
    storeId: req.user.storeId,
    tableNumber,
    status,
    tabletUrl
  });

  res.status(201).json({
    success: true,
    data: { tableId },
    message: 'Table created successfully'
  });
}));

router.put('/tables/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { tableNumber, status, tabletUrl } = req.body;

  if (!tableNumber || !status) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Table number and status are required',
      code: 'MISSING_FIELDS'
    });
  }

  adminService.updateTable(req.params.id, {
    tableNumber,
    status,
    tabletUrl
  });

  res.json({
    success: true,
    message: 'Table updated successfully'
  });
}));

router.delete('/tables/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  adminService.deleteTable(req.params.id);

  res.json({
    success: true,
    message: 'Table deleted successfully'
  });
}));

// ==================== CATEGORY MANAGEMENT ====================

router.post('/categories', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { name, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Category name is required',
      code: 'MISSING_FIELDS'
    });
  }

  const categoryId = adminService.createCategory({
    storeId: req.user.storeId,
    name,
    sortOrder
  });

  res.status(201).json({
    success: true,
    data: { categoryId },
    message: 'Category created successfully'
  });
}));

router.put('/categories/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { name, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Category name is required',
      code: 'MISSING_FIELDS'
    });
  }

  adminService.updateCategory(req.params.id, {
    name,
    sortOrder
  });

  res.json({
    success: true,
    message: 'Category updated successfully'
  });
}));

router.delete('/categories/:id', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  adminService.deleteCategory(req.params.id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

// ==================== MENU ITEM MANAGEMENT (Enhanced) ====================

router.get('/menu/items', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;
  const categoryId = req.query.categoryId;

  const items = menuService.getMenuItems(storeId, categoryId);

  res.json({
    success: true,
    data: items
  });
}));

router.put('/menu/items/:id/status', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Status is required',
      code: 'MISSING_FIELDS'
    });
  }

  menuService.updateMenuItem(req.params.id, { status });

  res.json({
    success: true,
    message: 'Menu item status updated successfully'
  });
}));

// ==================== STORES ====================

router.get('/stores', authenticate, requireAdminRole, asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;

  const stores = adminService.getStores(companyId);

  res.json({
    success: true,
    data: stores
  });
}));

export default router;
