import config from '../config/index.js';
import sqliteDb from './sqlite.js';

class Database {
  constructor() {
    this.client = null;
    this.type = config.database.type;
  }

  async initialize() {
    if (this.type === 'sqlite') {
      this.client = sqliteDb;
      this.client.initialize();
    } else if (this.type === 'supabase') {
      throw new Error('Supabase not implemented yet. Use DATABASE_TYPE=sqlite');
    } else {
      throw new Error(`Unsupported database type: ${this.type}`);
    }

    console.log(`Database type: ${this.type}`);
    return this.client;
  }

  query(sql, params = []) {
    return this.client.query(sql, params);
  }

  queryOne(sql, params = []) {
    return this.client.queryOne(sql, params);
  }

  run(sql, params = []) {
    return this.client.run(sql, params);
  }

  transaction(callback) {
    return this.client.transaction(callback);
  }

  getConnection() {
    return this.client.getConnection();
  }

  close() {
    if (this.client) {
      this.client.close();
    }
  }
}

export default new Database();
