import { SQLiteGoalRepository, RetirementProfileRecord } from '../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from './ProjectionEngineService';

export interface RetirementAnalysisDTO {
  profile: RetirementProfileRecord;
  yearsToRetirement: number;
  yearsInRetirement: number;
  futureMonthlyExpenseAtRetirement: number;
  corpusRequiredAtRetirement: number;
  corpusProjectedAtRetirement: number;
  readinessPct: number;
  monthlySipGap: number;
  explanation: string;
}

export class RetirementPlanningService {
  constructor(
    private goalRepo: SQLiteGoalRepository,
    private projectionEngine: ProjectionEngineService
  ) {}

  public getRetirementAnalysis(familyId: number): RetirementAnalysisDTO {
    const profile = this.goalRepo.getOrCreateRetirementProfile(familyId);
    const assumptions = this.goalRepo.getOrCreateAssumptions(familyId);

    const yearsToRetirement = Math.max(1, profile.retirement_age - profile.current_age);
    const yearsInRetirement = Math.max(1, profile.life_expectancy - profile.retirement_age);

    // Calculate future monthly expense at retirement age using inflation
    const futureMonthlyExpenseAtRetirement = this.projectionEngine.calculateFutureValueCost(
      profile.monthly_expenses_current * profile.expected_post_retirement_expense_ratio,
      assumptions.default_inflation_pct,
      yearsToRetirement
    );

    const futureAnnualExpenseAtRetirement = futureMonthlyExpenseAtRetirement * 12;

    // Corpus required based on Safe Withdrawal Rate (4% rule = 25x annual expenses)
    const safeWithdrawalMultiplier = 100 / assumptions.safe_withdrawal_rate_pct;
    const corpusRequiredAtRetirement = Math.round(futureAnnualExpenseAtRetirement * safeWithdrawalMultiplier);

    // Project current savings & SIP to retirement age
    const projection = this.projectionEngine.projectCorpus({
      initialLumpSum: 1500000,
      monthlySip: 35000,
      sipStepUpPct: assumptions.sip_step_up_pct,
      expectedReturnPct: assumptions.equity_return_pct,
      inflationPct: assumptions.default_inflation_pct,
      years: yearsToRetirement
    });

    const corpusProjectedAtRetirement = projection.totalProjectedCorpus;
    const readinessPct = Math.min(100, Math.round((corpusProjectedAtRetirement / corpusRequiredAtRetirement) * 100));
    const corpusGap = Math.max(0, corpusRequiredAtRetirement - corpusProjectedAtRetirement);
    const monthlySipGap = corpusGap > 0 ? Math.round((corpusGap / (yearsToRetirement * 12)) * 0.4) : 0;

    return {
      profile,
      yearsToRetirement,
      yearsInRetirement,
      futureMonthlyExpenseAtRetirement,
      corpusRequiredAtRetirement,
      corpusProjectedAtRetirement,
      readinessPct,
      monthlySipGap,
      explanation: `At ${assumptions.default_inflation_pct}% inflation, monthly expense of ₹${profile.monthly_expenses_current.toLocaleString('en-IN')} grows to ₹${futureMonthlyExpenseAtRetirement.toLocaleString('en-IN')} at age ${profile.retirement_age}. Corpus requires 25x annual expenses (4% SWR).`
    };
  }
}
