import { Request, Response, NextFunction } from 'express';
import { familyFinancialHealthService } from '../services/familyOffice/FamilyFinancialHealthService';
import { CorrelationContext } from '../infrastructure/correlation/CorrelationContext';
import { ValidationError, AppError } from '../errors/AppError';

export class FamilyHealthController {
  /**
   * GET /api/v1/family-office/health
   * Purely read-only evaluation of current live Family Financial Health index.
   */
  public async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = CorrelationContext.getFamilyId() || (req.query.familyId ? Number(req.query.familyId) : 1);
      if (!familyId || isNaN(familyId)) {
        throw new ValidationError('A valid family context or familyId query parameter is required');
      }

      const health = await familyFinancialHealthService.calculateHealth(familyId);
      res.status(200).json({
        success: true,
        data: health
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/family-office/health/history
   * Retrieves paginated historical health snapshots.
   */
  public async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = CorrelationContext.getFamilyId() || (req.query.familyId ? Number(req.query.familyId) : 1);
      if (!familyId || isNaN(familyId)) {
        throw new ValidationError('A valid family context or familyId query parameter is required');
      }

      const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 24;
      const history = familyFinancialHealthService.getSnapshotHistory(familyId, limit);

      res.status(200).json({
        success: true,
        data: {
          familyId,
          total: history.length,
          snapshots: history.map(h => ({
            ...h,
            pillar_scores: JSON.parse(h.pillar_scores_json || '{}'),
            weights: JSON.parse(h.weights_json || '{}')
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/family-office/health/snapshot
   * Persists an immutable point-in-time snapshot of the family's health index.
   */
  public async createSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = CorrelationContext.getFamilyId() || (req.body?.familyId ? Number(req.body.familyId) : 1);
      if (!familyId || isNaN(familyId)) {
        throw new ValidationError('A valid family context or familyId body parameter is required');
      }

      const asOfDate = req.body?.asOfDate ? String(req.body.asOfDate) : undefined;
      const snapshot = await familyFinancialHealthService.createSnapshot(familyId, asOfDate);

      res.status(201).json({
        success: true,
        data: {
          ...snapshot,
          pillar_scores: JSON.parse(snapshot.pillar_scores_json || '{}'),
          weights: JSON.parse(snapshot.weights_json || '{}')
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const familyHealthController = new FamilyHealthController();
