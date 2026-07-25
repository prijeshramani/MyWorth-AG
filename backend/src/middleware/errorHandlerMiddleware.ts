import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const correlationId = (req as any).correlationId;

  if (err instanceof AppError) {
    logger.warn(`Operational AppError [${err.errorCode}]: ${err.message}`, {
      correlationId,
      path: req.path,
      statusCode: err.statusCode
    });

    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details || []
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Unhandled operational / code exceptions
  logger.error(`Unhandled Exception: ${err.message}`, {
    correlationId,
    path: req.path,
    stack: err.stack
  });

  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
      details: []
    },
    timestamp: new Date().toISOString()
  });
}
