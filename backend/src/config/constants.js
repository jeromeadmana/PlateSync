export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMPANY_ADMIN: 'company_admin',
  STORE_ADMIN: 'store_admin',
  CASHIER: 'cashier',
  COOK: 'cook',
  SERVER: 'server'
};

export const ORDER_STATUS = {
  RECEIVED: 'received',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  PAID: 'paid',
  CANCELLED: 'cancelled'
};

export const ORDER_ITEM_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  CANCELLED: 'cancelled'
};

export const CART_STATUS = {
  DRAFT: 'draft',
  READY_FOR_REVIEW: 'ready_for_review',
  REVIEWED: 'reviewed',
  SUBMITTED: 'submitted'
};

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved'
};

export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled'
};

export const COMPANY_SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled'
};

export const STORE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

export const MENU_ITEM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD_OUT: 'sold_out'
};

export const PAYMENT_METHOD = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile'
};

export const PRICE_CHANGE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const DEVICE_TYPE = {
  KITCHEN: 'kitchen',
  SERVER: 'server',
  CASHIER: 'cashier',
  ADMIN: 'admin',
  CUSTOMER: 'customer'
};

export const SOCKET_EVENTS = {
  ORDER_NEW: 'order:new',
  ORDER_STATUS_CHANGE: 'order:statusChange',
  ORDER_ITEM_STATUS_CHANGE: 'orderItem:statusChange',
  CART_READY_FOR_REVIEW: 'cart:readyForReview',
  ORDER_SUBMITTED: 'order:submitted',
  ORDER_PREPARING: 'order:preparing',
  ORDER_READY: 'order:ready',
  ORDER_SERVED: 'order:served',
  TABLE_STATUS_CHANGE: 'table:statusChange',
  MENU_UPDATE: 'menu:update',
  DEVICE_ONLINE: 'device:online',
  DEVICE_OFFLINE: 'device:offline'
};

export const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  APPROVE: 'approve',
  REJECT: 'reject'
};
