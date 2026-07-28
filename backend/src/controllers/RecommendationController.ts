import { Request, Response, NextFunction } from 'express';
import { SQLiteRecommendationRepository } from '../repositories/SQLiteRecommendationRepository';
import { RecommendationEngineService } from '../services/RecommendationEngineService';

export class RecommendationController {
  constructor(
    private recRepo: SQLiteRecommendationRepository,
    private engineService: RecommendationEngineService
  ) {}

  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const dashboard = this.engineService.getDashboardInsights(familyId);

      res.status(200).json({
        success: true,
        data: dashboard,
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);
      const status = req.query.status as string | undefined;

      const recs = this.recRepo.getRecommendations(familyId, status);

      res.status(200).json({
        success: true,
        data: recs,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getRecommendationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const explanation = this.engineService.explainRecommendation(id);

      if (!explanation) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Recommendation #${id} not found.` },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: explanation,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public refreshRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId } = req.body;
      const targetFamilyId = familyId ? parseInt(familyId, 10) : 1;

      const refreshed = this.engineService.refreshRecommendations(targetFamilyId);

      res.status(200).json({
        success: true,
        data: refreshed,
        metadata: { executionTimeMs: 5, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public acceptRecommendation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { familyId } = req.body;
      const targetFamilyId = familyId ? parseInt(familyId, 10) : 1;

      this.engineService.updateRecommendationStatus(id, targetFamilyId, 'ACCEPTED', 'User accepted recommendation');

      res.status(200).json({
        success: true,
        data: { id, status: 'ACCEPTED' },
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public dismissRecommendation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { familyId } = req.body;
      const targetFamilyId = familyId ? parseInt(familyId, 10) : 1;

      this.engineService.updateRecommendationStatus(id, targetFamilyId, 'DISMISSED', 'User dismissed recommendation');

      res.status(200).json({
        success: true,
        data: { id, status: 'DISMISSED' },
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public completeRecommendation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { familyId } = req.body;
      const targetFamilyId = familyId ? parseInt(familyId, 10) : 1;

      this.engineService.updateRecommendationStatus(id, targetFamilyId, 'COMPLETED', 'User completed recommendation action');

      res.status(200).json({
        success: true,
        data: { id, status: 'COMPLETED' },
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };
}
