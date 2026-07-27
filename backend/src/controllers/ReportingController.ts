import { Request, Response, NextFunction } from 'express';
import { reportingApplicationService } from '../services/application/ReportingApplicationService';

export class ReportingController {
  public static async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = (req as any).startTime || Date.now();
      const correlationId = (req as any).correlationId || 'N/A';
      
      const { familyId, reportType, format, asOfDate } = req.body;

      const reportResponse = await reportingApplicationService.generateReport({
        familyId: Number(familyId),
        reportType,
        format,
        asOfDate
      });

      const executionTimeMs = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: reportResponse,
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
