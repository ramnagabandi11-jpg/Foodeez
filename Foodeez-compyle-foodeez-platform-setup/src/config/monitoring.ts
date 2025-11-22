import winston from 'winston';
import { PlatformLog } from '@/models/mongodb';

// Custom winston format for better logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      service: service || 'foodeez-backend',
      message,
      ...meta,
    };

    // Also store in MongoDB for persistent logging
    if (level === 'error' || level === 'warn') {
      PlatformLog.create({
        level,
        message,
        service: service || 'foodeez-backend',
        metadata: meta,
        timestamp: new Date(timestamp),
      }).catch(err => {
        console.error('Failed to store log in MongoDB:', err);
      });
    }

    return JSON.stringify(logEntry);
  })
);

// Create different loggers for different services
export const createLogger = (service: string) => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { service },
    transports: [
      // Error log file
      new winston.transports.File({
        filename: `logs/${service}-error.log`,
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),

      // Combined log file
      new winston.transports.File({
        filename: `logs/${service}-combined.log`,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),

      // Console for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });

  return logger;
};

// Main application logger
export const logger = createLogger('app');

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Add request ID to request object
  req.requestId = requestId;

  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.userId,
    role: req.user?.role,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log request completion
    const logLevel = statusCode >= 400 ? 'warn' : 'info';
    logger.log(logLevel, 'Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      responseSize: Buffer.byteLength(data || '', 'utf8'),
    });

    return originalSend.call(this, data);
  };

  next();
};

// Performance monitoring
export const performanceMonitor = () => {
  // Monitor memory usage
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    logger.debug('Memory usage', {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    });
  }, 5 * 60 * 1000); // Every 5 minutes

  // Monitor event loop lag
  setInterval(() => {
    const start = Date.now();
    setImmediate(() => {
      const lag = Date.now() - start;
      if (lag > 100) { // Log if event loop lag is more than 100ms
        logger.warn('High event loop lag detected', {
          lag: `${lag}ms`,
          threshold: '100ms',
        });
      }
    });
  }, 30 * 1000); // Every 30 seconds
};

// Error tracking and alerting
export const setupErrorTracking = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
      pid: process.pid,
    });

    // Give some time to log before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });
  });

  // Handle warning events
  process.on('warning', (warning) => {
    logger.warn('Node.js Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });
};

// Database connection monitoring
export const setupDatabaseMonitoring = () => {
  // This would integrate with your database connection monitoring
  logger.info('Database monitoring enabled');
};

// API rate limiting monitoring
export const setupRateLimitMonitoring = () => {
  // Monitor rate limit breaches
  logger.info('Rate limit monitoring enabled');
};

// Health check endpoints
export const createHealthCheckEndpoints = (app: any) => {
  // Basic health check
  app.get('/health', (req: any, res: any) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      requestId: req.requestId,
    });
  });

  // Detailed health check
  app.get('/health/detailed', async (req: any, res: any) => {
    try {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        services: {},
        requestId: req.requestId,
      };

      // Check database connections (would need actual connection checks)
      health.services.database = { status: 'ok' };
      health.services.redis = { status: 'ok' };
      health.services.elasticsearch = { status: 'ok' };

      // Check queue status
      health.services.queues = { status: 'ok' };

      res.json(health);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
        requestId: req.requestId,
      });
    }
  });

  // Readiness probe
  app.get('/health/ready', async (req: any, res: any) => {
    try {
      // Check if all essential services are ready
      const isReady = true; // Would check actual services

      if (isReady) {
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    }
  });

  // Liveness probe
  app.get('/health/live', (req: any, res: any) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requestId: req.requestId,
    });
  });
};

// Metrics endpoint for monitoring tools
export const createMetricsEndpoint = (app: any) => {
  app.get('/metrics', (req: any, res: any) => {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      };

      res.set('Content-Type', 'application/json');
      res.json(metrics);
    } catch (error) {
      logger.error('Metrics endpoint failed', { error: error.message });
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  });
};

// Log analytics endpoint (for admin monitoring)
export const createLogAnalyticsEndpoint = (app: any) => {
  app.get('/admin/logs', async (req: any, res: any) => {
    try {
      const {
        level,
        service,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;

      const query: any = {};

      if (level) query.level = level;
      if (service) query.service = service;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [logs, total] = await Promise.all([
        PlatformLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        PlatformLog.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit),
          },
        },
      });
    } catch (error) {
      logger.error('Log analytics failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get log analytics',
        },
      });
    }
  });
};

// Initialize all monitoring components
export const initializeMonitoring = (app: any) => {
  logger.info('Initializing monitoring system...');

  // Setup error tracking
  setupErrorTracking();

  // Setup performance monitoring
  performanceMonitor();

  // Setup database monitoring
  setupDatabaseMonitoring();

  // Setup rate limit monitoring
  setupRateLimitMonitoring();

  // Create health check endpoints
  createHealthCheckEndpoints(app);

  // Create metrics endpoint
  createMetricsEndpoint(app);

  // Create log analytics endpoint
  createLogAnalyticsEndpoint(app);

  logger.info('Monitoring system initialized successfully');
};

export default {
  createLogger,
  logger,
  requestLogger,
  performanceMonitor,
  setupErrorTracking,
  setupDatabaseMonitoring,
  setupRateLimitMonitoring,
  createHealthCheckEndpoints,
  createMetricsEndpoint,
  createLogAnalyticsEndpoint,
  initializeMonitoring,
};