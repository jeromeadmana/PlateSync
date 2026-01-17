import db from '../db/index.js';
import { CART_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';

class CartService {
  getActiveCart(tableId) {
    let cart = db.queryOne(
      `SELECT * FROM customer_carts
       WHERE table_id = ? AND status IN ('draft', 'ready_for_review')
       ORDER BY created_at DESC
       LIMIT 1`,
      [tableId]
    );

    if (!cart) {
      const table = db.queryOne('SELECT store_id FROM tables WHERE id = ?', [tableId]);
      if (!table) {
        throw new Error('Table not found');
      }

      const result = db.run(
        'INSERT INTO customer_carts (table_id, store_id, status, total_amount) VALUES (?, ?, ?, ?)',
        [tableId, table.store_id, CART_STATUS.DRAFT, 0]
      );

      cart = db.queryOne('SELECT * FROM customer_carts WHERE id = ?', [result.lastInsertRowid]);
    }

    const items = db.query(
      `SELECT cci.*, mi.name, mi.image_url, mi.description
       FROM customer_cart_items cci
       JOIN menu_items mi ON cci.menu_item_id = mi.id
       WHERE cci.cart_id = ?`,
      [cart.id]
    );

    return {
      ...cart,
      items: items.map(item => ({
        ...item,
        modifiers: item.modifiers_json ? JSON.parse(item.modifiers_json) : []
      }))
    };
  }

  addItem(tableId, itemData) {
    const cart = this.getActiveCart(tableId);

    if (cart.status !== CART_STATUS.DRAFT) {
      throw new Error('Cannot modify cart that is not in draft status');
    }

    const { menuItemId, quantity, modifiers, specialInstructions } = itemData;

    const menuItem = db.queryOne('SELECT * FROM menu_items WHERE id = ?', [menuItemId]);
    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    if (menuItem.status !== 'active') {
      throw new Error('Menu item is not available');
    }

    let unitPrice = menuItem.base_price;
    if (modifiers && modifiers.length > 0) {
      const modifierIds = modifiers.map(m => m.id);
      const dbModifiers = db.query(
        `SELECT * FROM modifiers WHERE id IN (${modifierIds.join(',')})`,
        []
      );
      unitPrice += dbModifiers.reduce((sum, mod) => sum + mod.extra_price, 0);
    }

    const result = db.run(
      `INSERT INTO customer_cart_items (cart_id, menu_item_id, quantity, unit_price, modifiers_json, special_instructions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cart.id, menuItemId, quantity, unitPrice, JSON.stringify(modifiers || []), specialInstructions || null]
    );

    this.updateCartTotal(cart.id);

    logger.info(`Item added to cart ${cart.id}: ${menuItem.name} x${quantity}`);

    return result.lastInsertRowid;
  }

  updateItem(cartItemId, quantity) {
    const item = db.queryOne('SELECT * FROM customer_cart_items WHERE id = ?', [cartItemId]);
    if (!item) {
      throw new Error('Cart item not found');
    }

    db.run(
      'UPDATE customer_cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, cartItemId]
    );

    this.updateCartTotal(item.cart_id);

    logger.info(`Cart item ${cartItemId} updated: quantity = ${quantity}`);
  }

  removeItem(cartItemId) {
    const item = db.queryOne('SELECT cart_id FROM customer_cart_items WHERE id = ?', [cartItemId]);
    if (!item) {
      throw new Error('Cart item not found');
    }

    db.run('DELETE FROM customer_cart_items WHERE id = ?', [cartItemId]);

    this.updateCartTotal(item.cart_id);

    logger.info(`Cart item ${cartItemId} removed`);
  }

  updateCartTotal(cartId) {
    const result = db.queryOne(
      `SELECT SUM(quantity * unit_price) as total
       FROM customer_cart_items
       WHERE cart_id = ?`,
      [cartId]
    );

    const total = result.total || 0;

    db.run(
      'UPDATE customer_carts SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [total, cartId]
    );
  }

  callServer(tableId) {
    const cart = this.getActiveCart(tableId);

    if (cart.items.length === 0) {
      throw new Error('Cannot call server with empty cart');
    }

    db.run(
      'UPDATE customer_carts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [CART_STATUS.READY_FOR_REVIEW, cart.id]
    );

    db.run(
      'UPDATE tables SET status = ? WHERE id = ?',
      ['occupied', tableId]
    );

    logger.info(`Server called for table ${tableId}, cart ${cart.id}`);

    return cart.id;
  }

  getPendingReviews(storeId) {
    return db.query(
      `SELECT c.*, t.table_number,
              (SELECT COUNT(*) FROM customer_cart_items WHERE cart_id = c.id) as item_count
       FROM customer_carts c
       JOIN tables t ON c.table_id = t.id
       WHERE c.store_id = ? AND c.status = ?
       ORDER BY c.updated_at ASC`,
      [storeId, CART_STATUS.READY_FOR_REVIEW]
    );
  }

  getCartForReview(cartId) {
    const cart = db.queryOne('SELECT * FROM customer_carts WHERE id = ?', [cartId]);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const table = db.queryOne('SELECT * FROM tables WHERE id = ?', [cart.table_id]);

    const items = db.query(
      `SELECT cci.*, mi.name, mi.description, mi.image_url
       FROM customer_cart_items cci
       JOIN menu_items mi ON cci.menu_item_id = mi.id
       WHERE cci.cart_id = ?`,
      [cartId]
    );

    return {
      ...cart,
      table,
      items: items.map(item => ({
        ...item,
        modifiers: item.modifiers_json ? JSON.parse(item.modifiers_json) : []
      }))
    };
  }

  markAsReviewed(cartId) {
    db.run(
      'UPDATE customer_carts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [CART_STATUS.REVIEWED, cartId]
    );
  }
}

export default new CartService();
