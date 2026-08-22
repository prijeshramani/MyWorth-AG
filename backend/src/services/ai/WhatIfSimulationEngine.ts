import { db } from '../../db';

export interface SimulationParams {
  monthlySipAmount?: number;
  monthlySipStepUpPercent?: number; // e.g. 5% annual increase
  lumpSumInvestment?: number;
  retirementTargetAge?: number; // e.g. 55 or 60
  currentAge?: number; // e.g. 35
  goalTargetAmount?: number;
  goalHorizonYears?: number;
  inflationRatePercent?: number; // e.g. 6% or 8%
  expectedReturnPercent?: number; // e.g. 12%
}

export interface ScenarioImpactResult {
  scenarioName: 'Base' | 'Optimistic' | 'Conservative' | 'Custom';
  expectedReturnPercent: number;
  inflationRatePercent: number;
  projectedCorpusAtRetirement: number;
  corpusRequiredAtRetirement: number;
  corpusReadinessPercent: number;
  monthlySipRequired: number;
  financialBenefitAmount: number; // Delta over base case
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  taxSavingsBenefit: number;
  timelineYears: number;
}

export interface WhatIfSimulationResponse {
  familyId: number;
  templateType?: string;
  baselineNetWorth: number;
  baselineMonthlySip: number;
  params: SimulationParams;
  scenarios: {
    base: ScenarioImpactResult;
    optimistic: ScenarioImpactResult;
    conservative: ScenarioImpactResult;
    custom: ScenarioImpactResult;
  };
  recommendationImpact: {
    summary: string;
    suggestedActionId: string;
    expectedImprovement: string;
    relatedSimulationTemplate: string;
    estimatedCompletionTime: string;
  };
}

export interface SimulationTemplateDefinition {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultParams: SimulationParams;
}

export class WhatIfSimulationEngine {
  public getTemplates(): SimulationTemplateDefinition[] {
    return [
      {
        id: 'retirement_boost',
        title: 'Retirement Corpus Boost (SIP Step-Up)',
        category: 'RETIREMENT',
        description: 'Simulates increasing your monthly SIP by 10% annually to accelerate FIRE target readiness.',
        defaultParams: {
          monthlySipAmount: 25000,
          monthlySipStepUpPercent: 10,
          retirementTargetAge: 55,
          currentAge: 35,
          inflationRatePercent: 6,
          expectedReturnPercent: 12
        }
      },
      {
        id: 'tax_saving_optimization',
        title: 'Tax Saving Re-investment (80C / 80CCD)',
        category: 'TAX',
        description: 'Simulates re-investing Section 80C tax savings (₹46,800/yr) into equity ELSS funds.',
        defaultParams: {
          monthlySipAmount: 3900,
          lumpSumInvestment: 50000,
          goalHorizonYears: 15,
          inflationRatePercent: 6,
          expectedReturnPercent: 12.5
        }
      },
      {
        id: 'fire_early_retirement',
        title: 'FIRE Early Retirement Stress Test',
        category: 'RETIREMENT',
        description: 'Simulates retiring 5 years earlier (Age 50 vs 55) under conservative 8% inflation.',
        defaultParams: {
          retirementTargetAge: 50,
          currentAge: 35,
          inflationRatePercent: 8,
          expectedReturnPercent: 10
        }
      },
      {
        id: 'child_education_milestone',
        title: 'Child Higher Education Corpus Builder',
        category: 'GOALS',
        description: 'Simulates building a ₹50 Lakh education corpus over a 15-year horizon.',
        defaultParams: {
          goalTargetAmount: 5000000,
          goalHorizonYears: 15,
          inflationRatePercent: 7,
          expectedReturnPercent: 12
        }
      },
      {
        id: 'home_purchase_downpayment',
        title: 'Home Purchase Down Payment Planning',
        category: 'GOALS',
        description: 'Simulates accumulating a ₹25 Lakh down payment over 5 years.',
        defaultParams: {
          goalTargetAmount: 2500000,
          goalHorizonYears: 5,
          inflationRatePercent: 6,
          expectedReturnPercent: 11
        }
      },
      {
        id: 'emergency_fund_topup',
        title: 'Emergency Fund 6-Month Coverage Shield',
        category: 'PROTECTION',
        description: 'Simulates parking 6 months of living expenses (₹3 Lakhs) in liquid debt / high-yield savings.',
        defaultParams: {
          lumpSumInvestment: 300000,
          goalHorizonYears: 1,
          inflationRatePercent: 5,
          expectedReturnPercent: 7
        }
      }
    ];
  }

  public runSimulation(
    familyId: number,
    params: SimulationParams,
    templateType?: string
  ): WhatIfSimulationResponse {
    // 1. Retrieve current baseline portfolio net worth scoped to familyId
    const assets = db.prepare(`
      SELECT a.id, a.type, a.category, COALESCE(p.price, 0) as price
      FROM assets a
      LEFT JOIN family_members fm ON a.family_member_id = fm.id
      LEFT JOIN asset_prices p ON p.asset_id = a.id AND p.date = (SELECT MAX(date) FROM asset_prices WHERE asset_id = a.id)
      WHERE (fm.family_id = ? OR a.family_member_id IS NULL)
    `).all(familyId) as any[];

    let baselineNetWorth = 0;
    for (const a of assets) {
      const txs = db.prepare('SELECT type, amount, quantity FROM transactions WHERE asset_id = ?').all(a.id) as any[];
      if (a.type === 'BANK_ACCOUNT' || a.type === 'EPF') {
        const latestPrice = db.prepare('SELECT price FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1').get(a.id) as { price: number } | undefined;
        baselineNetWorth += latestPrice ? latestPrice.price : txs.reduce((acc, t) => t.type === 'BUY' || t.type === 'REINVEST' ? acc + t.amount : acc - t.amount, 0);
      } else {
        const totalQty = txs.reduce((acc, t) => t.type === 'BUY' || t.type === 'REINVEST' ? acc + t.quantity : acc - t.quantity, 0);
        baselineNetWorth += totalQty * (a.price || (txs.length > 0 ? txs[txs.length - 1].amount / (txs[txs.length - 1].quantity || 1) : 0));
      }
    }
    baselineNetWorth = Math.max(100000, baselineNetWorth);

    const currentAge = params.currentAge || 35;
    const retirementAge = params.retirementTargetAge || 55;
    const yearsToRetire = Math.max(1, retirementAge - currentAge);
    const inflation = (params.inflationRatePercent || 6) / 100;
    const baseReturn = (params.expectedReturnPercent || 12) / 100;
    const monthlySip = params.monthlySipAmount || 25000;
    const lumpSum = params.lumpSumInvestment || 0;

    // Required corpus calculation at retirement age
    const annualExpenseInFuture = 600000 * Math.pow(1 + inflation, yearsToRetire);
    const corpusRequired = annualExpenseInFuture * 25; // 4% SWR Rule

    // Evaluate Scenarios
    const baseScenario = this.calculateScenario('Base', baseReturn, inflation, yearsToRetire, monthlySip, lumpSum, baselineNetWorth, corpusRequired);
    const optimisticScenario = this.calculateScenario('Optimistic', baseReturn + 0.02, inflation, yearsToRetire, monthlySip * 1.15, lumpSum, baselineNetWorth, corpusRequired);
    const conservativeScenario = this.calculateScenario('Conservative', baseReturn - 0.02, inflation + 0.01, yearsToRetire, monthlySip * 0.85, lumpSum, baselineNetWorth, corpusRequired);
    const customScenario = this.calculateScenario('Custom', baseReturn, inflation, yearsToRetire, monthlySip, lumpSum, baselineNetWorth, corpusRequired);

    return {
      familyId,
      templateType: templateType || 'custom_simulation',
      baselineNetWorth,
      baselineMonthlySip: monthlySip,
      params,
      scenarios: {
        base: baseScenario,
        optimistic: optimisticScenario,
        conservative: conservativeScenario,
        custom: customScenario
      },
      recommendationImpact: {
        summary: `Increasing monthly SIP to ₹${(monthlySip * 1.15).toLocaleString('en-IN')} increases projected retirement corpus readiness to ${optimisticScenario.corpusReadinessPercent}%.`,
        suggestedActionId: 'RUN_RETIREMENT_SIMULATION',
        expectedImprovement: `+₹${(optimisticScenario.financialBenefitAmount).toLocaleString('en-IN')} additional corpus at age ${retirementAge}`,
        relatedSimulationTemplate: templateType || 'retirement_boost',
        estimatedCompletionTime: '< 1 second'
      }
    };
  }

  private calculateScenario(
    scenarioName: 'Base' | 'Optimistic' | 'Conservative' | 'Custom',
    returnRate: number,
    inflationRate: number,
    years: number,
    monthlySip: number,
    lumpSum: number,
    baselineWorth: number,
    corpusRequired: number
  ): ScenarioImpactResult {
    const monthlyRate = returnRate / 12;
    const months = years * 12;

    // Future value of baseline worth + lump sum
    const fvInitial = (baselineWorth + lumpSum) * Math.pow(1 + returnRate, years);

    // Future value of monthly SIP
    const fvSip = monthlySip * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

    const projectedCorpus = Math.round(fvInitial + fvSip);
    const readinessPct = Math.min(200, Math.round((projectedCorpus / corpusRequired) * 100));

    // Required monthly SIP to reach 100% corpus target
    const targetDeficit = Math.max(0, corpusRequired - fvInitial);
    const sipRequired = targetDeficit > 0
      ? Math.round(targetDeficit / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)))
      : 0;

    const baseFv = (baselineWorth * Math.pow(1 + 0.12, years)) + (25000 * (((Math.pow(1 + 0.01, months) - 1) / 0.01) * 1.01));
    const financialBenefit = Math.round(projectedCorpus - baseFv);

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'MODERATE';
    if (returnRate > 0.13) riskLevel = 'HIGH';
    if (returnRate < 0.09) riskLevel = 'LOW';

    return {
      scenarioName,
      expectedReturnPercent: Number((returnRate * 100).toFixed(1)),
      inflationRatePercent: Number((inflationRate * 100).toFixed(1)),
      projectedCorpusAtRetirement: projectedCorpus,
      corpusRequiredAtRetirement: Math.round(corpusRequired),
      corpusReadinessPercent: readinessPct,
      monthlySipRequired: sipRequired,
      financialBenefitAmount: financialBenefit,
      riskLevel,
      taxSavingsBenefit: scenarioName === 'Optimistic' ? 46800 : 15000,
      timelineYears: years
    };
  }
}

export const whatIfSimulationEngine = new WhatIfSimulationEngine();
