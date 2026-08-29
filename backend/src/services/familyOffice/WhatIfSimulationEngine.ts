import crypto from 'crypto';
import { db } from '../../db';
import {
  WhatIfScenarioInput,
  WhatIfScenarioInputSchema,
  WhatIfSimulationResult,
  WhatIfSimulationResultSchema
} from '../../contracts/familyOfficeContracts';
import { FinancialTimeMachineService, financialTimeMachineService } from './FinancialTimeMachineService';
import { DigitalTwinService, digitalTwinService } from './DigitalTwinService';
import { ProjectionEngineService } from '../ProjectionEngineService';
import { RetirementPlanningService } from '../RetirementPlanningService';
import { GoalPlanningService } from '../GoalPlanningService';
import { TaxCalculationEngine } from '../../engines/tax/TaxCalculationEngine';
import { SQLiteGoalRepository } from '../../repositories/SQLiteGoalRepository';

export class WhatIfSimulationEngine {
  private projectionEngine: ProjectionEngineService;
  private retirementService: RetirementPlanningService;
  private goalService: GoalPlanningService;
  private goalRepo: SQLiteGoalRepository;

  constructor(
    private timeMachineService: FinancialTimeMachineService = financialTimeMachineService,
    private twinService: DigitalTwinService = digitalTwinService
  ) {
    this.goalRepo = new SQLiteGoalRepository(db);
    this.projectionEngine = new ProjectionEngineService();
    this.retirementService = new RetirementPlanningService(this.goalRepo, this.projectionEngine);
    this.goalService = new GoalPlanningService(this.goalRepo, this.projectionEngine);
  }

  /**
   * Execute an in-memory scenario simulation on a deep-cloned baseline state with ZERO database writes.
   */
  public simulate(
    familyId: number,
    rawInput: WhatIfScenarioInput
  ): WhatIfSimulationResult {
    const input = WhatIfScenarioInputSchema.parse(rawInput);
    const scenarioId = `sim_${crypto.randomUUID().substring(0, 8)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Hydrate Baseline State & Compute Immutable Baseline State Hash
    const asOf = input.baselineAsOf || todayStr;
    const baselineState = this.timeMachineService.reconstructHistoricalEconomicState(familyId, asOf);
    const baselineStateHash = baselineState.stateHash;
    const baselineAsOf = asOf;
    const baselineNetWorth = baselineState.netWorth;

    // Zero-write assumption retrieval
    const familyAssumptionsRow = db.prepare('SELECT * FROM projection_assumptions WHERE family_id = ?').get(familyId) as any;
    const familyAssumptions = familyAssumptionsRow || {
      default_inflation_pct: 6.0,
      equity_return_pct: 12.0,
      debt_return_pct: 7.0,
      education_inflation_pct: 10.0,
      medical_inflation_pct: 10.0,
      safe_withdrawal_rate_pct: 4.0,
      sip_step_up_pct: 10.0,
      retirement_age: 60,
      life_expectancy: 85
    };

    // Hardening 6: Incomplete baseline validation
    if (baselineState.overallStatus === 'INSUFFICIENT_DATA' && baselineState.completenessScore === 0 && (input.scenarioType === 'RECURRING_SIP_STEP_UP' || input.scenarioType === 'RETIREMENT_AGE_ADJUSTMENT')) {
      return WhatIfSimulationResultSchema.parse({
        scenarioId,
        scenarioType: input.scenarioType,
        familyId,
        baselineStateHash,
        baselineAsOf,
        appliedParameters: input,
        status: 'INSUFFICIENT_DATA',
        missingDataReason: `Historical baseline as of ${baselineAsOf} contains insufficient data (completeness: ${Math.round(baselineState.completenessScore * 100)}%). Authoritative simulation cannot be generated.`,
        generatedAt: new Date().toISOString()
      });
    }

    const baselineLimitations = baselineState.overallStatus === 'INSUFFICIENT_DATA' ? {
      completenessScore: baselineState.completenessScore,
      warning: 'Baseline net worth incorporates partial historical pricing.'
    } : undefined;

    // 2. Route Scenario
    switch (input.scenarioType) {
      case 'RECURRING_SIP_STEP_UP': {
        const monthlySip = input.monthlySipAmount || 25000;
        const stepUpPct = input.sipStepUpPercent !== undefined ? input.sipStepUpPercent : (familyAssumptions.sip_step_up_pct || 10);
        const years = input.years || 20;
        const equityReturn = familyAssumptions.equity_return_pct || 12;
        const inflation = familyAssumptions.default_inflation_pct || 6;

        const projection = this.projectionEngine.projectCorpus({
          initialLumpSum: Math.max(0, baselineNetWorth),
          monthlySip,
          sipStepUpPct: stepUpPct,
          expectedReturnPct: equityReturn,
          inflationPct: inflation,
          years
        });

        const targetCorpus = baselineNetWorth * Math.pow(1 + inflation / 100, years) + 10000000;
        const readiness = Math.min(100, Math.round((projection.totalProjectedCorpus / targetCorpus) * 100));
        const gap = Math.max(0, targetCorpus - projection.totalProjectedCorpus);

        return WhatIfSimulationResultSchema.parse({
          scenarioId,
          scenarioType: input.scenarioType,
          familyId,
          baselineStateHash,
          baselineAsOf,
          appliedParameters: input,
          status: 'COMPLETE',
          corpusAtRetirement: projection.totalProjectedCorpus,
          readinessPercent: readiness,
          gapDelta: gap,
          projectedValue: projection.totalProjectedCorpus,
          estimatedWealthGain: projection.estimatedWealthGain,
          yearlySchedule: projection.yearlySchedule,
          assumptionsUsed: {
            equityReturnPct: equityReturn,
            inflationPct: inflation,
            years,
            monthlySip,
            stepUpPct,
            baselineLimitations,
            provenance: {
              monthlySip: input.monthlySipAmount !== undefined ? 'USER_PROVIDED' : 'SYSTEM_ASSUMPTION',
              stepUpPct: input.sipStepUpPercent !== undefined ? 'USER_PROVIDED' : (familyAssumptionsRow?.sip_step_up_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION'),
              years: input.years !== undefined ? 'USER_PROVIDED' : 'SYSTEM_ASSUMPTION',
              equityReturnPct: familyAssumptionsRow?.equity_return_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION',
              inflationPct: familyAssumptionsRow?.default_inflation_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION'
            }
          },
          generatedAt: new Date().toISOString()
        });
      }

      case 'ONE_TIME_LUMP_SUM_INVESTMENT': {
        const lumpSum = input.lumpSumAmount || 500000;
        const horizonYears = input.investmentHorizonYears || 10;
        const returnPct = input.assumedReturnPct !== undefined ? input.assumedReturnPct : (familyAssumptions.equity_return_pct || 12);
        const inflation = familyAssumptions.default_inflation_pct || 6;

        const projection = this.projectionEngine.projectCorpus({
          initialLumpSum: lumpSum,
          monthlySip: 0,
          sipStepUpPct: 0,
          expectedReturnPct: returnPct,
          inflationPct: inflation,
          years: horizonYears
        });

        return WhatIfSimulationResultSchema.parse({
          scenarioId,
          scenarioType: input.scenarioType,
          familyId,
          baselineStateHash,
          baselineAsOf,
          appliedParameters: input,
          status: 'COMPLETE',
          corpusAtRetirement: projection.totalProjectedCorpus,
          readinessPercent: 100,
          projectedValue: projection.totalProjectedCorpus,
          estimatedWealthGain: projection.estimatedWealthGain,
          yearlySchedule: projection.yearlySchedule,
          assumptionsUsed: {
            lumpSumAmount: lumpSum,
            horizonYears,
            expectedReturnPct: returnPct,
            inflationPct: inflation,
            baselineLimitations,
            provenance: {
              lumpSumAmount: input.lumpSumAmount !== undefined ? 'USER_PROVIDED' : 'SYSTEM_ASSUMPTION',
              horizonYears: input.investmentHorizonYears !== undefined ? 'USER_PROVIDED' : 'SYSTEM_ASSUMPTION',
              expectedReturnPct: input.assumedReturnPct !== undefined ? 'USER_PROVIDED' : (familyAssumptionsRow?.equity_return_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION'),
              inflationPct: familyAssumptionsRow?.default_inflation_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION'
            }
          },
          generatedAt: new Date().toISOString()
        });
      }

      case 'RETIREMENT_AGE_ADJUSTMENT': {
        const targetAge = input.targetRetirementAge || 60;
        const profileRow = db.prepare('SELECT * FROM retirement_profiles WHERE family_id = ?').get(familyId) as any;
        const profile = profileRow || {
          current_age: 35,
          retirement_age: 60,
          life_expectancy: 85,
          monthly_expenses_current: 75000.0,
          expected_post_retirement_expense_ratio: 0.8
        };
        const assumptions = familyAssumptions;

        const currentAge = profile.current_age || 35;
        const yearsToRetirement = Math.max(1, targetAge - currentAge);
        const yearsInRetirement = Math.max(1, profile.life_expectancy - targetAge);

        const futureMonthlyExpense = this.projectionEngine.calculateFutureValueCost(
          profile.monthly_expenses_current * profile.expected_post_retirement_expense_ratio,
          assumptions.default_inflation_pct,
          yearsToRetirement
        );

        const futureAnnualExpense = futureMonthlyExpense * 12;
        const safeWithdrawalMultiplier = 100 / assumptions.safe_withdrawal_rate_pct;
        const corpusRequired = Math.round(futureAnnualExpense * safeWithdrawalMultiplier);

        const projection = this.projectionEngine.projectCorpus({
          initialLumpSum: Math.max(0, baselineNetWorth),
          monthlySip: 25000,
          sipStepUpPct: assumptions.sip_step_up_pct,
          expectedReturnPct: assumptions.equity_return_pct,
          inflationPct: assumptions.default_inflation_pct,
          years: yearsToRetirement
        });

        const projectedCorpus = projection.totalProjectedCorpus;
        const readiness = Math.min(100, Math.round((projectedCorpus / corpusRequired) * 100));
        const gap = Math.max(0, corpusRequired - projectedCorpus);
        const monthlySipGap = gap > 0 ? Math.round((gap / (yearsToRetirement * 12)) * 0.4) : 0;

        return WhatIfSimulationResultSchema.parse({
          scenarioId,
          scenarioType: input.scenarioType,
          familyId,
          baselineStateHash,
          baselineAsOf,
          appliedParameters: input,
          status: 'COMPLETE',
          corpusAtRetirement: projectedCorpus,
          readinessPercent: readiness,
          gapDelta: gap,
          monthlyBenefitAmount: monthlySipGap,
          assumptionsUsed: {
            currentAge,
            targetRetirementAge: targetAge,
            yearsToRetirement,
            yearsInRetirement,
            corpusRequired,
            projectedCorpus,
            equityReturnPct: assumptions.equity_return_pct,
            inflationPct: assumptions.default_inflation_pct,
            baselineLimitations,
            provenance: {
              targetRetirementAge: input.targetRetirementAge !== undefined ? 'USER_PROVIDED' : 'SYSTEM_ASSUMPTION',
              currentAge: profileRow?.current_age ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION',
              monthlyExpenses: profileRow?.monthly_expenses_current ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION',
              equityReturnPct: familyAssumptionsRow?.equity_return_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION',
              inflationPct: familyAssumptionsRow?.default_inflation_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION'
            }
          },
          generatedAt: new Date().toISOString()
        });
      }

      case 'GOAL_CONTRIBUTION_REALLOCATION': {
        const goalId = input.targetGoalId;
        if (!goalId) {
          return WhatIfSimulationResultSchema.parse({
            scenarioId,
            scenarioType: input.scenarioType,
            familyId,
            baselineStateHash,
            baselineAsOf,
            appliedParameters: input,
            status: 'INSUFFICIENT_DATA',
            missingDataReason: 'targetGoalId is required for GOAL_CONTRIBUTION_REALLOCATION.',
            generatedAt: new Date().toISOString()
          });
        }

        const goalRow = db.prepare('SELECT * FROM financial_goals WHERE id = ? AND family_id = ?').get(goalId, familyId) as any;
        if (!goalRow) {
          return WhatIfSimulationResultSchema.parse({
            scenarioId,
            scenarioType: input.scenarioType,
            familyId,
            baselineStateHash,
            baselineAsOf,
            appliedParameters: input,
            status: 'INSUFFICIENT_DATA',
            missingDataReason: `Goal with ID ${goalId} not found for this family.`,
            generatedAt: new Date().toISOString()
          });
        }

        const monthlySip = input.reallocatedMonthlySip !== undefined ? input.reallocatedMonthlySip : goalRow.monthly_sip_amount;
        const targetYear = goalRow.target_year || (new Date().getFullYear() + 5);
        const years = Math.max(1, targetYear - new Date().getFullYear());
        const expReturn = goalRow.expected_return_pct || familyAssumptions.equity_return_pct || 12;
        const inflation = goalRow.inflation_pct || familyAssumptions.default_inflation_pct || 6;

        const proj = this.projectionEngine.projectCorpus({
          initialLumpSum: goalRow.current_allocated_amount || 0,
          monthlySip,
          sipStepUpPct: 10,
          expectedReturnPct: expReturn,
          inflationPct: inflation,
          years
        });

        const readiness = Math.min(100, Math.round((proj.totalProjectedCorpus / goalRow.target_amount) * 100));
        const gap = Math.max(0, goalRow.target_amount - proj.totalProjectedCorpus);

        return WhatIfSimulationResultSchema.parse({
          scenarioId,
          scenarioType: input.scenarioType,
          familyId,
          baselineStateHash,
          baselineAsOf,
          appliedParameters: input,
          status: 'COMPLETE',
          corpusAtRetirement: proj.totalProjectedCorpus,
          readinessPercent: readiness,
          gapDelta: gap,
          projectedValue: proj.totalProjectedCorpus,
          assumptionsUsed: {
            goalName: goalRow.title || goalRow.name || 'Financial Goal',
            targetAmount: goalRow.target_amount,
            targetYear,
            reallocatedMonthlySip: monthlySip,
            expectedReturnPct: expReturn,
            inflationPct: inflation,
            provenance: {
              reallocatedMonthlySip: input.reallocatedMonthlySip !== undefined ? 'USER_PROVIDED' : 'FAMILY_PROFILE',
              targetAmount: 'FAMILY_PROFILE',
              targetYear: 'FAMILY_PROFILE',
              expectedReturnPct: goalRow.expected_return_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION',
              inflationPct: goalRow.inflation_pct ? 'FAMILY_PROFILE' : 'SYSTEM_ASSUMPTION'
            }
          },
          generatedAt: new Date().toISOString()
        });
      }

      case 'TAX_REGIME_OPTIMIZATION_SCENARIO': {
        const salary = input.salaryIncome;
        const claimed80C = input.hypothetical80CAmount || 0;
        const claimed80CCD = input.hypothetical80CCDAmount || 0;

        let grossIncome = salary;
        let incomeProvenance: 'USER_PROVIDED' | 'FAMILY_PROFILE' | 'SYSTEM_ASSUMPTION' = 'USER_PROVIDED';

        if (grossIncome === undefined) {
          const profile = db.prepare('SELECT id FROM tax_profiles WHERE family_id = ? ORDER BY id DESC LIMIT 1').get(familyId) as any;
          if (profile) {
            const incomeRow = db.prepare('SELECT SUM(gross_amount) as totalGross FROM tax_income_sources WHERE tax_profile_id = ?').get(profile.id) as any;
            if (incomeRow && incomeRow.totalGross && incomeRow.totalGross > 0) {
              grossIncome = incomeRow.totalGross;
              incomeProvenance = 'FAMILY_PROFILE';
            }
          }
        }

        // BLOCKER 2 FIX: Never fabricate arbitrary ₹15 lakh income. If income is missing, return INSUFFICIENT_DATA with null benefit.
        if (grossIncome === undefined || grossIncome <= 0) {
          return WhatIfSimulationResultSchema.parse({
            scenarioId,
            scenarioType: input.scenarioType,
            familyId,
            baselineStateHash,
            baselineAsOf,
            appliedParameters: input,
            status: 'INSUFFICIENT_DATA',
            taxSavingsBenefit: null,
            missingDataReason: 'No verified gross income found in family profile. Please provide explicit salaryIncome parameter.',
            generatedAt: new Date().toISOString()
          });
        }

        const oldResult = TaxCalculationEngine.calculateOldRegimeTax({
          grossIncome,
          claimed80C,
          claimed80CCD1B: claimed80CCD
        });

        const newResult = TaxCalculationEngine.calculateNewRegimeTax({
          grossIncome
        });

        const savings = Math.max(0, oldResult.totalTaxPayable - newResult.totalTaxPayable);
        const optimalRegime = newResult.totalTaxPayable <= oldResult.totalTaxPayable ? 'NEW' : 'OLD';
        const optimalTax = optimalRegime === 'NEW' ? newResult.totalTaxPayable : oldResult.totalTaxPayable;
        const effectiveTaxRate = Math.round((optimalTax / (grossIncome || 1)) * 1000) / 10;

        return WhatIfSimulationResultSchema.parse({
          scenarioId,
          scenarioType: input.scenarioType,
          familyId,
          baselineStateHash,
          baselineAsOf,
          appliedParameters: input,
          status: 'COMPLETE',
          taxSavingsBenefit: savings,
          optimalRegime,
          effectiveTaxRate,
          assumptionsUsed: {
            grossIncome,
            hypothetical80C: claimed80C,
            hypothetical80CCD: claimed80CCD,
            oldRegimeTax: oldResult.totalTaxPayable,
            newRegimeTax: newResult.totalTaxPayable,
            provenance: {
              grossIncome: incomeProvenance,
              hypothetical80C: input.hypothetical80CAmount !== undefined ? 'USER_PROVIDED' : 'SYSTEM_ASSUMPTION',
              hypothetical80CCD: input.hypothetical80CCDAmount !== undefined ? 'USER_PROVIDED' : 'SYSTEM_ASSUMPTION'
            }
          },
          generatedAt: new Date().toISOString()
        });
      }

      default:
        throw new Error(`Unsupported What-If scenario type: ${(input as any).scenarioType}`);
    }
  }
}

export const whatIfSimulationEngine = new WhatIfSimulationEngine();
