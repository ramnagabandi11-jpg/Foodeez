import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { IApiResponse, AppError } from '@/types';
import routes from '@/routes';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { securityMiddleware } from '@/middleware/security';
import { authMiddleware } from '@/middleware/auth';
import { roleMiddleware } from '@/middleware/role';
import { validateApiKey } from '@/middleware/apiKey';
import { uploadMiddleware } from '@/middleware/upload';

export const createApp = (): Express => {
  const app = express();

  // Trust proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(securityMiddleware);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  const corsOptions = {
    origin: [
      'http://localhost:3000', // Customer Web
      'http://localhost:3001', // Restaurant Web
      'http://localhost:3002', // Admin Web
      'http://localhost:3003', // Super Admin Web
      'http://localhost:3004', // HR Web
      'http://localhost:3005', // Finance Web
      'http://localhost:3006', // Support Web
      'http://localhost:3007', // Area Manager Web
      'http://localhost:3008', // KAM Web
      'https://foodez-customer.vercel.app',
      'https://foodez-restaurant.vercel.app',
      'https://foodez-admin.vercel.app',
      'https://foodez-hr.vercel.app',
      'https://foodez-finance.vercel.app',
      'https://foodez-support.vercel.app',
      'https://foodez-area-manager.vercel.app',
      'https://foodez-kam.vercel.app',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin', 'X-Requested-With', 'Content-Type',
      'Accept', 'Authorization', 'X-API-Key',
      'X-Device-ID', 'X-Platform', 'X-Version'
    ],
  };

  app.use(cors(corsOptions));

  // Compression middleware
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // Body parsing middleware
  app.use(express.json({
    limit: '50mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 100000
  }));

  // Cookie parser
  app.use(cookieParser());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);

  // Health check endpoint (before auth)
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Foodeez Platform is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      modules: {
        customer: 'active',
        restaurant: 'active',
        driver: 'active',
        admin: 'active',
        'super-admin': 'active',
        manager: 'active',
        hr: 'active',
        finance: 'active',
        'customer-support': 'active',
        'area-manager': 'active',
        'key-account-manager': 'active'
      }
    });
  });

  // API info endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to Foodeez Platform API',
      version: 'v1',
      endpoints: {
        'Customer Module': '/api/v1/customer',
        'Restaurant Module': '/api/v1/restaurant',
        'Driver Module': '/api/v1/driver',
        'Admin Module': '/api/v1/admin',
        'Super Admin Module': '/api/v1/super-admin',
        'Manager Module': '/api/v1/manager',
        'HR Module': '/api/v1/hr',
        'Finance Module': '/api/v1/finance',
        'Customer Support Module': '/api/v1/support',
        'Area Manager Module': '/api/v1/area-manager',
        'Key Account Manager Module': '/api/v1/key-account-manager'
      },
      documentation: '/api/docs',
      health: '/health'
    });
  });

  // API Routes with authentication
  app.use('/api/v1/customer', authMiddleware, roleMiddleware(['customer']), routes.customer);
  app.use('/api/v1/restaurant', authMiddleware, roleMiddleware(['restaurant_owner', 'restaurant_manager', 'restaurant_staff', 'chef']), routes.restaurant);
  app.use('/api/v1/driver', authMiddleware, roleMiddleware(['delivery_driver', 'delivery_manager', 'dispatch_manager']), routes.driver);
  app.use('/api/v1/admin', authMiddleware, roleMiddleware(['admin', 'manager']), routes.admin);
  app.use('/api/v1/super-admin', authMiddleware, roleMiddleware(['super_admin', 'system_admin']), routes.superAdmin);
  app.use('/api/v1/manager', authMiddleware, roleMiddleware(['manager', 'area_manager', 'regional_manager', 'operations_manager', 'city_manager']), routes.manager);
  app.use('/api/v1/hr', authMiddleware, roleMiddleware(['hr_staff', 'hr_manager', 'hr_director', 'recruitment_specialist']), routes.hr);
  app.use('/api/v1/finance', authMiddleware, roleMiddleware(['finance_staff', 'finance_manager', 'finance_director', 'accountant']), routes.finance);
  app.use('/api/v1/support', authMiddleware, roleMiddleware(['customer_support', 'support_manager', 'quality_analyst']), routes.support);
  app.use('/api/v1/area-manager', authMiddleware, roleMiddleware(['area_manager', 'regional_manager']), routes.areaManager);
  app.use('/api/v1/key-account-manager', authMiddleware, roleMiddleware(['key_account_manager', 'business_development', 'sales_manager', 'partner_success_manager']), routes.keyAccountManager);

  // Public routes (no authentication required)
  app.use('/api/v1/public', routes.public);

  // External API routes (API key authentication)
  app.use('/api/v1/external', validateApiKey, routes.external);

  // Webhook routes
  app.use('/api/v1/webhooks', routes.webhooks);

  // File upload routes
  app.use('/api/v1/upload', authMiddleware, uploadMiddleware, routes.upload);

  // 404 Not Found handler
  app.use(notFoundHandler);

  // Global error handling middleware
  app.use(errorHandler);

  return app;
};

export default createApp;