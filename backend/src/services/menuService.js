import db from '../db/index.js';
import logger from '../utils/logger.js';

class MenuService {
  getCategories(storeId) {
    return db.query(
      'SELECT * FROM categories WHERE store_id = ? ORDER BY sort_order, name',
      [storeId]
    );
  }

  getMenuItems(storeId, categoryId = null) {
    let query = `
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.store_id = ?
    `;
    const params = [storeId];

    if (categoryId) {
      query += ' AND mi.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY c.sort_order, mi.name';

    return db.query(query, params);
  }

  getMenuItem(id) {
    const item = db.queryOne(
      `SELECT mi.*, c.name as category_name
       FROM menu_items mi
       LEFT JOIN categories c ON mi.category_id = c.id
       WHERE mi.id = ?`,
      [id]
    );

    if (!item) {
      throw new Error('Menu item not found');
    }

    const modifiers = db.query(
      'SELECT * FROM modifiers WHERE menu_item_id = ?',
      [id]
    );

    return {
      ...item,
      modifiers
    };
  }

  getActiveMenu(storeId) {
    const categories = db.query(
      `SELECT * FROM categories
       WHERE store_id = ?
       ORDER BY sort_order, name`,
      [storeId]
    );

    const items = db.query(
      `SELECT mi.*, c.id as category_id, c.name as category_name
       FROM menu_items mi
       LEFT JOIN categories c ON mi.category_id = c.id
       WHERE mi.store_id = ? AND mi.status = 'active'
       ORDER BY c.sort_order, mi.name`,
      [storeId]
    );

    const menuWithModifiers = items.map(item => {
      const modifiers = db.query(
        'SELECT * FROM modifiers WHERE menu_item_id = ?',
        [item.id]
      );
      return { ...item, modifiers };
    });

    return categories.map(category => ({
      ...category,
      items: menuWithModifiers.filter(item => item.category_id === category.id)
    }));
  }

  createMenuItem(data) {
    const { storeId, categoryId, name, description, basePrice, imageUrl, status } = data;

    const result = db.run(
      `INSERT INTO menu_items (store_id, category_id, name, description, base_price, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [storeId, categoryId || null, name, description || null, basePrice, imageUrl || null, status || 'active']
    );

    logger.info(`Menu item created: ${name} (ID: ${result.lastInsertRowid})`);

    return result.lastInsertRowid;
  }

  updateMenuItem(id, data) {
    const { name, description, basePrice, imageUrl, status, categoryId } = data;

    db.run(
      `UPDATE menu_items
       SET name = ?, description = ?, base_price = ?, image_url = ?,
           status = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, basePrice, imageUrl, status, categoryId, id]
    );

    logger.info(`Menu item updated: ID ${id}`);
  }

  deleteMenuItem(id) {
    db.run('DELETE FROM menu_items WHERE id = ?', [id]);
    logger.info(`Menu item deleted: ID ${id}`);
  }

  addModifier(menuItemId, name, extraPrice) {
    const result = db.run(
      'INSERT INTO modifiers (menu_item_id, name, extra_price) VALUES (?, ?, ?)',
      [menuItemId, name, extraPrice]
    );

    logger.info(`Modifier added to item ${menuItemId}: ${name}`);
    return result.lastInsertRowid;
  }

  deleteModifier(id) {
    db.run('DELETE FROM modifiers WHERE id = ?', [id]);
    logger.info(`Modifier deleted: ID ${id}`);
  }
}

export default new MenuService();
