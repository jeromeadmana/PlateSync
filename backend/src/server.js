import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import config from './config/index.js';
import db from './db/index.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initializeSocket } from './sockets/index.js';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import customerRoutes from './routes/customer.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import tableRoutes from './routes/tables.js';
import adminRoutes from './routes/admin.js';

const app = express();
const httpServer = createServer(app);

initializeSocket(httpServer);

app.use(cors(config.cors));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(config.upload.path));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PlateSync API is running',
    timestamp: new Date().toISOString(),
    database: config.database.type
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    logger.info('Initializing PlateSync backend...');

    await db.initialize();

    const testQuery = db.queryOne('SELECT COUNT(*) as count FROM companies');
    logger.info(`Database connected. Companies count: ${testQuery.count}`);

    httpServer.listen(config.port, config.host, () => {
      logger.info('='.repeat(50));
      logger.info(`PlateSync Backend Server Started`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Database: ${config.database.type}`);
      logger.info(`Server: http://${config.host}:${config.port}`);
      logger.info(`Health check: http://${config.host}:${config.port}/api/health`);
      logger.info('='.repeat(50));
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    db.close();
    process.exit(0);
  });
});

startServer();

export default app;
