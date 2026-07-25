import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export function correlationMiddleware(req: CorrelatedRequest, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-correlation-id'] as string;
  const correlationId = existingId || `req_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
  
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
}
