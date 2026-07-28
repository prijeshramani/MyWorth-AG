import { SQLiteGoalRepository, CashflowProfileRecord } from '../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from './ProjectionEngineService';

export interface CashflowForecastDTO {
  profile: CashflowProfileRecord;
  tenYearNetSurplusProjected: number;
  thirtyYearNetSurplusProjected: number;
  yearlyForecast: Array<{ year: number; monthlyInflow: number; monthlyOutflow: number; monthlySurplus: number; annualSurplusAccumulated: number }>;
}

export class CashflowProjectionService {
  constructor(
    private goalRepo: SQLiteGoalRepository,
    private projectionEngine: ProjectionEngineService
  ) {}

  public getCashflowForecast(familyId: number): CashflowForecastDTO {
    const profile = this.goalRepo.getOrCreateCashflowProfile(familyId);
    const assumptions = this.goalRepo.getOrCreateAssumptions(familyId);

    const currentYear = new Date().getFullYear();
    const yearlyForecast = [];

    let currentInflow = profile.monthly_inflow;
    let currentOutflow = profile.monthly_outflow;
    let accumSurplus = 0;

    for (let yr = 1; yr <= 10; yr++) {
      const monthlySurplus = currentInflow - currentOutflow;
      const annualSurplus = monthlySurplus * 12;

      // Compound surplus reserves in liquid/debt funds
      accumSurplus = (accumSurplus + annualSurplus) * (1 + assumptions.debt_return_pct / 100);

      yearlyForecast.push({
        year: currentYear + yr,
        monthlyInflow: Math.round(currentInflow),
        monthlyOutflow: Math.round(currentOutflow),
        monthlySurplus: Math.round(monthlySurplus),
        annualSurplusAccumulated: Math.round(accumSurplus)
      });

      // Apply annual income growth & inflation to expenses
      currentInflow *= (1 + profile.annual_growth_pct / 100);
      currentOutflow *= (1 + assumptions.default_inflation_pct / 100);
    }

    return {
      profile,
      tenYearNetSurplusProjected: yearlyForecast[9]?.annualSurplusAccumulated || 0,
      thirtyYearNetSurplusProjected: Math.round((yearlyForecast[9]?.annualSurplusAccumulated || 0) * 3.5),
      yearlyForecast
    };
  }
}
