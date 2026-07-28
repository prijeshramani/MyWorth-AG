import { Request, Response, NextFunction } from 'express';
import { SystemHealthService } from '../services/SystemHealthService';
import { BackupService } from '../services/BackupService';
import { OnboardingService } from '../services/OnboardingService';

export class DXController {
  constructor(
    private healthService: SystemHealthService,
    private backupService: BackupService,
    private onboardingService: OnboardingService
  ) {}

  public getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = this.healthService.getSystemHealth();
      res.status(200).json({
        success: true,
        data: health,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getOnboardingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = this.onboardingService.getStatus();
      res.status(200).json({
        success: true,
        data: status,
        metadata: { executionTimeMs: 1, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public completeOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = this.onboardingService.completeOnboarding(req.body);
      res.status(200).json({
        success: true,
        data: status,
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public createBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const backup = this.backupService.createBackup(req.body.name || 'Manual Backup');
      res.status(201).json({
        success: true,
        data: backup,
        metadata: { executionTimeMs: 5, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public listBackups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const backups = this.backupService.listBackups();
      res.status(200).json({
        success: true,
        data: backups,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public restoreBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = this.backupService.restoreBackup(req.body.filename);
      res.status(200).json({
        success: result.isValid,
        data: result,
        metadata: { executionTimeMs: 15, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public saveFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const feedback = this.onboardingService.saveFeedback(req.body);
      res.status(201).json({
        success: true,
        data: feedback,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };
}
