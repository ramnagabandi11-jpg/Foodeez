import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { IApiResponse } from '@/types';
import { AppError } from '@/utils/errors';
import routes from '@/routes';

export const createApp = (): Express => {
  const app = express();

  // Trust proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: [
      'http://localhost:3001', // Web frontend dev
      'http://localhost:3000', // Another common port
      process.env.FRONTEND_URL || 'http://localhost:3001'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // Compression middleware
  app.use(compression());

  // Logging middleware
  app.use(morgan('combined'));

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // API version endpoint
  app.get('/version', (_req: Request, res: Response) => {
    res.json({
      success: true,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API Routes
  app.use('/', routes);

  // 404 Not Found middleware
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`
      }
    } as IApiResponse);
  });

  // Global error handling middleware
  app.use((
    error: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    // Handle unhandled errors
    console.error('Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    } as IApiResponse);
  });

  return app;
};

export default createApp;
