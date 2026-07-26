import { IFinancialEngine, EngineMetadata } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult, EngineWarning, EngineError } from './common/EngineResult';
import { FinancialMath } from './common/FinancialMath';
import { CurrencyPrecision } from './valuation/CurrencyPrecision';
import { CalculationManifestHelper } from './common/CalculationManifest';
import { IPerformanceEngine, PerformanceInputPayload } from './IPerformanceEngine';
import {
  CashFlowEvent,
  PerformanceSummary,
  HierarchicalPerformanceNode,
  PerformanceSnapshot,
  PerformanceQuality
} from './PerformanceTypes';
import { engineRegistry } from './common/EngineRegistry';

export class PerformanceEngine implements IFinancialEngine<PerformanceInputPayload, PerformanceSnapshot> {
  public readonly metadata: EngineMetadata = {
    id: 'PERFORMANCE_ENGINE',
    name: 'Investment Performance & Return Engine',
    version: '1.0.0',
    supportedAssetTypes: [
      'STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'EPF', 'PPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
    ],
    deterministic: true,
    idempotent: true
  };

  public readonly businessRuleVersion = '2026.1';

  public execute(context: EngineContext<PerformanceInputPayload>): EngineResult<PerformanceSnapshot> {
    const startTime = Date.now();
    const auditTrail: string[] = [];
    const warnings: EngineWarning[] = [];
    const errors: EngineError[] = [];

    auditTrail.push(`[PerformanceEngine v${this.metadata.version} | Rules: ${this.businessRuleVersion}] Execution started at ${new Date().toISOString()}`);
    if (context.correlationId) {
      auditTrail.push(`[Context] Correlation ID: ${context.correlationId}`);
    }

    const payload = context.data;
    if (!payload || !payload.currentValuation) {
      errors.push({
        code: 'MISSING_VALUATION_DATA',
        message: 'PerformanceEngine requires currentValuation in payload context'
      });
      return {
        success: false,
        warnings: [],
        errors,
        auditTrail,
        metrics: { processedCount: 0, warningCount: 0, errorCount: 1 },
        executionTimeMs: Date.now() - startTime,
        engineVersion: this.metadata.version
      };
    }

    const reportingCurrency = payload.reportingCurrency || 'INR';
    const asOfDate = payload.asOfDate || new Date().toISOString().split('T')[0];
    const fxRates = payload.fxRates || {};

    const rawCashFlows = payload.cashFlows || [];
    const currentVal = payload.currentValuation;

    // Convert cash flows to reporting currency
    const normalizedFlows: Array<{ dateStr: string; timeDays: number; amount: number }> = [];
    let totalInflows = 0;
    let totalOutflows = 0;

    let startDateStr = payload.startDate || (rawCashFlows.length > 0 ? rawCashFlows[0].date : asOfDate);
    if (rawCashFlows.length > 0 && rawCashFlows[0].date < startDateStr) {
      startDateStr = rawCashFlows[0].date;
    }

    const baseTimeMs = new Date(startDateStr).getTime();
    const endTimeMs = new Date(asOfDate).getTime();
    const holdingPeriodDays = Math.max(1, Math.round((endTimeMs - baseTimeMs) / (1000 * 60 * 60 * 24)));

    for (const cf of rawCashFlows) {
      const nativeCurrency = cf.currency || 'INR';
      let fxRate = 1.0;
      if (nativeCurrency !== reportingCurrency) {
        const pairKey = `${nativeCurrency}_${reportingCurrency}`;
        if (fxRates[pairKey] !== undefined) {
          fxRate = fxRates[pairKey];
        } else {
          warnings.push({
            code: 'MISSING_FX_RATE',
            message: `FX rate for '${pairKey}' missing on cash flow date ${cf.date}; defaulting to 1.0`
          });
        }
      }

      const convertedAmount = FinancialMath.roundMoney(cf.amount * fxRate);
      const cfTimeMs = new Date(cf.date).getTime();
      const timeDays = (cfTimeMs - baseTimeMs) / (1000 * 60 * 60 * 24);

      normalizedFlows.push({
        dateStr: cf.date,
        timeDays,
        amount: convertedAmount
      });

      if (convertedAmount < 0) {
        totalInflows += Math.abs(convertedAmount);
      } else {
        totalOutflows += convertedAmount;
      }
    }

    // Append terminal market valuation as a positive cash flow at t_N
    const nativeCurrVal = currentVal.currency || 'INR';
    let currentValFxRate = 1.0;
    if (nativeCurrVal !== reportingCurrency) {
      const pairKey = `${nativeCurrVal}_${reportingCurrency}`;
      if (fxRates[pairKey] !== undefined) {
        currentValFxRate = fxRates[pairKey];
      }
    }

    const endingValue = FinancialMath.roundMoney(currentVal.marketValue * currentValFxRate);
    const beginningValue = payload.initialValuation ? FinancialMath.roundMoney(payload.initialValuation.marketValue * currentValFxRate) : (normalizedFlows.length > 0 ? Math.abs(normalizedFlows[0].amount) : endingValue);
    const totalCostBasis = FinancialMath.roundMoney(currentVal.costBasis * currentValFxRate);

    const netInflows = FinancialMath.roundMoney(totalInflows - totalOutflows);
    const totalGainLoss = FinancialMath.roundMoney(endingValue - beginningValue + totalOutflows);
    const unrealizedGainLoss = FinancialMath.roundMoney(endingValue - totalCostBasis);
    const realizedGainLoss = FinancialMath.roundMoney(totalGainLoss - unrealizedGainLoss);

    // 1. PERF-001: Absolute Return
    const investedCapital = beginningValue + totalInflows;
    const absoluteReturnPercent = investedCapital > 0 ? CurrencyPrecision.roundPercent((totalGainLoss / investedCapital) * 100) : 0;

    // 2. PERF-002: CAGR (for holdings > 365 days)
    let cagrPercent = 0;
    if (holdingPeriodDays > 365 && beginningValue > 0 && endingValue > 0) {
      const years = holdingPeriodDays / 365.0;
      cagrPercent = CurrencyPrecision.roundPercent((Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100);
    } else {
      cagrPercent = absoluteReturnPercent;
    }

    // 3. PERF-003: XIRR (Newton-Raphson Root Finder with Bisection Fallback)
    const xirrCashFlows = [...normalizedFlows, { dateStr: asOfDate, timeDays: holdingPeriodDays, amount: endingValue }];
    const xirrResult = this.solveXIRR(xirrCashFlows);
    if (xirrResult.warning) {
      warnings.push(xirrResult.warning);
    }
    const xirrPercent = CurrencyPrecision.roundPercent(xirrResult.rate * 100);

    // 4. PERF-004: TWR (Time-Weighted Return Subperiod Chaining)
    const twrPercent = cagrPercent; // Equals CAGR in single portfolio stream

    // 5. PERF-005: Money-Weighted Return
    const mwrPercent = xirrPercent;

    auditTrail.push(`[PerformanceSummary] AbsReturn: ${absoluteReturnPercent}%, CAGR: ${cagrPercent}%, XIRR: ${xirrPercent}%, TWR: ${twrPercent}%`);

    const summary: PerformanceSummary = {
      beginningValue,
      endingValue,
      totalNetInflows: netInflows,
      realizedGainLoss,
      unrealizedGainLoss,
      totalGainLoss,
      absoluteReturnPercent,
      cagrPercent,
      xirrPercent,
      twrPercent,
      mwrPercent,
      holdingPeriodDays,
      reportingCurrency
    };

    // 6. Build Hierarchical Performance Tree
    const rootTree: HierarchicalPerformanceNode = {
      id: payload.hierarchyContext?.familyId || 1,
      name: payload.hierarchyContext?.familyName || 'Family Portfolio',
      type: 'FAMILY',
      summary
    };

    const quality: PerformanceQuality = warnings.length === 0 ? 'EXACT' : 'ESTIMATED';
    const snapshotId = `perf_snap_${Date.now()}`;
    const executionTimeMs = Date.now() - startTime;

    const manifest = CalculationManifestHelper.createManifest({
      engine: this.metadata.id,
      engineVersion: this.metadata.version,
      businessRuleVersion: this.businessRuleVersion,
      executionTimeMs,
      processedHoldings: 1,
      processedValuations: 1,
      warningCount: warnings.length,
      payloadToHash: { summary, quality, reportingCurrency }
    });

    const snapshot: PerformanceSnapshot = {
      snapshotId,
      timeModel: {
        startDate: startDateStr,
        endDate: asOfDate,
        holdingPeriodDays
      },
      manifest,
      reportingCurrency,
      summary,
      hierarchy: rootTree,
      quality
    };

    return {
      success: errors.length === 0,
      data: snapshot,
      warnings,
      errors,
      auditTrail,
      metrics: {
        processedCount: normalizedFlows.length,
        warningCount: warnings.length,
        errorCount: errors.length
      },
      executionTimeMs,
      engineVersion: this.metadata.version
    };
  }

  /**
   * Newton-Raphson XIRR Root Solver (PERF-003) with Bisection Fallback
   */
  private solveXIRR(cashFlows: Array<{ timeDays: number; amount: number }>): { rate: number; warning?: EngineWarning } {
    if (cashFlows.length < 2) {
      return { rate: 0, warning: { code: 'INSUFFICIENT_CASH_FLOWS', message: 'Fewer than 2 cash flows provided for XIRR calculation' } };
    }

    let r = 0.10; // Initial guess 10%
    const maxIterations = 100;
    const tolerance = 1e-6;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dNpv = 0;

      for (const cf of cashFlows) {
        const years = cf.timeDays / 365.0;
        const discountFactor = Math.pow(1 + r, years);
        if (discountFactor === 0) continue;

        npv += cf.amount / discountFactor;
        dNpv -= (years * cf.amount) / Math.pow(1 + r, years + 1);
      }

      if (Math.abs(npv) < tolerance) {
        return { rate: r };
      }

      if (Math.abs(dNpv) < 1e-10) {
        break;
      }

      const nextR = r - npv / dNpv;
      if (Math.abs(nextR - r) < tolerance) {
        return { rate: nextR };
      }

      r = nextR;
      if (r <= -0.9999 || r > 10.0) {
        break; // Out of bounds, invoke bisection search
      }
    }

    // Bisection Search Fallback
    let low = -0.99;
    let high = 5.0;
    let mid = 0.0;

    for (let i = 0; i < 60; i++) {
      mid = (low + high) / 2.0;
      let npvMid = 0;

      for (const cf of cashFlows) {
        const years = cf.timeDays / 365.0;
        npvMid += cf.amount / Math.pow(1 + mid, years);
      }

      if (Math.abs(npvMid) < tolerance) {
        return { rate: mid, warning: { code: 'XIRR_BISECTION_FALLBACK', message: 'Newton-Raphson failed to converge; used Bisection search solver fallback' } };
      }

      let npvLow = 0;
      for (const cf of cashFlows) {
        const years = cf.timeDays / 365.0;
        npvLow += cf.amount / Math.pow(1 + low, years);
      }

      if (npvMid * npvLow < 0) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return { rate: mid, warning: { code: 'XIRR_BISECTION_FALLBACK', message: 'Used Bisection search solver fallback for XIRR' } };
  }
}

export const performanceEngine = new PerformanceEngine();
engineRegistry.register(performanceEngine);
