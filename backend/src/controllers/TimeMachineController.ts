import { Request, Response, NextFunction } from 'express';
import { financialTimeMachineService } from '../services/familyOffice/FinancialTimeMachineService';
import { whatIfSimulationEngine } from '../services/familyOffice/WhatIfSimulationEngine';
import { CorrelationContext } from '../infrastructure/correlation/CorrelationContext';
import { WhatIfScenarioInputSchema } from '../contracts/familyOfficeContracts';
import { ValidationError, AppError } from '../errors/AppError';

export class TimeMachineController {
  public resolveAuthorizedFamilyId(req: Request): number {
    const authorizedFamilyId = CorrelationContext.getFamilyId();
    if (!authorizedFamilyId) {
      throw new ValidationError('Authentication required: familyId missing from context');
    }

    const queryFamilyId = req.query.familyId ? Number(req.query.familyId) : undefined;
    if (queryFamilyId !== undefined && queryFamilyId !== authorizedFamilyId) {
      throw new AppError(`Unauthorized access to family ID ${queryFamilyId}. Active authorized family is ${authorizedFamilyId}.`, 403, 'FORBIDDEN');
    }

    const bodyFamilyId = req.body && req.body.familyId ? Number(req.body.familyId) : undefined;
    if (bodyFamilyId !== undefined && bodyFamilyId !== authorizedFamilyId) {
      throw new AppError(`Unauthorized access to family ID ${bodyFamilyId}. Active authorized family is ${authorizedFamilyId}.`, 403, 'FORBIDDEN');
    }

    return authorizedFamilyId;
  }

  /**
   * GET /api/v1/family-office/time-machine
   * Reconstruct point-in-time historical economic state as of asOfDate.
   */
  public async getReconstruction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const asOfDate = req.query.asOfDate as string;

      if (!asOfDate) {
        throw new ValidationError("Missing required query parameter 'asOfDate' (expected format: YYYY-MM-DD).");
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
        throw new ValidationError(`Invalid date format for 'asOfDate': '${asOfDate}'. Expected format: YYYY-MM-DD.`);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      if (asOfDate > todayStr) {
        const err = new AppError(`FUTURE_AS_OF_DATE_UNSUPPORTED: asOfDate '${asOfDate}' cannot be in the future. For future projections, use the What-If Simulation Sandbox.`, 400, 'FUTURE_AS_OF_DATE_UNSUPPORTED');
        throw err;
      }

      const result = financialTimeMachineService.reconstructHistoricalEconomicState(familyId, asOfDate);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/family-office/time-machine/what-if
   * Execute an in-memory scenario simulation on a deep-cloned baseline with 0 database writes.
   */
  public async simulateWhatIf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const parsedBody = WhatIfScenarioInputSchema.safeParse(req.body);

      if (!parsedBody.success) {
        throw new ValidationError(`Invalid What-If scenario parameters: ${parsedBody.error.message}`);
      }

      const result = whatIfSimulationEngine.simulate(familyId, parsedBody.data);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const timeMachineController = new TimeMachineController();
