import db from '../db/index.js';
import cartService from './cartService.js';
import { ORDER_STATUS, CART_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';
import { emitToKitchen, emitToServers, emitToTable, SOCKET_EVENTS } from '../sockets/index.js';

class OrderService {
  generateOrderNumber(storeId) {
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const lastOrder = db.queryOne(
      `SELECT order_number FROM orders
       WHERE store_id = ? AND order_number LIKE ?
       ORDER BY id DESC LIMIT 1`,
      [storeId, `${datePrefix}%`]
    );

    if (!lastOrder) {
      return `${datePrefix}-001`;
    }

    const lastNumber = parseInt(lastOrder.order_number.split('-')[1], 10);
    const nextNumber = String(lastNumber + 1).padStart(3, '0');
    return `${datePrefix}-${nextNumber}`;
  }

  createManualOrder(storeId, serverId, tableId, items) {
    if (!items || items.length === 0) {
      throw new Error('Cannot create order without items');
    }

    const orderNumber = this.generateOrderNumber(storeId);

    let totalAmount = 0;
    for (const item of items) {
      const menuItem = db.queryOne(
        'SELECT base_price FROM menu_items WHERE id = ?',
        [item.menuItemId]
      );

      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }

      let itemTotal = menuItem.base_price * item.quantity;

      if (item.modifiers && item.modifiers.length > 0) {
        for (const modifier of item.modifiers) {
          itemTotal += (modifier.extra_price || 0) * item.quantity;
        }
      }

      totalAmount += itemTotal;
    }

    const orderResult = db.run(
      `INSERT INTO orders (
        store_id, server_id, table_id, customer_cart_id,
        order_number, status, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [storeId, serverId, tableId, null, orderNumber, ORDER_STATUS.RECEIVED, totalAmount]
    );

    const orderId = orderResult.lastInsertRowid;

    for (const item of items) {
      const menuItem = db.queryOne(
        'SELECT base_price FROM menu_items WHERE id = ?',
        [item.menuItemId]
      );

      db.run(
        `INSERT INTO order_items (
          order_id, menu_item_id, quantity, unit_price,
          modifiers_json, special_instructions, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.menuItemId, item.quantity, menuItem.base_price,
         item.modifiers ? JSON.stringify(item.modifiers) : null,
         item.specialInstructions || null, 'pending']
      );
    }

    logger.info(`Manual order created: ${orderNumber} by server ${serverId}`);

    // Emit socket event to kitchen
    const order = this.getOrder(orderId);
    emitToKitchen(storeId, SOCKET_EVENTS.ORDER_NEW, order);

    return { orderId, orderNumber, totalAmount };
  }

  createOrderFromCart(cartId, serverId) {
    const cart = cartService.getCartForReview(cartId);

    if (cart.status === CART_STATUS.SUBMITTED) {
      throw new Error('Cart already submitted');
    }

    if (cart.items.length === 0) {
      throw new Error('Cannot create order from empty cart');
    }

    cartService.markAsReviewed(cartId);

    const orderNumber = this.generateOrderNumber(cart.store_id);

    const orderResult = db.run(
      `INSERT INTO orders (
        store_id, server_id, table_id, customer_cart_id,
        order_number, status, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cart.store_id, serverId, cart.table_id, cartId, orderNumber, ORDER_STATUS.RECEIVED, cart.total_amount]
    );

    const orderId = orderResult.lastInsertRowid;

    for (const item of cart.items) {
      db.run(
        `INSERT INTO order_items (
          order_id, menu_item_id, quantity, unit_price,
          modifiers_json, special_instructions, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.menu_item_id, item.quantity, item.unit_price,
         item.modifiers_json, item.special_instructions, 'pending']
      );
    }

    db.run(
      'UPDATE customer_carts SET status = ? WHERE id = ?',
      [CART_STATUS.SUBMITTED, cartId]
    );

    logger.info(`Order created from cart ${cartId}: ${orderNumber}`);

    // Emit socket event to kitchen
    const order = this.getOrder(orderId);
    emitToKitchen(cart.store_id, SOCKET_EVENTS.ORDER_NEW, order);

    // Emit to customer table that order was submitted
    if (cart.table_id) {
      emitToTable(cart.table_id, SOCKET_EVENTS.ORDER_SUBMITTED, { orderId, orderNumber });
    }

    return { orderId, orderNumber };
  }

  getOrders(storeId, filters = {}) {
    let query = `
      SELECT o.*, u.name as server_name, t.table_number,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.server_id = u.id
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.store_id = ?
    `;
    const params = [storeId];

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }

    if (filters.serverId) {
      query += ' AND o.server_id = ?';
      params.push(filters.serverId);
    }

    query += ' ORDER BY o.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.query(query, params);
  }

  getOrder(orderId) {
    const order = db.queryOne(
      `SELECT o.*, u.name as server_name, t.table_number
       FROM orders o
       LEFT JOIN users u ON o.server_id = u.id
       LEFT JOIN tables t ON o.table_id = t.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!order) {
      throw new Error('Order not found');
    }

    const items = db.query(
      `SELECT oi.*, mi.name, mi.description
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return {
      ...order,
      items: items.map(item => ({
        ...item,
        modifiers: item.modifiers_json ? JSON.parse(item.modifiers_json) : []
      }))
    };
  }

  updateOrderStatus(orderId, status) {
    const order = db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      throw new Error('Order not found');
    }

    db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );

    if (status === ORDER_STATUS.PAID) {
      db.run(
        'UPDATE orders SET completed_time = CURRENT_TIMESTAMP WHERE id = ?',
        [orderId]
      );
    }

    logger.info(`Order ${orderId} status updated: ${status}`);

    // Emit socket events for status changes
    const updatedOrder = this.getOrder(orderId);
    emitToKitchen(order.store_id, SOCKET_EVENTS.ORDER_STATUS_CHANGE, updatedOrder);
    emitToServers(order.store_id, SOCKET_EVENTS.ORDER_STATUS_CHANGE, updatedOrder);

    // Notify customer table when order is ready
    if (status === ORDER_STATUS.READY && order.table_id) {
      emitToTable(order.table_id, SOCKET_EVENTS.ORDER_READY, updatedOrder);
    }
  }

  updateOrderItemStatus(orderItemId, status) {
    db.run(
      'UPDATE order_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderItemId]
    );

    const item = db.queryOne(
      'SELECT oi.*, o.store_id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.id = ?',
      [orderItemId]
    );

    if (status === 'preparing') {
      const orderHasPreparing = db.queryOne(
        `SELECT COUNT(*) as count FROM order_items
         WHERE order_id = ? AND status = 'preparing'`,
        [item.order_id]
      );

      if (orderHasPreparing.count > 0) {
        this.updateOrderStatus(item.order_id, ORDER_STATUS.PREPARING);
      }
    }

    if (status === 'ready') {
      const allReady = db.queryOne(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_count
         FROM order_items
         WHERE order_id = ?`,
        [item.order_id]
      );

      if (allReady.total === allReady.ready_count) {
        this.updateOrderStatus(item.order_id, ORDER_STATUS.READY);
      }
    }

    logger.info(`Order item ${orderItemId} status updated: ${status}`);

    // Emit socket event for item status change
    const order = this.getOrder(item.order_id);
    emitToKitchen(item.store_id, SOCKET_EVENTS.ORDER_ITEM_STATUS_CHANGE, { orderItemId, status, order });
    emitToServers(item.store_id, SOCKET_EVENTS.ORDER_ITEM_STATUS_CHANGE, { orderItemId, status, order });
  }

  getKitchenOrders(storeId) {
    return db.query(
      `SELECT o.*, t.table_number, u.name as server_name
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN users u ON o.server_id = u.id
       WHERE o.store_id = ? AND o.status IN ('received', 'preparing')
       ORDER BY o.order_time ASC`,
      [storeId]
    ).map(order => {
      const items = db.query(
        `SELECT oi.*, mi.name
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ? AND oi.status != 'cancelled'`,
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
  }
}

export default new OrderService();
