export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmployeeId(employeeId) {
  return typeof employeeId === 'string' && employeeId.length >= 4 && employeeId.length <= 6;
}

export function validatePrice(price) {
  return typeof price === 'number' && price >= 0;
}

export function validateQuantity(quantity) {
  return Number.isInteger(quantity) && quantity > 0;
}

export function isValidRole(role) {
  const validRoles = ['super_admin', 'company_admin', 'store_admin', 'cashier', 'cook', 'server'];
  return validRoles.includes(role);
}

export function isValidOrderStatus(status) {
  const validStatuses = ['received', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
  return validStatuses.includes(status);
}

export function isValidCartStatus(status) {
  const validStatuses = ['draft', 'ready_for_review', 'reviewed', 'submitted'];
  return validStatuses.includes(status);
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim();
}
