import express from 'express';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { requireServerRole } from '../middleware/permissions.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all tables for a store (optionally filter by status)
router.get('/', authenticate, requireServerRole, asyncHandler(async (req, res) => {
  const storeId = req.user.storeId;
  const { status } = req.query;

  let query = 'SELECT * FROM tables WHERE store_id = ?';
  const params = [storeId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY table_number';

  const tables = db.query(query, params);

  res.json({
    success: true,
    data: tables
  });
}));

// Get single table by ID
router.get('/:id', authenticate, requireServerRole, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const storeId = req.user.storeId;

  const table = db.queryOne(
    'SELECT * FROM tables WHERE id = ? AND store_id = ?',
    [id, storeId]
  );

  if (!table) {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message: 'Table not found',
      code: 'TABLE_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: table
  });
}));

export default router;
