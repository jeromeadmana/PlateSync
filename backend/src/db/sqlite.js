import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SQLiteDatabase {
  constructor() {
    this.db = null;
  }

  initialize() {
    try {
      const dbPath = path.resolve(config.database.sqlite.path);
      const dbDir = path.dirname(dbPath);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Created database directory: ${dbDir}`);
      }

      this.db = new Database(dbPath, { verbose: config.isDevelopment ? console.log : null });

      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

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
    return this.db.prepare(sql).all(params);
  }

  queryOne(sql, params = []) {
    return this.db.prepare(sql).get(params);
  }

  run(sql, params = []) {
    return this.db.prepare(sql).run(params);
  }

  transaction(callback) {
    const transactionFn = this.db.transaction(callback);
    return transactionFn();
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }
}

export default new SQLiteDatabase();
