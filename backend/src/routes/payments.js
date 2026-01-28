import express from 'express';
import paymentService from '../services/paymentService.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Process payment for an order
 * POST /api/payments
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { orderId, amount, paymentMethod, tipAmount } = req.body;

  // Validation
  if (!orderId || !amount || !paymentMethod) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Order ID, amount, and payment method are required',
      code: 'MISSING_FIELDS'
    });
  }

  // Validate payment method
  const validMethods = ['cash', 'card', 'mobile'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Invalid payment method. Must be: cash, card, or mobile',
      code: 'INVALID_PAYMENT_METHOD'
    });
  }

  // Validate amounts are positive numbers
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Payment amount must be greater than 0',
      code: 'INVALID_AMOUNT'
    });
  }

  try {
    const receipt = paymentService.processPayment(
      orderId,
      req.user.userId,
      amount,
      paymentMethod,
      tipAmount || 0
    );

    res.status(201).json({
      success: true,
      data: receipt,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('already paid')) {
      return res.status(400).json({
        success: false,
        error: 'Payment failed',
        message: error.message,
        code: 'PAYMENT_ERROR'
      });
    }
    throw error;
  }
}));

/**
 * Get unpaid orders (for cashier view)
 * GET /api/payments/unpaid
 */
router.get('/unpaid', authenticate, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;
  const filters = {
    tableId: req.query.tableId ? parseInt(req.query.tableId) : null
  };

  const orders = paymentService.getUnpaidOrders(storeId, filters);

  res.json({
    success: true,
    data: orders
  });
}));

/**
 * Get shift report for current cashier
 * GET /api/payments/shift
 */
router.get('/shift', authenticate, asyncHandler(async (req, res) => {
  const cashierId = req.user.userId;
  const { startTime, endTime } = req.query;

  const report = paymentService.getShiftReport(cashierId, startTime, endTime);

  res.json({
    success: true,
    data: report
  });
}));

/**
 * Get payment receipt
 * GET /api/payments/:id
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const receipt = paymentService.getPaymentReceipt(req.params.id);

  res.json({
    success: true,
    data: receipt
  });
}));

/**
 * Get all payments (admin/reporting)
 * GET /api/payments
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    paymentMethod: req.query.paymentMethod,
    limit: req.query.limit ? parseInt(req.query.limit) : null
  };

  const payments = paymentService.getAllPayments(storeId, filters);

  res.json({
    success: true,
    data: payments
  });
}));

export default router;
