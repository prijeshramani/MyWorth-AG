import { Request, Response, NextFunction } from 'express';

const TIMEOUT_MS = 15000; // 15 seconds timeout

export function requestTimeoutMiddleware(req: Request, res: Response, next: NextFunction): void {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        metadata: {
          executionTimeMs: TIMEOUT_MS,
          apiVersion: 'v1.0'
        },
        correlationId: (req as any).correlationId || 'N/A',
        warnings: [],
        errors: [
          {
            code: 'REQUEST_TIMEOUT',
            category: 'SERVER_ERROR',
            message: 'Request execution timed out after 15 seconds',
            timestamp: new Date().toISOString()
          }
        ]
      });
    }
  }, TIMEOUT_MS);

  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));

  next();
}
