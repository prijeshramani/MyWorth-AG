import express, { Express } from 'express';
import cors from 'cors';
import { correlationIdMiddleware } from './middleware/correlationIdMiddleware';
import { requestLoggingMiddleware } from './middleware/requestLoggingMiddleware';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);

  // Mount API v1 routes
  app.use('/api/v1', routes);

  // Standard Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
