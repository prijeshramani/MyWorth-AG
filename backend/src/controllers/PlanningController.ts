import { Request, Response, NextFunction } from 'express';
import { SQLiteGoalRepository } from '../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from '../services/ProjectionEngineService';
import { GoalPlanningService } from '../services/GoalPlanningService';
import { RetirementPlanningService } from '../services/RetirementPlanningService';
import { CashflowProjectionService } from '../services/CashflowProjectionService';
import { PlanningRecommendationService } from '../services/PlanningRecommendationService';

export class PlanningController {
  constructor(
    private goalRepo: SQLiteGoalRepository,
    private projectionEngine: ProjectionEngineService,
    private goalService: GoalPlanningService,
    private retirementService: RetirementPlanningService,
    private cashflowService: CashflowProjectionService,
    private recService: PlanningRecommendationService
  ) {}

  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const assumptions = this.goalRepo.getOrCreateAssumptions(familyId);
      const { goals, health } = this.goalService.getGoalsSummary(familyId);
      const retirement = this.retirementService.getRetirementAnalysis(familyId);
      const cashflow = this.cashflowService.getCashflowForecast(familyId);
      const recommendations = this.recService.generatePlanningRecommendations(familyId);

      res.status(200).json({
        success: true,
        data: {
          assumptions,
          goals,
          health,
          retirement,
          cashflow,
          recommendations
        },
        metadata: { executionTimeMs: 5, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getGoals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const goalsSummary = this.goalService.getGoalsSummary(familyId);

      res.status(200).json({
        success: true,
        data: goalsSummary,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getRetirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const retirement = this.retirementService.getRetirementAnalysis(familyId);

      res.status(200).json({
        success: true,
        data: retirement,
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getProjections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const cashflow = this.cashflowService.getCashflowForecast(familyId);
      const assumptions = this.goalRepo.getOrCreateAssumptions(familyId);

      // Baseline 10-year investment growth projection
      const projection = this.projectionEngine.projectCorpus({
        initialLumpSum: 2000000,
        monthlySip: 50000,
        sipStepUpPct: assumptions.sip_step_up_pct,
        expectedReturnPct: assumptions.equity_return_pct,
        inflationPct: assumptions.default_inflation_pct,
        years: 10
      });

      res.status(200).json({
        success: true,
        data: {
          cashflow,
          projection
        },
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public createGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId, goalType, title, targetAmount, targetYear, monthlySipAmount, currentAllocatedAmount, expectedReturnPct, inflationPct, priority } = req.body;

      if (!familyId || !goalType || !title || !targetAmount || !targetYear) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required Goal attributes.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const newGoal = this.goalService.createGoal(familyId, {
        family_id: familyId,
        goal_type: goalType,
        title,
        target_amount: targetAmount,
        target_year: targetYear,
        current_allocated_amount: currentAllocatedAmount || 0,
        monthly_sip_amount: monthlySipAmount || 0,
        expected_return_pct: expectedReturnPct || 12.0,
        inflation_pct: inflationPct || 6.0,
        priority: priority || 'HIGH',
        status: 'ON_TRACK'
      });

      res.status(201).json({
        success: true,
        data: newGoal,
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public createScenario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId, scenarioName, inflationOverridePct, returnOverridePct, stepUpOverridePct } = req.body;

      if (!familyId || !scenarioName) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required scenario attributes.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const proj = this.projectionEngine.projectCorpus({
        initialLumpSum: 2000000,
        monthlySip: 50000,
        sipStepUpPct: stepUpOverridePct || 10.0,
        expectedReturnPct: returnOverridePct || 12.0,
        inflationPct: inflationOverridePct || 6.0,
        years: 10
      });

      res.status(201).json({
        success: true,
        data: {
          scenarioName,
          overrides: { inflationOverridePct, returnOverridePct, stepUpOverridePct },
          projectionResult: proj
        },
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };
}
