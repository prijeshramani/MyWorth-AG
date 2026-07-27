import { Request, Response, NextFunction } from 'express';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  (req as any).startTime = startTime;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const correlationId = (req as any).correlationId || 'N/A';
    console.log(`[API Logging] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms | CorrelationId: ${correlationId}`);
  });

  next();
}
