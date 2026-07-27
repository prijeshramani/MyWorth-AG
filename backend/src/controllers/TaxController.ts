import { Request, Response, NextFunction } from 'express';
import { TaxApplicationService } from '../services/TaxApplicationService';

export class TaxController {
  constructor(private taxAppService: TaxApplicationService) {}

  public getTaxSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string;
      if (!familyIdStr) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Query parameter familyId is required.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const familyId = parseInt(familyIdStr, 10);
      const summary = this.taxAppService.getTaxSummary(familyId);

      res.status(200).json({
        success: true,
        data: summary,
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system',
        warnings: [],
        errors: []
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: err.message },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }
      next(err);
    }
  };
}
