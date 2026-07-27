export interface TaxCalculationInput {
  grossIncome: number;
  salaryIncome?: number;
  housePropertyIncome?: number;
  capitalGainsStcg?: number;
  capitalGainsLtcg?: number;
  otherIncome?: number;
  claimed80C?: number;
  claimed80D?: number;
  claimed80CCD1B?: number;
  claimed24B?: number;
}

export interface TaxCalculationResult {
  regime: 'OLD' | 'NEW';
  grossTotalIncome: number;
  totalDeductions: number;
  netTaxableIncome: number;
  baseTax: number;
  rebate87A: number;
  cess: number;
  totalTaxPayable: number;
  effectiveTaxRatePercent: number;
}

export class TaxCalculationEngine {
  public static calculateNewRegimeTax(input: TaxCalculationInput): TaxCalculationResult {
    const grossTotalIncome = input.grossIncome;
    const standardDeduction = 75000;
    const netTaxableIncome = Math.max(0, grossTotalIncome - standardDeduction);

    let baseTax = 0;
    if (netTaxableIncome > 1500000) {
      baseTax += (netTaxableIncome - 1500000) * 0.30;
      baseTax += 300000 * 0.20 + 200000 * 0.15 + 300000 * 0.10 + 400000 * 0.05;
    } else if (netTaxableIncome > 1200000) {
      baseTax += (netTaxableIncome - 1200000) * 0.20;
      baseTax += 200000 * 0.15 + 300000 * 0.10 + 400000 * 0.05;
    } else if (netTaxableIncome > 1000000) {
      baseTax += (netTaxableIncome - 1000000) * 0.15;
      baseTax += 300000 * 0.10 + 400000 * 0.05;
    } else if (netTaxableIncome > 700000) {
      baseTax += (netTaxableIncome - 700000) * 0.10;
      baseTax += 400000 * 0.05;
    } else if (netTaxableIncome > 300000) {
      baseTax += (netTaxableIncome - 300000) * 0.05;
    }

    let rebate87A = 0;
    if (netTaxableIncome <= 700000) {
      rebate87A = baseTax;
    }

    const taxAfterRebate = Math.max(0, baseTax - rebate87A);
    const cess = Math.round(taxAfterRebate * 0.04);
    const totalTaxPayable = taxAfterRebate + cess;

    return {
      regime: 'NEW',
      grossTotalIncome,
      totalDeductions: standardDeduction,
      netTaxableIncome,
      baseTax,
      rebate87A,
      cess,
      totalTaxPayable,
      effectiveTaxRatePercent: grossTotalIncome > 0 ? (totalTaxPayable / grossTotalIncome) * 100 : 0
    };
  }

  public static calculateOldRegimeTax(input: TaxCalculationInput): TaxCalculationResult {
    const grossTotalIncome = input.grossIncome;
    const standardDeduction = 50000;
    const deduction80C = Math.min(150000, input.claimed80C || 0);
    const deduction80D = Math.min(25000, input.claimed80D || 0);
    const deduction80CCD = Math.min(50000, input.claimed80CCD1B || 0);
    const deduction24B = Math.min(200000, input.claimed24B || 0);

    const totalDeductions = standardDeduction + deduction80C + deduction80D + deduction80CCD + deduction24B;
    const netTaxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

    let baseTax = 0;
    if (netTaxableIncome > 1000000) {
      baseTax += (netTaxableIncome - 1000000) * 0.30;
      baseTax += 500000 * 0.20 + 250000 * 0.05;
    } else if (netTaxableIncome > 500000) {
      baseTax += (netTaxableIncome - 500000) * 0.20;
      baseTax += 250000 * 0.05;
    } else if (netTaxableIncome > 250000) {
      baseTax += (netTaxableIncome - 250000) * 0.05;
    }

    let rebate87A = 0;
    if (netTaxableIncome <= 500000) {
      rebate87A = Math.min(1250, baseTax);
    }

    const taxAfterRebate = Math.max(0, baseTax - rebate87A);
    const cess = Math.round(taxAfterRebate * 0.04);
    const totalTaxPayable = taxAfterRebate + cess;

    return {
      regime: 'OLD',
      grossTotalIncome,
      totalDeductions,
      netTaxableIncome,
      baseTax,
      rebate87A,
      cess,
      totalTaxPayable,
      effectiveTaxRatePercent: grossTotalIncome > 0 ? (totalTaxPayable / grossTotalIncome) * 100 : 0
    };
  }
}
