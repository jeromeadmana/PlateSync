import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  database: {
    type: process.env.DATABASE_TYPE || 'sqlite',
    sqlite: {
      path: process.env.SQLITE_DB_PATH || './data/platesync.db'
    },
    supabase: {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    }
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-CHANGE-THIS',
    jwtExpiry: process.env.JWT_EXPIRY || '30d',
    bcryptRounds: 10
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },

  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880
  },

  cart: {
    timeoutMinutes: parseInt(process.env.CART_TIMEOUT_MINUTES, 10) || 10
  },

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

if (config.isDevelopment && config.auth.jwtSecret === 'fallback-secret-CHANGE-THIS') {
  console.warn('WARNING: Using fallback JWT secret. Set JWT_SECRET in .env for production.');
}

export default config;
