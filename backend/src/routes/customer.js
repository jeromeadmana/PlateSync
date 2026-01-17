import express from 'express';
import cartService from '../services/cartService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/cart/:tableId', asyncHandler(async (req, res) => {
  const cart = cartService.getActiveCart(req.params.tableId);

  res.json({
    success: true,
    data: cart
  });
}));

router.post('/cart/:tableId/items', asyncHandler(async (req, res) => {
  const { menuItemId, quantity, modifiers, specialInstructions } = req.body;

  if (!menuItemId || !quantity) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Menu item ID and quantity are required',
      code: 'MISSING_FIELDS'
    });
  }

  const itemId = cartService.addItem(req.params.tableId, {
    menuItemId,
    quantity,
    modifiers,
    specialInstructions
  });

  res.status(201).json({
    success: true,
    data: { itemId }
  });
}));

router.put('/cart/:tableId/items/:itemId', asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (!quantity) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Quantity is required',
      code: 'MISSING_FIELDS'
    });
  }

  cartService.updateItem(req.params.itemId, quantity);

  res.json({
    success: true,
    message: 'Cart item updated'
  });
}));

router.delete('/cart/:tableId/items/:itemId', asyncHandler(async (req, res) => {
  cartService.removeItem(req.params.itemId);

  res.json({
    success: true,
    message: 'Item removed from cart'
  });
}));

router.put('/cart/:tableId/call-server', asyncHandler(async (req, res) => {
  const cartId = cartService.callServer(req.params.tableId);

  res.json({
    success: true,
    data: { cartId },
    message: 'Server notified'
  });
}));

router.get('/cart/:tableId/status', asyncHandler(async (req, res) => {
  const cart = cartService.getActiveCart(req.params.tableId);

  res.json({
    success: true,
    data: {
      status: cart.status,
      itemCount: cart.items.length,
      totalAmount: cart.total_amount
    }
  });
}));

export default router;
