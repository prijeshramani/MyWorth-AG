import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = (req as any).startTime || Date.now();
  const executionTimeMs = Date.now() - startTime;
  const correlationId = (req as any).correlationId || 'N/A';

  const statusCode = err instanceof AppError ? err.statusCode : (err.statusCode || 500);
  const errorCode = err instanceof AppError ? err.errorCode : 'INTERNAL_SERVER_ERROR';
  const category = statusCode >= 400 && statusCode < 500 ? 'CLIENT_ERROR' : 'SERVER_ERROR';
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    metadata: {
      executionTimeMs,
      apiVersion: 'v1.0'
    },
    correlationId,
    warnings: [],
    errors: [
      {
        code: errorCode,
        category,
        message,
        timestamp: new Date().toISOString()
      }
    ]
  });
}
