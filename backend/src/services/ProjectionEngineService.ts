export interface ProjectionInput {
  initialLumpSum: number;
  monthlySip: number;
  sipStepUpPct: number; // e.g. 10%
  expectedReturnPct: number; // e.g. 12%
  inflationPct: number; // e.g. 6%
  years: number;
}

export interface YearProjectionPoint {
  yearNumber: number;
  calendarYear: number;
  lumpSumCompounded: number;
  sipInvestedCumulative: number;
  sipValueCompounded: number;
  totalCorpusProjected: number;
  inflationAdjustedTarget: number;
  monthlySipCurrentYear: number;
}

export interface ProjectionResultDTO {
  inputsUsed: ProjectionInput;
  totalInvested: number;
  totalProjectedCorpus: number;
  estimatedWealthGain: number;
  yearlySchedule: YearProjectionPoint[];
  formulaExplanation: string;
}

export class ProjectionEngineService {
  /**
   * Unified Compound Interest & Annual SIP Step-up Projection Math Engine
   */
  public projectCorpus(input: ProjectionInput): ProjectionResultDTO {
    const { initialLumpSum, monthlySip, sipStepUpPct, expectedReturnPct, inflationPct, years } = input;
    const currentYear = new Date().getFullYear();

    const monthlyReturnRate = expectedReturnPct / 100 / 12;
    const stepUpRatio = 1 + sipStepUpPct / 100;

    let currentMonthlySip = monthlySip;
    let accumSipValue = 0;
    let totalSipInvested = 0;
    const yearlySchedule: YearProjectionPoint[] = [];

    for (let yr = 1; yr <= years; yr++) {
      // Compound lump sum for 1 year
      const lumpSumValue = initialLumpSum * Math.pow(1 + expectedReturnPct / 100, yr);

      // Simulate 12 monthly SIP contributions for current year
      for (let m = 1; m <= 12; m++) {
        totalSipInvested += currentMonthlySip;
        accumSipValue = (accumSipValue + currentMonthlySip) * (1 + monthlyReturnRate);
      }

      const totalCorpus = lumpSumValue + accumSipValue;
      const inflationTarget = initialLumpSum * Math.pow(1 + inflationPct / 100, yr);

      yearlySchedule.push({
        yearNumber: yr,
        calendarYear: currentYear + yr,
        lumpSumCompounded: Math.round(lumpSumValue),
        sipInvestedCumulative: Math.round(totalSipInvested),
        sipValueCompounded: Math.round(accumSipValue),
        totalCorpusProjected: Math.round(totalCorpus),
        inflationAdjustedTarget: Math.round(inflationTarget),
        monthlySipCurrentYear: Math.round(currentMonthlySip)
      });

      // Apply annual SIP step-up for next year
      currentMonthlySip *= stepUpRatio;
    }

    const totalInvested = initialLumpSum + totalSipInvested;
    const finalCorpus = yearlySchedule[years - 1]?.totalCorpusProjected || 0;

    return {
      inputsUsed: input,
      totalInvested: Math.round(totalInvested),
      totalProjectedCorpus: Math.round(finalCorpus),
      estimatedWealthGain: Math.round(finalCorpus - totalInvested),
      yearlySchedule,
      formulaExplanation: `FV = LumpSum * (1 + r)^n + ∑(SIP * (1 + stepUp)^yr * (1 + r/12)^months). Inflation calculated at ${inflationPct}% p.a.`
    };
  }

  /**
   * Calculate Inflation-adjusted Future Cost
   */
  public calculateFutureValueCost(presentCost: number, inflationPct: number, years: number): number {
    return Math.round(presentCost * Math.pow(1 + inflationPct / 100, years));
  }
}
