import { ROLES } from '../config/constants.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
}

export function requireSuperAdmin(req, res, next) {
  return requireRole(ROLES.SUPER_ADMIN)(req, res, next);
}

export function requireAdminRole(req, res, next) {
  return requireRole(
    ROLES.SUPER_ADMIN,
    ROLES.COMPANY_ADMIN,
    ROLES.STORE_ADMIN
  )(req, res, next);
}

export function requireServerRole(req, res, next) {
  return requireRole(
    ROLES.SUPER_ADMIN,
    ROLES.COMPANY_ADMIN,
    ROLES.STORE_ADMIN,
    ROLES.SERVER
  )(req, res, next);
}

export function requireCookRole(req, res, next) {
  return requireRole(
    ROLES.SUPER_ADMIN,
    ROLES.COOK
  )(req, res, next);
}

export function requireCashierRole(req, res, next) {
  return requireRole(
    ROLES.SUPER_ADMIN,
    ROLES.CASHIER
  )(req, res, next);
}
