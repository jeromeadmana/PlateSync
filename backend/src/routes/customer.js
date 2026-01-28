import express from 'express';
import cartService from '../services/cartService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateTableToken, createTableSession } from '../middleware/tableToken.js';
import db from '../db/index.js';

const router = express.Router();

// Generate table session token (admin sets up tablet)
router.post('/table-session/:tableId', asyncHandler(async (req, res) => {
  const { tableId } = req.params;
  const { hoursValid = 8 } = req.body; // Default 8 hours

  // Verify table exists
  const table = db.queryOne('SELECT * FROM tables WHERE id = ?', [tableId]);

  if (!table) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: `Table ${tableId} not found`,
      code: 'TABLE_NOT_FOUND'
    });
  }

  // Create session token
  const { token, expiresAt } = await createTableSession(tableId, hoursValid);

  res.status(201).json({
    success: true,
    data: {
      token,
      tableId: parseInt(tableId),
      tableNumber: table.table_number,
      expiresAt: expiresAt.toISOString()
    },
    message: 'Table session created'
  });
}));

// Get menu (no token required - menu is public info)
router.get('/menu/:storeId', asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const categories = db.query(
    'SELECT * FROM categories WHERE store_id = ? ORDER BY sort_order',
    [storeId]
  );

  const menuItems = db.query(
    `SELECT mi.*, c.name as category_name
     FROM menu_items mi
     LEFT JOIN categories c ON mi.category_id = c.id
     WHERE mi.store_id = ? AND mi.status = 'active'
     ORDER BY c.sort_order, mi.name`,
    [storeId]
  );

  // Get modifiers for each menu item
  const itemsWithModifiers = menuItems.map(item => {
    const modifiers = db.query(
      'SELECT * FROM modifiers WHERE menu_item_id = ?',
      [item.id]
    );
    return { ...item, modifiers };
  });

  res.json({
    success: true,
    data: itemsWithModifiers
  });
}));

// All cart routes now require valid table token
router.get('/cart', validateTableToken, asyncHandler(async (req, res) => {
  const cart = cartService.getActiveCart(req.tableId);

  res.json({
    success: true,
    data: cart
  });
}));

router.post('/cart/items', validateTableToken, asyncHandler(async (req, res) => {
  const { menuItemId, quantity, modifiers, specialInstructions } = req.body;

  if (!menuItemId || !quantity) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Menu item ID and quantity are required',
      code: 'MISSING_FIELDS'
    });
  }

  const itemId = cartService.addItem(req.tableId, {
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

router.put('/cart/items/:itemId', validateTableToken, asyncHandler(async (req, res) => {
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

router.delete('/cart/items/:itemId', validateTableToken, asyncHandler(async (req, res) => {
  cartService.removeItem(req.params.itemId);

  res.json({
    success: true,
    message: 'Item removed from cart'
  });
}));

router.post('/cart/call-server', validateTableToken, asyncHandler(async (req, res) => {
  const cartId = cartService.callServer(req.tableId);

  res.json({
    success: true,
    data: { cartId },
    message: 'Server notified'
  });
}));

router.get('/cart/status', validateTableToken, asyncHandler(async (req, res) => {
  const cart = cartService.getActiveCart(req.tableId);

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
