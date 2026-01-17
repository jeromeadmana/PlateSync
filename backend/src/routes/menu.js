import express from 'express';
import menuService from '../services/menuService.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/categories', optionalAuth, asyncHandler(async (req, res) => {
  const storeId = req.query.storeId || req.user?.storeId;

  if (!storeId) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Store ID is required',
      code: 'MISSING_STORE_ID'
    });
  }

  const categories = menuService.getCategories(storeId);

  res.json({
    success: true,
    data: categories
  });
}));

router.get('/items', optionalAuth, asyncHandler(async (req, res) => {
  const storeId = req.query.storeId || req.user?.storeId;
  const categoryId = req.query.categoryId;

  if (!storeId) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Store ID is required',
      code: 'MISSING_STORE_ID'
    });
  }

  const items = menuService.getMenuItems(storeId, categoryId);

  res.json({
    success: true,
    data: items
  });
}));

router.get('/items/:id', asyncHandler(async (req, res) => {
  const item = menuService.getMenuItem(req.params.id);

  res.json({
    success: true,
    data: item
  });
}));

router.get('/active', asyncHandler(async (req, res) => {
  const storeId = req.query.storeId;

  if (!storeId) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Store ID is required',
      code: 'MISSING_STORE_ID'
    });
  }

  const menu = menuService.getActiveMenu(storeId);

  res.json({
    success: true,
    data: menu
  });
}));

router.post('/items', authenticate, asyncHandler(async (req, res) => {
  const { name, description, basePrice, categoryId, imageUrl, status } = req.body;
  const storeId = req.body.storeId || req.user.storeId;

  if (!name || basePrice === undefined) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Name and base price are required',
      code: 'MISSING_FIELDS'
    });
  }

  const id = menuService.createMenuItem({
    storeId,
    categoryId,
    name,
    description,
    basePrice,
    imageUrl,
    status
  });

  res.status(201).json({
    success: true,
    data: { id }
  });
}));

router.put('/items/:id', authenticate, asyncHandler(async (req, res) => {
  menuService.updateMenuItem(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Menu item updated'
  });
}));

router.delete('/items/:id', authenticate, asyncHandler(async (req, res) => {
  menuService.deleteMenuItem(req.params.id);

  res.json({
    success: true,
    message: 'Menu item deleted'
  });
}));

router.post('/items/:id/modifiers', authenticate, asyncHandler(async (req, res) => {
  const { name, extraPrice } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Modifier name is required',
      code: 'MISSING_FIELDS'
    });
  }

  const id = menuService.addModifier(req.params.id, name, extraPrice || 0);

  res.status(201).json({
    success: true,
    data: { id }
  });
}));

router.delete('/modifiers/:id', authenticate, asyncHandler(async (req, res) => {
  menuService.deleteModifier(req.params.id);

  res.json({
    success: true,
    message: 'Modifier deleted'
  });
}));

export default router;
