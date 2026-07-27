import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../services/jwtService';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticateMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token, proceed without error so unauthenticated routes remain accessible, or reject if protected
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = JwtService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired access token.'
      },
      correlationId: req.headers['x-correlation-id'] || 'system'
    });
  }
}
