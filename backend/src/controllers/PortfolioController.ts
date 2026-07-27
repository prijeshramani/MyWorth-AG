import { Request, Response, NextFunction } from 'express';
import { portfolioApplicationService } from '../services/application/PortfolioApplicationService';

export class PortfolioController {
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = (req as any).startTime || Date.now();
      const correlationId = (req as any).correlationId || 'N/A';
      
      const familyId = Number(req.query.familyId);
      const asOfDate = req.query.asOfDate as string | undefined;
      const reportingCurrency = req.query.reportingCurrency as string | undefined;
      const includeRiskMetrics = req.query.includeRiskMetrics === 'true';

      const portfolioDTO = await portfolioApplicationService.getConsolidatedPortfolio({
        familyId,
        asOfDate,
        reportingCurrency,
        includeRiskMetrics
      });

      const executionTimeMs = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: portfolioDTO,
        metadata: {
          snapshotId: portfolioDTO.masterChecksum ? `master_snap_${portfolioDTO.masterChecksum.substring(0, 8)}` : undefined,
          calculationManifestId: portfolioDTO.masterChecksum,
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
