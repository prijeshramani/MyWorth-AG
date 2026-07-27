import { Request, Response, NextFunction } from 'express';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || `req_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  (req as any).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
}
