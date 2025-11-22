import http from 'http';
import dotenv from 'dotenv';
import winston from 'winston';
import { createApp } from './app';
import { initializeDatabase, disconnectDatabase } from '@/config/database';
import { initializeMongoDB, disconnectMongoDB } from '@/config/mongodb';
import { initializeRedis, disconnectRedis } from '@/config/redis';
import { initializeElasticsearch, disconnectElasticsearch } from '@/config/elasticsearch';
import { initializeSocketIO } from '@/config/socket';
import { startWorkers } from '@/workers';
import { startSchedulers } from '@/schedulers';
import { healthCheck } from '@/utils/healthCheck';

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
  defaultMeta: { service: 'foodeez-unified-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function initializeServices() {
  try {
    logger.info('Initializing Foodeez Platform Services...');

    // Initialize PostgreSQL
    await initializeDatabase();
    logger.info('✅ PostgreSQL connected');

    // Initialize MongoDB
    await initializeMongoDB();
    logger.info('✅ MongoDB connected');

    // Initialize Redis
    await initializeRedis();
    logger.info('✅ Redis connected');

    // Initialize Elasticsearch
    await initializeElasticsearch();
    logger.info('✅ Elasticsearch connected');

    // Start background workers
    await startWorkers();
    logger.info('✅ Background workers started');

    // Start schedulers
    await startSchedulers();
    logger.info('✅ Task schedulers started');

    logger.info('🎉 All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    // Initialize all services
    await initializeServices();

    // Create Express app
    const app = createApp();

    // Health check endpoint
    app.get('/health', healthCheck);

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    initializeSocketIO(server);
    logger.info('✅ Socket.io initialized');

    // Start server
    server.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════╗
║          🍽️ Foodeez Platform Backend              ║
╠════════════════════════════════════════════════════╣
║ Environment: ${NODE_ENV.padEnd(44)}║
║ Port:        ${String(PORT).padEnd(44)}║
║ API:         http://localhost:${PORT}/api/v1${' '.repeat(25)}║
║ Health:      http://localhost:${PORT}/health${' '.repeat(20)}║
║ Socket.io:   ws://localhost:${PORT}${' '.repeat(28)}║
║ Modules:     Customer, Restaurant, Driver, Admin,      ║
║              HR, Finance, Support, Area Manager, KAM   ║
╚════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n🛑 Received ${signal}, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('📡 Server closed');

        try {
          await disconnectDatabase();
          await disconnectMongoDB();
          await disconnectRedis();
          await disconnectElasticsearch();

          logger.info('🗄️ All services disconnected');
          logger.info('👋 Foodeez Platform shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('💥 Fatal error:', error);
  process.exit(1);
});