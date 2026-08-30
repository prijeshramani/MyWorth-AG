import express, { Express } from 'express';
import cors from 'cors';
import { correlationIdMiddleware } from './middleware/correlationIdMiddleware';
import { requestLoggingMiddleware } from './middleware/requestLoggingMiddleware';
import { helmetSecurityMiddleware } from './middleware/helmetSecurityMiddleware';
import { rateLimiterMiddleware } from './middleware/rateLimiterMiddleware';
import { requestTimeoutMiddleware } from './middleware/requestTimeoutMiddleware';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import routes from './routes';
import healthRoutes from './routes/healthRoutes';
import swaggerRoutes from './routes/swaggerRoutes';

export function createApp(): Express {
  const app = express();

  // Trusted proxy settings for cloud / reverse proxy deployments
  app.set('trust proxy', 1);

  // Security HTTP Headers & CORS
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Idempotency-Key', 'X-Family-Id', 'x-family-id']
  }));
  app.use(helmetSecurityMiddleware);

  // Request Body Size Limit (1MB)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Correlation ID, Rate Limiting & Timeout Middlewares
  app.use(correlationIdMiddleware);
  app.use(rateLimiterMiddleware);
  app.use(requestTimeoutMiddleware);
  app.use(requestLoggingMiddleware);

  // Developer Portal & Interactive Swagger Documentation
  app.use('/api-docs', swaggerRoutes);

  // Observability Health Routes
  app.use('/health', healthRoutes);

  // Mount API v1 routes
  app.use('/api/v1', routes);

  // Standard Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
