import db from '../db/index.js';
import logger from '../utils/logger.js';

/**
 * Middleware to validate table session tokens
 * Used for customer tablet authentication
 */
export const validateTableToken = async (req, res, next) => {
  try {
    // Get token from query string or body
    const token = req.query.token || req.body.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Table session token is required',
        code: 'NO_TOKEN'
      });
    }

    // Validate token exists and is not expired
    const session = db.queryOne(
      `SELECT ts.*, t.store_id, t.table_number
       FROM table_sessions ts
       JOIN tables t ON ts.table_id = t.id
       WHERE ts.token = ? AND ts.expires_at > datetime('now')`,
      [token]
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid or expired table session token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach table info to request
    req.tableId = session.table_id;
    req.storeId = session.store_id;
    req.tableNumber = session.table_number;
    req.tableToken = token;

    logger.info(`Valid token for table ${session.table_number}`);
    next();

  } catch (error) {
    logger.error('Token validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to validate table session',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Generate a secure random token
 */
export const generateToken = async () => {
  // Generate 32-byte random hex string
  const crypto = await import('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a new table session token
 */
export const createTableSession = async (tableId, hoursValid = 8) => {
  const token = await generateToken();
  const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);

  db.run(
    `INSERT INTO table_sessions (table_id, token, expires_at)
     VALUES (?, ?, ?)`,
    [tableId, token, expiresAt.toISOString()]
  );

  return { token, expiresAt };
};

/**
 * Cleanup expired table sessions (should be run periodically)
 */
export const cleanupExpiredSessions = () => {
  const result = db.run(
    `DELETE FROM table_sessions WHERE expires_at < datetime('now')`
  );

  logger.info(`Cleaned up ${result.changes || 0} expired table sessions`);
  return result.changes || 0;
};
