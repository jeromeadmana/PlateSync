import db from '../db/index.js';
import logger from '../utils/logger.js';

const paymentService = {
  /**
   * Process payment for an order
   */
  processPayment(orderId, cashierId, amount, paymentMethod, tipAmount = 0) {
    try {
      // Verify order exists and is not already paid
      const order = db.queryOne(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.status === 'paid') {
        throw new Error(`Order ${orderId} is already paid`);
      }

      // Validate payment amount matches order total (with tolerance for tips)
      const expectedTotal = parseFloat(order.total_amount);
      const paymentTotal = parseFloat(amount);
      const tip = parseFloat(tipAmount);

      if (paymentTotal < expectedTotal) {
        throw new Error(`Payment amount ($${paymentTotal}) is less than order total ($${expectedTotal})`);
      }

      // Create payment record
      const result = db.run(
        `INSERT INTO payments (order_id, cashier_id, amount, payment_method, tip_amount)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, cashierId, paymentTotal, paymentMethod, tip]
      );

      const paymentId = result.lastID;

      // Update order status to 'paid'
      db.run(
        `UPDATE orders
         SET status = 'paid',
             completed_time = datetime('now'),
             updated_at = datetime('now')
         WHERE id = ?`,
        [orderId]
      );

      logger.info(`Payment processed: Order ${orderId}, Payment ${paymentId}, Method: ${paymentMethod}`);

      // Return payment receipt data
      return this.getPaymentReceipt(paymentId);

    } catch (error) {
      logger.error('Payment processing failed:', error);
      throw error;
    }
  },

  /**
   * Get payment receipt data
   */
  getPaymentReceipt(paymentId) {
    const payment = db.queryOne(
      `SELECT p.*, o.order_number, o.table_id, o.total_amount as order_total,
              t.table_number, u.name as cashier_name
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN users u ON p.cashier_id = u.id
       WHERE p.id = ?`,
      [paymentId]
    );

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // Get order items
    const items = db.query(
      `SELECT oi.*, mi.name, mi.description
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [payment.order_id]
    );

    // Parse modifiers for each item
    const itemsWithModifiers = items.map(item => ({
      ...item,
      modifiers: item.modifiers_json ? JSON.parse(item.modifiers_json) : []
    }));

    return {
      ...payment,
      items: itemsWithModifiers,
      subtotal: payment.order_total,
      tip: payment.tip_amount,
      total: parseFloat(payment.amount) + parseFloat(payment.tip_amount)
    };
  },

  /**
   * Get unpaid orders for cashier view
   */
  getUnpaidOrders(storeId, filters = {}) {
    let query = `
      SELECT o.*, t.table_number, u.name as server_name,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.server_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.store_id = ?
        AND o.status IN ('ready', 'served')
      GROUP BY o.id
      ORDER BY o.order_time ASC
    `;

    const params = [storeId];

    // Apply filters if provided
    if (filters.tableId) {
      query = query.replace('GROUP BY', 'AND o.table_id = ? GROUP BY');
      params.push(filters.tableId);
    }

    const orders = db.query(query, params);

    // Get items for each order
    return orders.map(order => {
      const items = db.query(
        `SELECT oi.*, mi.name
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      return {
        ...order,
        items: items.map(item => ({
          ...item,
          modifiers: item.modifiers_json ? JSON.parse(item.modifiers_json) : []
        }))
      };
    });
  },

  /**
   * Get shift report for a cashier
   */
  getShiftReport(cashierId, shiftStart = null, shiftEnd = null) {
    // Default to current day if no times provided
    const startTime = shiftStart || new Date().toISOString().split('T')[0] + ' 00:00:00';
    const endTime = shiftEnd || new Date().toISOString();

    // Get all payments in shift
    const payments = db.query(
      `SELECT p.*, o.order_number, o.table_id
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.cashier_id = ?
         AND p.payment_time BETWEEN ? AND ?
       ORDER BY p.payment_time DESC`,
      [cashierId, startTime, endTime]
    );

    // Calculate totals by payment method
    const totals = {
      cash: 0,
      card: 0,
      mobile: 0,
      tips: 0,
      count: payments.length
    };

    payments.forEach(payment => {
      const amount = parseFloat(payment.amount);
      const tip = parseFloat(payment.tip_amount);

      totals[payment.payment_method] += amount;
      totals.tips += tip;
    });

    totals.grandTotal = totals.cash + totals.card + totals.mobile + totals.tips;

    return {
      cashierId,
      shiftStart: startTime,
      shiftEnd: endTime,
      payments,
      totals
    };
  },

  /**
   * Get all payments (for admin/reporting)
   */
  getAllPayments(storeId, filters = {}) {
    let query = `
      SELECT p.*, o.order_number, o.table_id, t.table_number,
             u.name as cashier_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON p.cashier_id = u.id
      WHERE o.store_id = ?
    `;

    const params = [storeId];

    if (filters.startDate) {
      query += ' AND p.payment_time >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND p.payment_time <= ?';
      params.push(filters.endDate);
    }

    if (filters.paymentMethod) {
      query += ' AND p.payment_method = ?';
      params.push(filters.paymentMethod);
    }

    query += ' ORDER BY p.payment_time DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.query(query, params);
  }
};

export default paymentService;
