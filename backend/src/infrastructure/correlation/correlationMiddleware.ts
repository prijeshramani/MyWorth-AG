import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { CorrelationContext, CorrelationStore } from './CorrelationContext';
import { JwtService } from '../../services/jwtService';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerCorrId = (req.headers['x-correlation-id'] as string) || (req.headers['correlation-id'] as string);
  const correlationId = headerCorrId && headerCorrId.trim() !== '' ? headerCorrId.trim() : `req_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
  
  const headerCausationId = (req.headers['x-causation-id'] as string) || (req.headers['causation-id'] as string);
  
  // 1. Authoritative: Authenticated JWT user context
  let authenticatedUser = (req as any).user;
  if (!authenticatedUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      authenticatedUser = JwtService.verifyAccessToken(token);
      (req as any).user = authenticatedUser;
    } catch {
      // ignore invalid token here, auth middleware handles rejection
    }
  }

  const rawFamilyId = authenticatedUser?.familyId || authenticatedUser?.family_id;
  const parsedFamilyId = rawFamilyId ? parseInt(String(rawFamilyId), 10) : undefined;

  // 2. Unauthenticated / Dev fallback: Header -> Query -> Default 1
  const headerFamilyId = req.headers['x-family-id'] ? parseInt(String(req.headers['x-family-id']), 10) : undefined;
  const queryFamilyId = (req.query && req.query.familyId) ? parseInt(String(req.query.familyId), 10) : undefined;

  let familyId: number | undefined;
  if (parsedFamilyId && !isNaN(parsedFamilyId)) {
    familyId = parsedFamilyId;
  } else if (headerFamilyId && !isNaN(headerFamilyId)) {
    familyId = headerFamilyId;
  } else if (queryFamilyId && !isNaN(queryFamilyId)) {
    familyId = queryFamilyId;
  } else {
    familyId = 1;
  }

  const userId = authenticatedUser?.id ? Number(authenticatedUser.id) : undefined;

  // Set response correlation header
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
