import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../config/constants.js';
import logger from '../utils/logger.js';

let io = null;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:store', (storeId) => {
      socket.join(`store:${storeId}`);
      logger.info(`Socket ${socket.id} joined store:${storeId}`);
    });

    socket.on('join:kitchen', (storeId) => {
      socket.join(`kitchen:${storeId}`);
      logger.info(`Socket ${socket.id} joined kitchen:${storeId}`);
    });

    socket.on('join:server', (storeId) => {
      socket.join(`server:${storeId}`);
      logger.info(`Socket ${socket.id} joined server:${storeId}`);
    });

    socket.on('join:cashier', (storeId) => {
      socket.join(`cashier:${storeId}`);
      logger.info(`Socket ${socket.id} joined cashier:${storeId}`);
    });

    socket.on('join:table', (tableId) => {
      socket.join(`table:${tableId}`);
      logger.info(`Socket ${socket.id} joined table:${tableId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
  }
  return io;
}

export function emitToStore(storeId, event, data) {
  if (!io) return;
  io.to(`store:${storeId}`).emit(event, data);
}

export function emitToKitchen(storeId, event, data) {
  if (!io) return;
  io.to(`kitchen:${storeId}`).emit(event, data);
  logger.info(`Emitted ${event} to kitchen:${storeId}`);
}

export function emitToServers(storeId, event, data) {
  if (!io) return;
  io.to(`server:${storeId}`).emit(event, data);
  logger.info(`Emitted ${event} to server:${storeId}`);
}

export function emitToCashiers(storeId, event, data) {
  if (!io) return;
  io.to(`cashier:${storeId}`).emit(event, data);
}

export function emitToTable(tableId, event, data) {
  if (!io) return;
  io.to(`table:${tableId}`).emit(event, data);
  logger.info(`Emitted ${event} to table:${tableId}`);
}

export function broadcastToAll(event, data) {
  if (!io) return;
  io.emit(event, data);
}

export { SOCKET_EVENTS };
