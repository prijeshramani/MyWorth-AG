import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { CorrelationContext, CorrelationStore } from '../infrastructure/correlation/CorrelationContext';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
  causationId?: string;
  familyId?: number;
}

export function correlationMiddleware(req: CorrelatedRequest, res: Response, next: NextFunction): void {
  const existingId = (req.headers['x-correlation-id'] as string) || (req.headers['correlation-id'] as string);
  const correlationId = existingId && existingId.trim() !== '' ? existingId.trim() : `req_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  
  const headerCausationId = (req.headers['x-causation-id'] as string) || (req.headers['causation-id'] as string);

  // Extract familyId dynamically without hardcoded fallback
  const familyIdQuery = req.query.familyId as string;
  const familyIdBody = (req.body && req.body.familyId) ? String(req.body.familyId) : undefined;
  const familyIdHeader = req.headers['x-family-id'] as string;
  const familyIdUser = (req as any).user?.family_id ? String((req as any).user.family_id) : undefined;

  const rawFamilyId = familyIdQuery || familyIdBody || familyIdHeader || familyIdUser;
  const parsedFamilyId = rawFamilyId ? parseInt(rawFamilyId, 10) : undefined;
  const familyId = (parsedFamilyId && !isNaN(parsedFamilyId)) ? parsedFamilyId : undefined;

  const userId = (req as any).user?.id ? Number((req as any).user.id) : undefined;

  req.correlationId = correlationId;
  req.causationId = headerCausationId;
  req.familyId = familyId;

  res.setHeader('X-Correlation-ID', correlationId);
  if (headerCausationId) {
    res.setHeader('X-Causation-ID', headerCausationId);
  }

  const store: CorrelationStore = {
    correlationId,
    causationId: headerCausationId,
    familyId,
    userId,
    timestamp: new Date().toISOString()
  };

  CorrelationContext.runWithContext(store, () => {
    next();
  });
}
