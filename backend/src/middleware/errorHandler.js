import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error('Error occurred:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      code: 'UNAUTHORIZED'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details || {},
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.message === 'Invalid credentials') {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this value already exists',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist',
      code: 'INVALID_REFERENCE'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: 'Server error',
    message,
    code: err.code || 'INTERNAL_ERROR'
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND'
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
