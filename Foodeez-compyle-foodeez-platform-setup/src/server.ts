import http from 'http';
import dotenv from 'dotenv';
import winston from 'winston';
import { createApp } from './app';
import {
  initializeDatabase,
  disconnectDatabase
} from '@/config/database';
import {
  initializeMongoDB,
  disconnectMongoDB
} from '@/config/mongodb';
import {
  testRedisConnection,
  disconnectRedis
} from '@/config/redis';
import {
  initializeElasticsearch,
  disconnectElasticsearch
} from '@/config/elasticsearch';
import { initializeSocketIO } from '@/sockets';

// Load environment variables
dotenv.config();

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'foodeez-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function initializeServices() {
  try {
    logger.info('Initializing services...');

    // Initialize PostgreSQL
    await initializeDatabase();
    logger.info('✓ PostgreSQL connected');

    // Initialize MongoDB
    await initializeMongoDB();
    logger.info('✓ MongoDB connected');

    // Initialize Redis
    await testRedisConnection();
    logger.info('✓ Redis connected');

    // Initialize Elasticsearch
    await initializeElasticsearch();
    logger.info('✓ Elasticsearch connected');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    // Initialize all services
    await initializeServices();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    initializeSocketIO(server);
    logger.info('✓ Socket.io initialized');

    // Start server
    server.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════╗
║          FoodeeZ Backend Server Started            ║
╠════════════════════════════════════════════════════╣
║ Environment: ${NODE_ENV.padEnd(44)}║
║ Port:        ${String(PORT).padEnd(44)}║
║ API:         http://localhost:${PORT}/v1${' '.repeat(32)}║
║ Health:      http://localhost:${PORT}/health${' '.repeat(27)}║
╚════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\nReceived ${signal}, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('Server closed');

        try {
          await disconnectDatabase();
          await disconnectMongoDB();
          await disconnectRedis();
          await disconnectElasticsearch();

          logger.info('All services disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exception
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
