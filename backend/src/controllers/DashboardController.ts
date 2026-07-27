import { Request, Response, NextFunction } from 'express';
import { dashboardApplicationService } from '../services/application/DashboardApplicationService';

export class DashboardController {
  public static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = (req as any).startTime || Date.now();
      const correlationId = (req as any).correlationId || 'N/A';
      
      const familyId = Number(req.query.familyId);
      const asOfDate = req.query.asOfDate as string | undefined;

      const dashboardDTO = await dashboardApplicationService.getDashboardOverview(familyId, asOfDate);

      const executionTimeMs = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: dashboardDTO,
        metadata: {
          executionTimeMs,
          apiVersion: 'v1.0'
        },
        correlationId,
        warnings: [],
        errors: []
      });
    } catch (err) {
      next(err);
    }
  }
}
