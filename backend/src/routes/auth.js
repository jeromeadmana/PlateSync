import express from 'express';
import authService from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Email and password are required',
      code: 'MISSING_FIELDS'
    });
  }

  const result = await authService.login(email, password);

  res.json({
    success: true,
    data: result
  });
}));

router.post('/quick-login', asyncHandler(async (req, res) => {
  const { companyId, employeeId } = req.body;

  if (!companyId || !employeeId) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Company ID and employee ID are required',
      code: 'MISSING_FIELDS'
    });
  }

  const user = await authService.quickLogin(companyId, employeeId);

  res.json({
    success: true,
    data: { user }
  });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      companyId: req.user.companyId,
      storeId: req.user.storeId
    }
  });
}));

router.get('/employees', authenticate, asyncHandler(async (req, res) => {
  const { companyId, storeId } = req.query;

  const employees = await authService.getEmployeeList(
    companyId || req.user.companyId,
    storeId || req.user.storeId
  );

  res.json({
    success: true,
    data: employees
  });
}));

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

export default router;
