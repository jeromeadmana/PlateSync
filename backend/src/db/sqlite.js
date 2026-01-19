import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.SQL = null;
  }

  async initialize() {
    try {
      const dbPath = path.resolve(config.database.sqlite.path);
      const dbDir = path.dirname(dbPath);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Created database directory: ${dbDir}`);
      }

      // Initialize sql.js
      this.SQL = await initSqlJs();

      // Load existing database or create new one
      if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        this.db = new this.SQL.Database(buffer);
        console.log(`Loaded existing database: ${dbPath}`);
      } else {
        this.db = new this.SQL.Database();
        console.log(`Created new database: ${dbPath}`);
      }

      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');

      console.log(`SQLite database initialized: ${dbPath}`);
      return this.db;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  queryOne(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  }

  run(sql, params = []) {
    this.db.run(sql, params);
    const changes = this.db.getRowsModified();
    const lastID = this.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];
    this.save(); // Persist changes to disk
    return { changes, lastInsertRowid: lastID };
  }

  runBatch(sql) {
    // Execute multiple statements at once (for migrations)
    this.db.run(sql);
    this.save();
  }

  transaction(callback) {
    try {
      this.db.run('BEGIN TRANSACTION');
      const result = callback();
      this.db.run('COMMIT');
      this.save(); // Persist changes to disk
      return result;
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }

  save() {
    // Persist database to disk
    const dbPath = path.resolve(config.database.sqlite.path);
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }

  close() {
    if (this.db) {
      this.save(); // Final save before closing
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

export default new SQLiteDatabase();
