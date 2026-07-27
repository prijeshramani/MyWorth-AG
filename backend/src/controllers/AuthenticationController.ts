import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';

export class AuthenticationController {
  constructor(private authService: AuthenticationService) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Fields email and password are required.'
          },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const correlationId = (req.headers['x-correlation-id'] as string) || 'system';

      const result = this.authService.login(email, password, ipAddress, correlationId);

      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          executionTimeMs: 5,
          apiVersion: '1.0.0'
        },
        correlationId,
        warnings: [],
        errors: []
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message
        },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'refreshToken is required.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const result = this.authService.refreshToken(refreshToken);
      res.status(200).json({
        success: true,
        data: result,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system',
        warnings: [],
        errors: []
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: err.message },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        this.authService.logout(refreshToken);
      }
      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully.' },
        metadata: { executionTimeMs: 1, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system',
        warnings: [],
        errors: []
      });
    } catch (err: any) {
      next(err);
    }
  };
}
