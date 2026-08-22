import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { idempotencyRepository } from '../../repositories/SQLiteIdempotencyRepository';
import { CorrelationContext } from '../correlation/CorrelationContext';

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = (req.headers['idempotency-key'] as string) || (req.headers['x-idempotency-key'] as string);

  // If no idempotency key provided or safe method, continue normally
  if (!idempotencyKey || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cleanKey = idempotencyKey.trim();
  if (!cleanKey) {
    return next();
  }

  // Derive active familyId from context or request
  const familyId = CorrelationContext.getFamilyId() || (req.query.familyId ? Number(req.query.familyId) : (req as any).user?.family_id) || 1;
  const endpoint = `${req.method} ${req.baseUrl || ''}${req.path}`;
  
  // Create deterministic hash of request payload
  const payloadString = JSON.stringify(req.body || {});
  const requestHash = crypto.createHash('sha256').update(`${endpoint}:${payloadString}`).digest('hex');

  // Check if key already exists
  const existing = idempotencyRepository.findKey(cleanKey);

  if (existing) {
    // If different payload with same idempotency key, reject with 422
    if (existing.requestHash !== requestHash) {
      res.status(422).json({
        success: false,
        error: {
          code: 'IDEMPOTENCY_PAYLOAD_MISMATCH',
          message: 'The provided Idempotency-Key was previously used with a different request payload.'
        }
      });
      return;
    }

    // If still in-flight (responseStatus is null), return 409 Conflict
    if (existing.responseStatus === null) {
      res.status(409).json({
        success: false,
        error: {
          code: 'IDEMPOTENCY_IN_FLIGHT',
          message: 'A request with this Idempotency-Key is currently being processed.'
        }
      });
      return;
    }

    // Replay cached response
    res.setHeader('X-Cache', 'IDEMPOTENT_HIT');
    res.status(existing.responseStatus).json(existing.responseBody);
    return;
  }

  // Attempt to reserve the key
  const reserved = idempotencyRepository.reserveKey(cleanKey, familyId, endpoint, requestHash, 86400);
  if (!reserved) {
    res.status(409).json({
      success: false,
      error: {
        code: 'IDEMPOTENCY_RACE_CONDITION',
        message: 'Could not acquire lock for Idempotency-Key.'
      }
    });
    return;
  }

  // Intercept response to save body and status
  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    try {
      idempotencyRepository.saveResponse(cleanKey, res.statusCode, body);
    } catch (err) {
      console.warn('Failed to cache idempotent response:', err);
    }
    return originalJson(body);
  };

  next();
}
