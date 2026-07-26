import { IFinancialEngine, EngineMetadata } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult, EngineWarning, EngineError } from './common/EngineResult';
import { FinancialMath } from './common/FinancialMath';
import { CurrencyPrecision } from './valuation/CurrencyPrecision';
import { CalculationManifestHelper } from './common/CalculationManifest';
import { IRiskEngine, RiskInputPayload } from './IRiskEngine';
import {
  PortfolioTimePoint,
  BenchmarkReturnPoint,
  RiskSummary,
  BenchmarkComparisonItem,
  BenchmarkComparison,
  RiskRecommendation,
  RiskSnapshot,
  RiskClassification
} from './RiskTypes';
import { engineRegistry } from './common/EngineRegistry';

export class RiskEngine implements IFinancialEngine<RiskInputPayload, RiskSnapshot> {
  public readonly metadata: EngineMetadata = {
    id: 'RISK_ENGINE',
    name: 'Quantitative Risk & Benchmark Analytics Engine',
    version: '1.0.0',
    supportedAssetTypes: [
      'STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'EPF', 'PPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
    ],
    deterministic: true,
    idempotent: true
  };

  public readonly businessRuleVersion = '2026.1';

  public execute(context: EngineContext<RiskInputPayload>): EngineResult<RiskSnapshot> {
    const startTime = Date.now();
    const auditTrail: string[] = [];
    const warnings: EngineWarning[] = [];
    const errors: EngineError[] = [];

    auditTrail.push(`[RiskEngine v${this.metadata.version} | Rules: ${this.businessRuleVersion}] Execution started at ${new Date().toISOString()}`);
    if (context.correlationId) {
      auditTrail.push(`[Context] Correlation ID: ${context.correlationId}`);
    }

    const payload = context.data;
    if (!payload || !payload.portfolioTimeSeries || payload.portfolioTimeSeries.length < 2) {
      errors.push({
        code: 'INSUFFICIENT_TIME_SERIES_DATA',
        message: 'RiskEngine requires at least 2 portfolioTimeSeries data points'
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
    const riskFreeRatePercent = payload.riskFreeRatePercent !== undefined ? payload.riskFreeRatePercent : 6.50; // Default 6.5% India Repo Rate

    const timeSeries = payload.portfolioTimeSeries;

    // 1. Calculate Period Returns if not present
    const dailyReturns: number[] = [];
    for (let i = 1; i < timeSeries.length; i++) {
      const prevVal = timeSeries[i - 1].portfolioValue;
      const currVal = timeSeries[i].portfolioValue;
      const ret = prevVal > 0 ? (currVal - prevVal) / prevVal : 0;
      dailyReturns.push(ret);
    }

    const N = dailyReturns.length;
    const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / N;
    const annualizedReturnPercent = (Math.pow(1 + meanReturn, 252) - 1) * 100;

    // 2. RISK-003: Annualized Volatility
    let variance = 0;
    for (const r of dailyReturns) {
      variance += (r - meanReturn) * (r - meanReturn);
    }
    const dailyStdDev = N > 1 ? Math.sqrt(variance / (N - 1)) : 0;
    const annualizedVolatilityPercent = CurrencyPrecision.roundPercent(dailyStdDev * Math.sqrt(252) * 100);

    // Downside Deviation (Sortino Denominator)
    const dailyRf = Math.pow(1 + riskFreeRatePercent / 100, 1 / 252) - 1;
    let downsideSqSum = 0;
    for (const r of dailyReturns) {
      const downside = Math.min(0, r - dailyRf);
      downsideSqSum += downside * downside;
    }
    const downsideStdDev = N > 0 ? Math.sqrt(downsideSqSum / N) : 0;
    const downsideDeviationPercent = CurrencyPrecision.roundPercent(downsideStdDev * Math.sqrt(252) * 100);

    // 3. RISK-001 & RISK-002: Sharpe & Sortino Ratios
    const excessReturn = annualizedReturnPercent - riskFreeRatePercent;
    const sharpeRatio = annualizedVolatilityPercent > 0 ? CurrencyPrecision.roundPercent(excessReturn / annualizedVolatilityPercent) : 0;
    const sortinoRatio = downsideDeviationPercent > 0 ? CurrencyPrecision.roundPercent(excessReturn / downsideDeviationPercent) : 0;

    // 4. RISK-004: Maximum Drawdown & Peak/Trough Duration
    let maxDrawdown = 0;
    let maxDrawdownDurationDays = 0;
    let currentPeak = timeSeries[0].portfolioValue;
    let currentPeakDate = new Date(timeSeries[0].date).getTime();

    for (let i = 0; i < timeSeries.length; i++) {
      const val = timeSeries[i].portfolioValue;
      if (val > currentPeak) {
        currentPeak = val;
        currentPeakDate = new Date(timeSeries[i].date).getTime();
      } else {
        const drawdown = (currentPeak - val) / currentPeak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          const currDate = new Date(timeSeries[i].date).getTime();
          maxDrawdownDurationDays = Math.round((currDate - currentPeakDate) / (1000 * 60 * 60 * 24));
        }
      }
    }

    const maxDrawdownPercent = CurrencyPrecision.roundPercent(maxDrawdown * 100);

    // Risk Classification Rating
    let riskRating: RiskClassification = 'MODERATE';
    if (annualizedVolatilityPercent > 25 || maxDrawdownPercent > 25) riskRating = 'EXTREME';
    else if (annualizedVolatilityPercent > 18 || maxDrawdownPercent > 18) riskRating = 'HIGH';
    else if (annualizedVolatilityPercent > 10) riskRating = 'MODERATE';
    else riskRating = 'LOW';

    auditTrail.push(`[RiskSummary] Volatility: ${annualizedVolatilityPercent}%, MaxDrawdown: ${maxDrawdownPercent}%, Sharpe: ${sharpeRatio}, Sortino: ${sortinoRatio}`);

    const summary: RiskSummary = {
      annualizedVolatilityPercent,
      downsideDeviationPercent,
      maxDrawdownPercent,
      maxDrawdownDurationDays,
      sharpeRatio,
      sortinoRatio,
      riskFreeRateUsed: riskFreeRatePercent,
      riskRating
    };

    // 5. RISK-005, RISK-006, RISK-007: Benchmark Comparisons
    const benchmarkItems: BenchmarkComparisonItem[] = [];
    const benchmarkSeries = payload.benchmarkTimeSeries || {};

    const defaultNames: Record<string, string> = {
      NIFTY_50: 'Nifty 50 Index',
      SENSEX: 'BSE Sensex Index',
      NIFTY_500: 'Nifty 500 Index',
      NASDAQ_100: 'Nasdaq 100 Index',
      S_AND_P_500: 'S&P 500 Index'
    };

    Object.keys(benchmarkSeries).forEach(bmKey => {
      const bmPoints = benchmarkSeries[bmKey];
      if (bmPoints && bmPoints.length >= 2) {
        const bmReturns: number[] = [];
        for (let i = 1; i < bmPoints.length; i++) {
          const prev = bmPoints[i - 1].indexValue;
          const curr = bmPoints[i].indexValue;
          bmReturns.push(prev > 0 ? (curr - prev) / prev : 0);
        }

        const minLen = Math.min(dailyReturns.length, bmReturns.length);
        let cov = 0;
        let bmVar = 0;
        let portVar = 0;
        let diffSqSum = 0;

        const bmMean = bmReturns.slice(0, minLen).reduce((s, r) => s + r, 0) / minLen;
        const pMean = dailyReturns.slice(0, minLen).reduce((s, r) => s + r, 0) / minLen;

        for (let i = 0; i < minLen; i++) {
          const pDiff = dailyReturns[i] - pMean;
          const bDiff = bmReturns[i] - bmMean;
          cov += pDiff * bDiff;
          bmVar += bDiff * bDiff;
          portVar += pDiff * pDiff;

          const diff = dailyReturns[i] - bmReturns[i];
          diffSqSum += diff * diff;
        }

        const beta = bmVar > 0 ? CurrencyPrecision.roundPercent(cov / bmVar) : 1.0;
        const correlation = (portVar > 0 && bmVar > 0) ? CurrencyPrecision.roundPercent(cov / Math.sqrt(portVar * bmVar)) : 0;
        const trackingError = minLen > 1 ? CurrencyPrecision.roundPercent(Math.sqrt(diffSqSum / (minLen - 1)) * Math.sqrt(252) * 100) : 0;
        const bmReturnPercent = CurrencyPrecision.roundPercent((Math.pow(1 + bmMean, 252) - 1) * 100);

        benchmarkItems.push({
          benchmarkSymbol: bmKey,
          benchmarkName: defaultNames[bmKey] || bmKey,
          benchmarkReturnPercent: bmReturnPercent,
          portfolioExcessReturnPercent: CurrencyPrecision.roundPercent(annualizedReturnPercent - bmReturnPercent),
          beta,
          correlation,
          trackingErrorPercent: trackingError,
          alphaPercent: CurrencyPrecision.roundPercent(annualizedReturnPercent - (riskFreeRatePercent + beta * (bmReturnPercent - riskFreeRatePercent)))
        });
      }
    });

    const benchmarkComparison: BenchmarkComparison | undefined = benchmarkItems.length > 0 ? {
      primaryBenchmark: benchmarkItems[0],
      benchmarks: benchmarkItems
    } : undefined;

    // 6. Risk Recommendations Generator
    const recommendations: RiskRecommendation[] = [];
    if (sharpeRatio < 0.5) {
      recommendations.push({
        id: 'REC_SHARPE_LOW',
        category: 'VOLATILITY',
        title: 'Suboptimal Risk-Adjusted Returns',
        finding: `Sharpe ratio of ${sharpeRatio} is below the target threshold of 0.80`,
        recommendation: 'Rebalance high-volatility holdings into core index funds or fixed income to optimize return per unit of risk',
        priority: 'HIGH'
      });
    }

    if (maxDrawdownPercent > 20) {
      recommendations.push({
        id: 'REC_DRAWDOWN_HIGH',
        category: 'DRAWDOWN',
        title: 'Elevated Drawdown Exposure',
        finding: `Maximum drawdown of ${maxDrawdownPercent}% exceeds risk tolerance threshold of 20%`,
        recommendation: 'Implement automated stop-loss policies or increase allocation to non-correlated defensive assets',
        priority: 'CRITICAL'
      });
    }

    const snapshotId = `risk_snap_${Date.now()}`;
    const executionTimeMs = Date.now() - startTime;

    const manifest = CalculationManifestHelper.createManifest({
      engine: this.metadata.id,
      engineVersion: this.metadata.version,
      businessRuleVersion: this.businessRuleVersion,
      executionTimeMs,
      processedHoldings: timeSeries.length,
      processedValuations: timeSeries.length,
      warningCount: warnings.length,
      payloadToHash: { summary, benchmarkComparison, reportingCurrency }
    });

    const snapshot: RiskSnapshot = {
      snapshotId,
      asOfDate,
      reportingCurrency,
      manifest,
      summary,
      benchmarkComparison,
      recommendations
    };

    return {
      success: errors.length === 0,
      data: snapshot,
      warnings,
      errors,
      auditTrail,
      metrics: {
        processedCount: timeSeries.length,
        warningCount: warnings.length,
        errorCount: errors.length
      },
      executionTimeMs,
      engineVersion: this.metadata.version
    };
  }
}

export const riskEngine = new RiskEngine();
engineRegistry.register(riskEngine);
