import bcrypt from 'bcrypt';
import db from '../index.js';
import config from '../../config/index.js';

async function seed() {
  try {
    console.log('Starting database seeding...');

    await db.initialize();

    console.log('Checking if data already exists...');
    const existingCompany = db.queryOne('SELECT id FROM companies LIMIT 1');
    if (existingCompany) {
      console.log('Database already seeded. Skipping...');
      return;
    }

    console.log('Seeding companies...');
    const company1 = db.run(`
      INSERT INTO companies (name, subscription_status)
      VALUES (?, ?)
    `, ['Demo Restaurant Group', 'active']);

    const companyId = company1.lastInsertRowid;

    console.log('Seeding stores...');
    const store1 = db.run(`
      INSERT INTO stores (company_id, name, address, status)
      VALUES (?, ?, ?, ?)
    `, [companyId, 'Downtown Branch', '123 Main St, City Center', 'active']);

    const storeId = store1.lastInsertRowid;

    console.log('Seeding theme settings...');
    db.run(`
      INSERT INTO theme_settings (
        company_id, store_id, primary_color, secondary_color,
        customer_welcome_message
      ) VALUES (?, NULL, ?, ?, ?)
    `, [companyId, '#2563eb', '#dc2626', 'Welcome to Demo Restaurant!']);

    db.run(`
      INSERT INTO theme_settings (
        company_id, store_id, primary_color, accent_color
      ) VALUES (?, ?, ?, ?)
    `, [companyId, storeId, '#1e40af', '#f59e0b']);

    console.log('Seeding users...');
    const passwordHash = await bcrypt.hash('admin123', config.auth.bcryptRounds);

    db.run(`
      INSERT INTO users (
        company_id, store_id, email, password_hash, name,
        employee_id, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [companyId, null, 'admin@demo.com', passwordHash, 'Super Admin', '0000', 'super_admin', 'active']);

    db.run(`
      INSERT INTO users (
        company_id, store_id, email, password_hash, name,
        employee_id, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [companyId, storeId, 'manager@demo.com', passwordHash, 'Store Manager', '1001', 'store_admin', 'active']);

    db.run(`
      INSERT INTO users (
        company_id, store_id, email, password_hash, name,
        employee_id, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [companyId, storeId, 'server@demo.com', passwordHash, 'John Server', '2001', 'server', 'active']);

    db.run(`
      INSERT INTO users (
        company_id, store_id, email, password_hash, name,
        employee_id, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [companyId, storeId, 'cook@demo.com', passwordHash, 'Jane Cook', '3001', 'cook', 'active']);

    db.run(`
      INSERT INTO users (
        company_id, store_id, email, password_hash, name,
        employee_id, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [companyId, storeId, 'cashier@demo.com', passwordHash, 'Bob Cashier', '4001', 'cashier', 'active']);

    console.log('Seeding categories...');
    const appetizers = db.run(`
      INSERT INTO categories (store_id, name, sort_order)
      VALUES (?, ?, ?)
    `, [storeId, 'Appetizers', 1]);

    const mains = db.run(`
      INSERT INTO categories (store_id, name, sort_order)
      VALUES (?, ?, ?)
    `, [storeId, 'Main Courses', 2]);

    const drinks = db.run(`
      INSERT INTO categories (store_id, name, sort_order)
      VALUES (?, ?, ?)
    `, [storeId, 'Drinks', 3]);

    const desserts = db.run(`
      INSERT INTO categories (store_id, name, sort_order)
      VALUES (?, ?, ?)
    `, [storeId, 'Desserts', 4]);

    console.log('Seeding menu items...');
    const springRolls = db.run(`
      INSERT INTO menu_items (store_id, category_id, name, description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [storeId, appetizers.lastInsertRowid, 'Spring Rolls', 'Crispy vegetable spring rolls served with sweet chili sauce', 6.99, 'active']);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [springRolls.lastInsertRowid, 'Extra Sauce', 0.50]);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [springRolls.lastInsertRowid, 'Spicy Version', 0.00]);

    const garlicBread = db.run(`
      INSERT INTO menu_items (store_id, category_id, name, description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [storeId, appetizers.lastInsertRowid, 'Garlic Bread', 'Toasted bread with garlic butter and herbs', 4.99, 'active']);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [garlicBread.lastInsertRowid, 'Extra Cheese', 1.50]);

    const burger = db.run(`
      INSERT INTO menu_items (store_id, category_id, name, description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [storeId, mains.lastInsertRowid, 'Classic Burger', 'Beef patty with lettuce, tomato, onion, and special sauce', 12.99, 'active']);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [burger.lastInsertRowid, 'Extra Patty', 3.00]);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [burger.lastInsertRowid, 'Bacon', 2.00]);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [burger.lastInsertRowid, 'No Onions', 0.00]);

    const pasta = db.run(`
      INSERT INTO menu_items (store_id, category_id, name, description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [storeId, mains.lastInsertRowid, 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan cheese', 14.99, 'active']);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [pasta.lastInsertRowid, 'Gluten-Free Pasta', 2.00]);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [pasta.lastInsertRowid, 'Extra Bacon', 2.50]);

    const soda = db.run(`
      INSERT INTO menu_items (store_id, category_id, name, description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [storeId, drinks.lastInsertRowid, 'Soft Drink', 'Choice of cola, lemon-lime, or orange', 2.99, 'active']);

    const coffee = db.run(`
      INSERT INTO menu_items (store_id, category_id, name, description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [storeId, drinks.lastInsertRowid, 'Coffee', 'Freshly brewed coffee', 3.49, 'active']);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [coffee.lastInsertRowid, 'Extra Shot', 1.00]);

    const iceCream = db.run(`
      INSERT INTO menu_items (store_id, category_id, name, description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [storeId, desserts.lastInsertRowid, 'Ice Cream', 'Two scoops of vanilla, chocolate, or strawberry', 5.99, 'active']);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [iceCream.lastInsertRowid, 'Extra Scoop', 2.00]);

    db.run(`
      INSERT INTO modifiers (menu_item_id, name, extra_price)
      VALUES (?, ?, ?)
    `, [iceCream.lastInsertRowid, 'Chocolate Sauce', 0.75]);

    console.log('Seeding tables...');
    for (let i = 1; i <= 10; i++) {
      db.run(`
        INSERT INTO tables (store_id, table_number, status, tablet_url)
        VALUES (?, ?, ?, ?)
      `, [storeId, i.toString(), 'available', `http://192.168.1.100:3000/table/${i}`]);
    }

    console.log('Database seeding completed successfully!');
    console.log('');
    console.log('=== Test Accounts ===');
    console.log('Super Admin:');
    console.log('  Email: admin@demo.com');
    console.log('  Password: admin123');
    console.log('  Employee ID: 0000');
    console.log('');
    console.log('Store Manager:');
    console.log('  Email: manager@demo.com');
    console.log('  Password: admin123');
    console.log('  Employee ID: 1001');
    console.log('');
    console.log('Server:');
    console.log('  Email: server@demo.com');
    console.log('  Password: admin123');
    console.log('  Employee ID: 2001');
    console.log('');
    console.log('Cook:');
    console.log('  Email: cook@demo.com');
    console.log('  Password: admin123');
    console.log('  Employee ID: 3001');
    console.log('');
    console.log('Cashier:');
    console.log('  Email: cashier@demo.com');
    console.log('  Password: admin123');
    console.log('  Employee ID: 4001');
    console.log('');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

seed();
