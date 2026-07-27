import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticateMiddleware';

export function authorizeMiddleware(requiredPermission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required.'
        },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
      return;
    }

    const hasPerm = req.user.permissions && req.user.permissions.includes(requiredPermission);
    if (!hasPerm) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: Missing required permission [${requiredPermission}].`
        },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
      return;
    }

    next();
  };
}
