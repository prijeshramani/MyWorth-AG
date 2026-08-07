import { Request, Response, NextFunction } from 'express';
import { InsuranceApplicationService } from '../services/InsuranceApplicationService';

export class InsuranceController {
  constructor(private insuranceAppService: InsuranceApplicationService) {}

  public getProtectionSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string;
      if (!familyIdStr) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter familyId is required.'
          },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const familyId = parseInt(familyIdStr, 10);
      if (isNaN(familyId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter familyId must be a valid integer.'
          },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const summary = this.insuranceAppService.getProtectionSummary(familyId);

      res.status(200).json({
        success: true,
        data: summary,
        metadata: {
          executionTimeMs: 4,
          apiVersion: '1.0.0'
        },
        correlationId: req.headers['x-correlation-id'] || 'system',
        warnings: [],
        errors: []
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: err.message
          },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }
      next(err);
    }
  };

  public getPolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string;
      const familyId = parseInt(familyIdStr || '1', 10);
      const policies = this.insuranceAppService.getPoliciesByFamily(familyId);
      res.status(200).json({
        success: true,
        data: policies
      });
    } catch (err: any) {
      next(err);
    }
  };

  public createPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const policyData = req.body;
      if (!policyData.policyNumber || !policyData.insurerName || !policyData.policyType) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'policyNumber, insurerName, and policyType are required.' }
        });
        return;
      }
      const created = this.insuranceAppService.createPolicy(policyData);
      res.status(201).json({
        success: true,
        data: created
      });
    } catch (err: any) {
      next(err);
    }
  };
}
