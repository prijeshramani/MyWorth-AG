import { IFinancialEngine, EngineMetadata } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult, EngineWarning, EngineError } from './common/EngineResult';
import { FinancialMath } from './common/FinancialMath';
import { CurrencyPrecision } from './valuation/CurrencyPrecision';
import { CalculationManifestHelper } from './common/CalculationManifest';
import { IPortfolioAnalyticsEngine, PortfolioAnalyticsInputPayload } from './IPortfolioAnalyticsEngine';
import {
  AllocationItem,
  MultiDimensionalAllocations,
  DiversificationScore,
  ConcentrationScore,
  CashAllocation,
  PortfolioHealth,
  PortfolioAnalyticsSnapshot
} from './PortfolioAnalyticsTypes';
import { engineRegistry } from './common/EngineRegistry';

export class PortfolioAnalyticsEngine implements IFinancialEngine<PortfolioAnalyticsInputPayload, PortfolioAnalyticsSnapshot> {
  public readonly metadata: EngineMetadata = {
    id: 'PORTFOLIO_ANALYTICS_ENGINE',
    name: 'Multi-Dimensional Portfolio Analytics Engine',
    version: '1.0.0',
    supportedAssetTypes: [
      'STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'EPF', 'PPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
    ],
    deterministic: true,
    idempotent: true
  };

  public readonly businessRuleVersion = '2026.1';

  public execute(context: EngineContext<PortfolioAnalyticsInputPayload>): EngineResult<PortfolioAnalyticsSnapshot> {
    const startTime = Date.now();
    const auditTrail: string[] = [];
    const warnings: EngineWarning[] = [];
    const errors: EngineError[] = [];

    auditTrail.push(`[PortfolioAnalyticsEngine v${this.metadata.version} | Rules: ${this.businessRuleVersion}] Execution started at ${new Date().toISOString()}`);
    if (context.correlationId) {
      auditTrail.push(`[Context] Correlation ID: ${context.correlationId}`);
    }

    const payload = context.data;
    if (!payload || !payload.valuationResults) {
      errors.push({
        code: 'MISSING_VALUATION_DATA',
        message: 'PortfolioAnalyticsEngine requires valuationResults in payload context'
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
    const assetMeta = payload.assetMetadata || {};

    const valResults = payload.valuationResults;

    let totalMarketValue = 0;
    let totalCostBasis = 0;
    let liquidCashValue = 0;

    const assetMap = new Map<string, { value: number; count: number }>();
    const sectorMap = new Map<string, { value: number; count: number }>();
    const marketMap = new Map<string, { value: number; count: number }>();
    const currencyMap = new Map<string, { value: number; count: number }>();
    const geoMap = new Map<string, { value: number; count: number }>();

    const itemValues: number[] = [];

    for (const val of valResults) {
      const nativeCurrency = val.currency || 'INR';
      let fxRate = 1.0;
      if (nativeCurrency !== reportingCurrency) {
        const pairKey = `${nativeCurrency}_${reportingCurrency}`;
        if (fxRates[pairKey] !== undefined) {
          fxRate = fxRates[pairKey];
        } else {
          warnings.push({
            code: 'MISSING_FX_RATE',
            message: `FX rate for '${pairKey}' missing; defaulting to 1.0`
          });
        }
      }

      const convertedMV = FinancialMath.roundMoney(val.marketValue * fxRate);
      const convertedCB = FinancialMath.roundMoney(val.costBasis * fxRate);

      totalMarketValue = FinancialMath.roundMoney(totalMarketValue + convertedMV);
      totalCostBasis = FinancialMath.roundMoney(totalCostBasis + convertedCB);
      itemValues.push(convertedMV);

      const meta = assetMeta[val.assetId || -1] || {};
      const assetType = (val.assetType || 'OTHER').toUpperCase();
      const sector = (meta.sector || 'OTHER').toUpperCase();
      const market = (meta.market || (assetType === 'STOCK' ? 'IN_NSE' : 'DOMESTIC')).toUpperCase();
      const currency = nativeCurrency.toUpperCase();
      const country = (meta.country || (currency === 'USD' ? 'United States' : 'India'));

      // Check liquidity
      if (meta.isLiquid || assetType === 'BANK' || assetType === 'OTHER') {
        liquidCashValue = FinancialMath.roundMoney(liquidCashValue + convertedMV);
      }

      this.addToMap(assetMap, assetType, convertedMV);
      this.addToMap(sectorMap, sector, convertedMV);
      this.addToMap(marketMap, market, convertedMV);
      this.addToMap(currencyMap, currency, convertedMV);
      this.addToMap(geoMap, country, convertedMV);
    }

    // 1. ANL-001 & ANL-002: Build Allocations
    const allocations: MultiDimensionalAllocations = {
      assetAllocation: this.buildAllocationList(assetMap, totalMarketValue),
      sectorAllocation: this.buildAllocationList(sectorMap, totalMarketValue),
      marketAllocation: this.buildAllocationList(marketMap, totalMarketValue),
      currencyAllocation: this.buildAllocationList(currencyMap, totalMarketValue),
      geographicAllocation: this.buildAllocationList(geoMap, totalMarketValue)
    };

    // 2. ANL-003: Herfindahl-Hirschman Index (HHI) & DiversificationScore
    let hhiIndex = 0;
    if (totalMarketValue > 0) {
      for (const val of itemValues) {
        const share = val / totalMarketValue;
        hhiIndex += share * share;
      }
    }
    hhiIndex = CurrencyPrecision.roundPercent(hhiIndex);

    const divScoreVal = Math.max(0, Math.min(100, Math.round((1 - hhiIndex) * 100)));
    let divRating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'HIGHLY_CONCENTRATED' = 'GOOD';
    if (divScoreVal >= 80) divRating = 'EXCELLENT';
    else if (divScoreVal >= 60) divRating = 'GOOD';
    else if (divScoreVal >= 40) divRating = 'MODERATE';
    else if (divScoreVal >= 20) divRating = 'POOR';
    else divRating = 'HIGHLY_CONCENTRATED';

    const diversification: DiversificationScore = {
      score: divScoreVal,
      hhiIndex,
      rating: divRating
    };

    // 3. Concentration Ratios
    itemValues.sort((a, b) => b - a);
    const top1Val = itemValues[0] || 0;
    const top3Val = (itemValues[0] || 0) + (itemValues[1] || 0) + (itemValues[2] || 0);
    const top5Val = top3Val + (itemValues[3] || 0) + (itemValues[4] || 0);

    const top1Ratio = totalMarketValue > 0 ? CurrencyPrecision.roundPercent((top1Val / totalMarketValue) * 100) : 0;
    const top3Ratio = totalMarketValue > 0 ? CurrencyPrecision.roundPercent((top3Val / totalMarketValue) * 100) : 0;
    const top5Ratio = totalMarketValue > 0 ? CurrencyPrecision.roundPercent((top5Val / totalMarketValue) * 100) : 0;
    const topSectorRatio = allocations.sectorAllocation.length > 0 ? allocations.sectorAllocation[0].percentageOfTotal : 0;

    const isConcentrationWarningTriggered = top1Ratio > 25 || top3Ratio > 50 || topSectorRatio > 40;

    const concentration: ConcentrationScore = {
      top1AssetConcentrationPercent: top1Ratio,
      top3AssetConcentrationPercent: top3Ratio,
      top5AssetConcentrationPercent: top5Ratio,
      topSectorConcentrationPercent: topSectorRatio,
      isConcentrationWarningTriggered
    };

    // 4. ANL-005: Cash Liquidity Assessment
    const cashPercentage = totalMarketValue > 0 ? CurrencyPrecision.roundPercent((liquidCashValue / totalMarketValue) * 100) : 0;
    let cashStatus: 'OPTIMAL' | 'LOW_LIQUIDITY' | 'EXCESS_CASH' = 'OPTIMAL';
    if (cashPercentage < 5) cashStatus = 'LOW_LIQUIDITY';
    else if (cashPercentage > 20) cashStatus = 'EXCESS_CASH';

    const cashLiquidity: CashAllocation = {
      liquidCashMarketValue: liquidCashValue,
      investedAssetsMarketValue: FinancialMath.roundMoney(totalMarketValue - liquidCashValue),
      cashPercentage,
      recommendedCashRange: { minPercent: 5, maxPercent: 20 },
      status: cashStatus
    };

    // 5. ANL-004: Portfolio Health Score
    const healthWarnings: string[] = [];
    if (isConcentrationWarningTriggered) {
      healthWarnings.push('High concentration risk detected in top assets or sector');
    }
    if (cashStatus === 'LOW_LIQUIDITY') {
      healthWarnings.push('Low liquid cash buffer (< 5% of portfolio)');
    } else if (cashStatus === 'EXCESS_CASH') {
      healthWarnings.push('Excess cash allocation (> 20% of portfolio) may create cash drag');
    }

    const healthScore = Math.max(0, Math.min(100, Math.round((divScoreVal * 0.6) + ((100 - top1Ratio) * 0.4))));
    let healthRating: 'HEALTHY' | 'MODERATE_RISK' | 'HIGH_RISK' = 'HEALTHY';
    if (healthScore < 50) healthRating = 'HIGH_RISK';
    else if (healthScore < 75) healthRating = 'MODERATE_RISK';

    const health: PortfolioHealth = {
      healthScore,
      rating: healthRating,
      diversification,
      concentration,
      cashLiquidity,
      warnings: healthWarnings
    };

    auditTrail.push(`[PortfolioHealth] Score: ${healthScore}/100 (${healthRating}), HHI: ${hhiIndex}, Cash: ${cashPercentage}%`);

    const snapshotId = `analytics_snap_${Date.now()}`;
    const executionTimeMs = Date.now() - startTime;

    const manifest = CalculationManifestHelper.createManifest({
      engine: this.metadata.id,
      engineVersion: this.metadata.version,
      businessRuleVersion: this.businessRuleVersion,
      executionTimeMs,
      processedHoldings: valResults.length,
      processedValuations: valResults.length,
      warningCount: warnings.length,
      payloadToHash: { health, allocations, reportingCurrency }
    });

    const snapshot: PortfolioAnalyticsSnapshot = {
      snapshotId,
      asOfDate,
      reportingCurrency,
      manifest,
      allocations,
      health,
      growthSummary: {
        totalMarketValue,
        totalCostBasis,
        totalUnrealizedGain: FinancialMath.roundMoney(totalMarketValue - totalCostBasis)
      }
    };

    return {
      success: errors.length === 0,
      data: snapshot,
      warnings,
      errors,
      auditTrail,
      metrics: {
        processedCount: valResults.length,
        warningCount: warnings.length,
        errorCount: errors.length
      },
      executionTimeMs,
      engineVersion: this.metadata.version
    };
  }

  private addToMap(map: Map<string, { value: number; count: number }>, key: string, value: number) {
    const existing = map.get(key) || { value: 0, count: 0 };
    map.set(key, {
      value: FinancialMath.roundMoney(existing.value + value),
      count: existing.count + 1
    });
  }

  private buildAllocationList(map: Map<string, { value: number; count: number }>, totalValue: number): AllocationItem[] {
    const items: AllocationItem[] = [];
    map.forEach((data, key) => {
      const percentageOfTotal = totalValue > 0 ? CurrencyPrecision.roundPercent((data.value / totalValue) * 100) : 0;
      items.push({
        key,
        marketValue: data.value,
        percentageOfTotal,
        holdingCount: data.count
      });
    });
    return items.sort((a, b) => b.marketValue - a.marketValue);
  }
}

export const portfolioAnalyticsEngine = new PortfolioAnalyticsEngine();
engineRegistry.register(portfolioAnalyticsEngine);
