import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface FinancialGoalDTO {
  id: number;
  family_id: number;
  goal_type: 'RETIREMENT' | 'EDUCATION' | 'HOUSE' | 'VEHICLE' | 'VACATION' | 'EMERGENCY';
  title: string;
  target_amount: number;
  target_year: number;
  current_allocated_amount: number;
  monthly_sip_amount: number;
  expected_return_pct: number;
  inflation_pct: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'IN_PROGRESS' | 'ACHIEVED' | 'DELAYED' | 'ON_TRACK';
  created_at: string;
}

export interface GoalHealthDTO {
  overallScore: number;
  ratingLabel: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  goalsCount: number;
  goalsOnTrackCount: number;
  goalsDelayedCount: number;
  totalTargetCorpus: number;
  totalProjectedCorpus: number;
}

export interface ProjectionAssumptionsDTO {
  default_inflation_pct: number;
  equity_return_pct: number;
  debt_return_pct: number;
  education_inflation_pct: number;
  medical_inflation_pct: number;
  safe_withdrawal_rate_pct: number;
  sip_step_up_pct: number;
  retirement_age: number;
  life_expectancy: number;
}

export interface RetirementAnalysisDTO {
  profile: {
    current_age: number;
    retirement_age: number;
    life_expectancy: number;
    monthly_expenses_current: number;
    expected_post_retirement_expense_ratio: number;
  };
  yearsToRetirement: number;
  yearsInRetirement: number;
  futureMonthlyExpenseAtRetirement: number;
  corpusRequiredAtRetirement: number;
  corpusProjectedAtRetirement: number;
  readinessPct: number;
  monthlySipGap: number;
  explanation: string;
}

export interface CashflowForecastDTO {
  profile: {
    monthly_inflow: number;
    monthly_outflow: number;
    monthly_surplus: number;
    annual_growth_pct: number;
  };
  tenYearNetSurplusProjected: number;
  thirtyYearNetSurplusProjected: number;
  yearlyForecast: Array<{
    year: number;
    monthlyInflow: number;
    monthlyOutflow: number;
    monthlySurplus: number;
    annualSurplusAccumulated: number;
  }>;
}

export interface GoalRecommendationDTO {
  id: number;
  recommendation_type: string;
  title: string;
  description: string;
  priority: string;
  confidence_pct: number;
  time_horizon: string;
  status: string;
}

export interface PlanningDashboardDTO {
  assumptions: ProjectionAssumptionsDTO;
  goals: FinancialGoalDTO[];
  health: GoalHealthDTO;
  retirement: RetirementAnalysisDTO;
  cashflow: CashflowForecastDTO;
  recommendations: GoalRecommendationDTO[];
}

export interface ScenarioResultDTO {
  scenarioName: string;
  overrides: { inflationOverridePct?: number; returnOverridePct?: number; stepUpOverridePct?: number };
  projectionResult: {
    totalInvested: number;
    totalProjectedCorpus: number;
    estimatedWealthGain: number;
    yearlySchedule: Array<{
      yearNumber: number;
      calendarYear: number;
      lumpSumCompounded: number;
      sipInvestedCumulative: number;
      sipValueCompounded: number;
      totalCorpusProjected: number;
    }>;
    formulaExplanation: string;
  };
}

export const planningService = {
  async getDashboard(familyId: number): Promise<ApiResponseEnvelope<PlanningDashboardDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<PlanningDashboardDTO>>(`/planning/dashboard?familyId=${familyId}`);
    return response.data;
  },

  async createGoal(payload: {
    familyId: number;
    goalType: string;
    title: string;
    targetAmount: number;
    targetYear: number;
    monthlySipAmount?: number;
    currentAllocatedAmount?: number;
    expectedReturnPct?: number;
    inflationPct?: number;
    priority?: string;
  }): Promise<ApiResponseEnvelope<FinancialGoalDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<FinancialGoalDTO>>('/planning/goal', payload);
    return response.data;
  },

  async runScenario(payload: {
    familyId: number;
    scenarioName: string;
    inflationOverridePct?: number;
    returnOverridePct?: number;
    stepUpOverridePct?: number;
  }): Promise<ApiResponseEnvelope<ScenarioResultDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<ScenarioResultDTO>>('/planning/scenario', payload);
    return response.data;
  }
};
