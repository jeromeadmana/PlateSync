import db from '../db/index.js';
import { ROLES } from '../config/constants.js';

export function validateTenant(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  const requestedCompanyId = parseInt(req.params.companyId || req.body.companyId || req.query.companyId, 10);
  const requestedStoreId = parseInt(req.params.storeId || req.body.storeId || req.query.storeId, 10);

  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access to this company is not allowed',
      code: 'INVALID_TENANT'
    });
  }

  if (requestedStoreId) {
    if (req.user.role === ROLES.COMPANY_ADMIN) {
      const store = db.queryOne(
        'SELECT id FROM stores WHERE id = ? AND company_id = ?',
        [requestedStoreId, req.user.companyId]
      );

      if (!store) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access to this store is not allowed',
          code: 'INVALID_TENANT'
        });
      }
    } else {
      if (req.user.storeId && requestedStoreId !== req.user.storeId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access to this store is not allowed',
          code: 'INVALID_TENANT'
        });
      }
    }
  }

  next();
}

export function injectTenantContext(req, res, next) {
  if (req.user) {
    req.tenantContext = {
      companyId: req.user.companyId,
      storeId: req.user.storeId,
      role: req.user.role
    };
  }
  next();
}
