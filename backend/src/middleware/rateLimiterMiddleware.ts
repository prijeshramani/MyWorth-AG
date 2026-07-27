import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;    // 100 requests per minute

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let record = ipStore.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + WINDOW_MS };
    ipStore.set(ip, record);
  } else {
    record.count++;
  }

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

  if (record.count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      metadata: {
        executionTimeMs: 0,
        apiVersion: 'v1.0'
      },
      correlationId: (req as any).correlationId || 'N/A',
      warnings: [],
      errors: [
        {
          code: 'TOO_MANY_REQUESTS',
          category: 'CLIENT_ERROR',
          message: 'Too many requests. Please wait a minute before retrying.',
          timestamp: new Date().toISOString()
        }
      ]
    });
    return;
  }

  next();
}

export function resetRateLimiterStore(): void {
  ipStore.clear();
}
