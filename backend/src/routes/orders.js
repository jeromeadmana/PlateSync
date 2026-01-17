import express from 'express';
import orderService from '../services/orderService.js';
import cartService from '../services/cartService.js';
import { authenticate } from '../middleware/auth.js';
import { requireServerRole, requireCookRole } from '../middleware/permissions.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/pending-reviews', authenticate, requireServerRole, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;

  const pending = cartService.getPendingReviews(storeId);

  res.json({
    success: true,
    data: pending
  });
}));

router.get('/cart/:cartId', authenticate, requireServerRole, asyncHandler(async (req, res) => {
  const cart = cartService.getCartForReview(req.params.cartId);

  res.json({
    success: true,
    data: cart
  });
}));

router.post('/cart/:cartId/submit', authenticate, requireServerRole, asyncHandler(async (req, res) => {
  const result = orderService.createOrderFromCart(req.params.cartId, req.user.userId);

  res.status(201).json({
    success: true,
    data: result,
    message: 'Order submitted to kitchen'
  });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;
  const filters = {
    status: req.query.status,
    serverId: req.query.serverId,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : null
  };

  const orders = orderService.getOrders(storeId, filters);

  res.json({
    success: true,
    data: orders
  });
}));

router.get('/kitchen', authenticate, requireCookRole, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;

  const orders = orderService.getKitchenOrders(storeId);

  res.json({
    success: true,
    data: orders
  });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = orderService.getOrder(req.params.id);

  res.json({
    success: true,
    data: order
  });
}));

router.put('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Status is required',
      code: 'MISSING_FIELDS'
    });
  }

  orderService.updateOrderStatus(req.params.id, status);

  res.json({
    success: true,
    message: 'Order status updated'
  });
}));

router.put('/items/:itemId/status', authenticate, requireCookRole, asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Status is required',
      code: 'MISSING_FIELDS'
    });
  }

  orderService.updateOrderItemStatus(req.params.itemId, status);

  res.json({
    success: true,
    message: 'Order item status updated'
  });
}));

export default router;
