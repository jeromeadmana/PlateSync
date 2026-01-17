import authService from '../services/authService.js';
import { asyncHandler } from './errorHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Missing or invalid authorization header');
    error.name = 'UnauthorizedError';
    throw error;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    error.name = 'UnauthorizedError';
    throw error;
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      req.user = null;
    }
  }

  next();
});
