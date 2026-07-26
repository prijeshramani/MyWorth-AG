import { IFinancialEngine, EngineMetadata } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult, EngineWarning, EngineError } from './common/EngineResult';
import { FinancialMath } from './common/FinancialMath';
import { CurrencyPrecision } from './valuation/CurrencyPrecision';
import { CalculationManifestHelper } from './common/CalculationManifest';
import { INetWorthEngine, NetWorthInputPayload } from './INetWorthEngine';
import {
  NetWorthSnapshot,
  PortfolioSummary,
  AssetAllocation,
  AssetAllocationItem,
  DailyChange,
  UnrealizedGainLoss,
  CurrencyAggregation,
  CurrencyValuationItem,
  HierarchicalBreakdownNode
} from './NetWorthTypes';
import { engineRegistry } from './common/EngineRegistry';

export class NetWorthEngine implements IFinancialEngine<NetWorthInputPayload, NetWorthSnapshot> {
  public readonly metadata: EngineMetadata = {
    id: 'NET_WORTH_ENGINE',
    name: 'Consolidated Net Worth Engine',
    version: '1.0.0',
    supportedAssetTypes: [
      'STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'EPF', 'PPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
    ],
    deterministic: true,
    idempotent: true
  };

  public readonly businessRuleVersion = '2026.1';

  public execute(context: EngineContext<NetWorthInputPayload>): EngineResult<NetWorthSnapshot> {
    const startTime = Date.now();
    const auditTrail: string[] = [];
    const warnings: EngineWarning[] = [];
    const errors: EngineError[] = [];

    auditTrail.push(`[NetWorthEngine v${this.metadata.version} | Rules: ${this.businessRuleVersion}] Execution started at ${new Date().toISOString()}`);
    if (context.correlationId) {
      auditTrail.push(`[Context] Correlation ID: ${context.correlationId}`);
    }

    const payload = context.data;
    if (!payload || !payload.valuationResults) {
      errors.push({
        code: 'MISSING_VALUATION_DATA',
        message: 'NetWorthEngine requires valuationResults in payload context'
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
    const effectiveDate = payload.effectiveDate || asOfDate;
    const fxRates = payload.fxRates || {};

    auditTrail.push(`[Config] Reporting Currency: ${reportingCurrency}, Valuation Date: ${asOfDate}`);

    // 1. Convert currencies and compute total portfolio metrics
    let totalMarketValue = 0;
    let totalCostBasis = 0;
    let totalGain = 0;
    let totalLoss = 0;
    let gainersCount = 0;
    let losersCount = 0;

    const assetTypeMap: Map<string, { marketValue: number; costBasis: number; count: number }> = new Map();
    const nativeCurrencyMap: Map<string, { nativeMarketValue: number; fxRate: number; convertedMarketValue: number }> = new Map();

    const valResults = payload.valuationResults;

    for (let i = 0; i < valResults.length; i++) {
      const val = valResults[i];
      const nativeCurrency = val.currency || 'INR';
      
      // Determine FX conversion rate to reporting currency
      let fxRate = 1.0;
      if (nativeCurrency !== reportingCurrency) {
        const pairKey = `${nativeCurrency}_${reportingCurrency}`;
        if (fxRates[pairKey] !== undefined) {
          fxRate = fxRates[pairKey];
        } else {
          warnings.push({
            code: 'MISSING_FX_RATE',
            message: `FX rate for pair '${pairKey}' missing; defaulting to 1.0`,
            details: { nativeCurrency, reportingCurrency }
          });
        }
      }

      const convertedMarketValue = FinancialMath.roundMoney(val.marketValue * fxRate);
      const convertedCostBasis = FinancialMath.roundMoney(val.costBasis * fxRate);
      const convertedUnrealizedGain = FinancialMath.roundMoney(convertedMarketValue - convertedCostBasis);

      totalMarketValue = FinancialMath.roundMoney(totalMarketValue + convertedMarketValue);
      totalCostBasis = FinancialMath.roundMoney(totalCostBasis + convertedCostBasis);

      if (convertedUnrealizedGain >= 0) {
        totalGain = FinancialMath.roundMoney(totalGain + convertedUnrealizedGain);
        gainersCount++;
      } else {
        totalLoss = FinancialMath.roundMoney(totalLoss + Math.abs(convertedUnrealizedGain));
        losersCount++;
      }

      // Track asset allocation
      const assetType = (val.assetType || 'OTHER').toUpperCase();
      const existingType = assetTypeMap.get(assetType) || { marketValue: 0, costBasis: 0, count: 0 };
      assetTypeMap.set(assetType, {
        marketValue: FinancialMath.roundMoney(existingType.marketValue + convertedMarketValue),
        costBasis: FinancialMath.roundMoney(existingType.costBasis + convertedCostBasis),
        count: existingType.count + 1
      });

      // Track currency aggregation
      const existingCurr = nativeCurrencyMap.get(nativeCurrency) || { nativeMarketValue: 0, fxRate, convertedMarketValue: 0 };
      nativeCurrencyMap.set(nativeCurrency, {
        nativeMarketValue: CurrencyPrecision.roundMoney(existingCurr.nativeMarketValue + val.marketValue),
        fxRate,
        convertedMarketValue: CurrencyPrecision.roundMoney(existingCurr.convertedMarketValue + convertedMarketValue)
      });
    }

    const netUnrealizedGain = FinancialMath.roundMoney(totalMarketValue - totalCostBasis);
    const totalUnrealizedGainPercent = totalCostBasis > 0 ? CurrencyPrecision.roundPercent((netUnrealizedGain / totalCostBasis) * 100) : 0;

    auditTrail.push(`[PortfolioSummary] MarketValue: ${totalMarketValue}, CostBasis: ${totalCostBasis}, Gain: ${netUnrealizedGain} (${totalUnrealizedGainPercent}%)`);

    const summary: PortfolioSummary = {
      totalMarketValue,
      totalCostBasis,
      totalUnrealizedGain: netUnrealizedGain,
      totalUnrealizedGainPercent,
      reportingCurrency
    };

    // 2. Build Asset Allocation breakdown
    const allocationItems: AssetAllocationItem[] = [];
    let maxAllocationVal = -1;
    let dominantAssetType = 'NONE';

    assetTypeMap.forEach((data, assetType) => {
      const percentageOfTotal = totalMarketValue > 0 ? CurrencyPrecision.roundPercent((data.marketValue / totalMarketValue) * 100) : 0;
      allocationItems.push({
        assetType,
        marketValue: data.marketValue,
        costBasis: data.costBasis,
        percentageOfTotal,
        holdingCount: data.count
      });

      if (data.marketValue > maxAllocationVal) {
        maxAllocationVal = data.marketValue;
        dominantAssetType = assetType;
      }
    });

    const assetAllocation: AssetAllocation = {
      breakdown: allocationItems.sort((a, b) => b.marketValue - a.marketValue),
      dominantAssetType
    };

    // 3. Compute Daily Change
    let absoluteChange = 0;
    let percentageChange = 0;
    const prevSnap = payload.previousSnapshot;

    if (prevSnap && prevSnap.summary && prevSnap.summary.totalMarketValue > 0) {
      absoluteChange = FinancialMath.roundMoney(totalMarketValue - prevSnap.summary.totalMarketValue);
      percentageChange = CurrencyPrecision.roundPercent((absoluteChange / prevSnap.summary.totalMarketValue) * 100);
      auditTrail.push(`[DailyChange] PrevMarketValue: ${prevSnap.summary.totalMarketValue}, Change: ${absoluteChange} (${percentageChange}%)`);
    }

    const dailyChange: DailyChange = {
      previousValuationDate: prevSnap?.timeModel.valuationDate,
      previousMarketValue: prevSnap?.summary.totalMarketValue,
      absoluteChange,
      percentageChange
    };

    // 4. Unrealized Gain/Loss Summary
    const unrealizedGainLoss: UnrealizedGainLoss = {
      totalGain,
      totalLoss,
      netUnrealizedGain,
      gainersCount,
      losersCount
    };

    // 5. Currency Aggregation
    const nativeCurrencies: CurrencyValuationItem[] = [];
    nativeCurrencyMap.forEach((data, nativeCurrency) => {
      nativeCurrencies.push({
        nativeCurrency,
        nativeMarketValue: data.nativeMarketValue,
        fxRateToReporting: data.fxRate,
        convertedMarketValue: data.convertedMarketValue
      });
    });

    const currencyAggregation: CurrencyAggregation = {
      reportingCurrency,
      nativeCurrencies
    };

    // 6. Build Hierarchical Breakdown Tree (Family -> Member -> Entity -> Account)
    const hierarchyContext = payload.hierarchyContext;
    const rootTree: HierarchicalBreakdownNode = {
      id: hierarchyContext?.familyId || 1,
      name: hierarchyContext?.familyName || 'Family Portfolio',
      type: 'FAMILY',
      marketValue: totalMarketValue,
      costBasis: totalCostBasis,
      unrealizedGain: netUnrealizedGain,
      percentageOfParent: 100,
      aggregationMethod: 'SUM',
      children: []
    };

    if (hierarchyContext?.members) {
      rootTree.children = hierarchyContext.members.map(member => {
        let memberMV = 0;
        let memberCB = 0;

        const entityNodes: HierarchicalBreakdownNode[] = (member.entities || []).map(entity => {
          let entityMV = 0;
          let entityCB = 0;

          const accountNodes: HierarchicalBreakdownNode[] = (entity.accounts || []).map(account => {
            // Find valuations matching asset IDs in this account and convert to reporting currency
            const accValuations = valResults.filter(v => account.assetIds?.includes(v.assetId || -1));
            
            const accMV = FinancialMath.roundMoney(accValuations.reduce((sum, v) => {
              const nativeCurr = v.currency || 'INR';
              const rate = (nativeCurr !== reportingCurrency && fxRates[`${nativeCurr}_${reportingCurrency}`] !== undefined) ? fxRates[`${nativeCurr}_${reportingCurrency}`] : 1.0;
              return sum + (v.marketValue * rate);
            }, 0));

            const accCB = FinancialMath.roundMoney(accValuations.reduce((sum, v) => {
              const nativeCurr = v.currency || 'INR';
              const rate = (nativeCurr !== reportingCurrency && fxRates[`${nativeCurr}_${reportingCurrency}`] !== undefined) ? fxRates[`${nativeCurr}_${reportingCurrency}`] : 1.0;
              return sum + (v.costBasis * rate);
            }, 0));

            entityMV = FinancialMath.roundMoney(entityMV + accMV);
            entityCB = FinancialMath.roundMoney(entityCB + accCB);

            return {
              id: account.id,
              name: account.name,
              type: 'ACCOUNT',
              marketValue: accMV,
              costBasis: accCB,
              unrealizedGain: FinancialMath.roundMoney(accMV - accCB),
              percentageOfParent: 0, // Computed after entity total is known
              aggregationMethod: 'SUM'
            };
          });

          // Compute percentage of entity for account nodes
          accountNodes.forEach(acc => {
            acc.percentageOfParent = entityMV > 0 ? CurrencyPrecision.roundPercent((acc.marketValue / entityMV) * 100) : 0;
          });

          memberMV = FinancialMath.roundMoney(memberMV + entityMV);
          memberCB = FinancialMath.roundMoney(memberCB + entityCB);

          return {
            id: entity.id,
            name: entity.name,
            type: 'ENTITY',
            marketValue: entityMV,
            costBasis: entityCB,
            unrealizedGain: FinancialMath.roundMoney(entityMV - entityCB),
            percentageOfParent: 0, // Computed after member total is known
            aggregationMethod: 'SUM',
            children: accountNodes
          };
        });

        // Compute percentage of member for entity nodes
        entityNodes.forEach(ent => {
          ent.percentageOfParent = memberMV > 0 ? CurrencyPrecision.roundPercent((ent.marketValue / memberMV) * 100) : 0;
        });

        return {
          id: member.id,
          name: member.name,
          type: 'MEMBER',
          marketValue: memberMV,
          costBasis: memberCB,
          unrealizedGain: FinancialMath.roundMoney(memberMV - memberCB),
          percentageOfParent: totalMarketValue > 0 ? CurrencyPrecision.roundPercent((memberMV / totalMarketValue) * 100) : 0,
          aggregationMethod: 'SUM',
          children: entityNodes
        };
      });
    }

    // 7. Generate Manifest & Lineage
    const snapshotId = `nw_snap_${Date.now()}`;
    const executionTimeMs = Date.now() - startTime;

    const manifest = CalculationManifestHelper.createManifest({
      engine: this.metadata.id,
      engineVersion: this.metadata.version,
      businessRuleVersion: this.businessRuleVersion,
      executionTimeMs,
      processedHoldings: valResults.length,
      processedValuations: valResults.length,
      warningCount: warnings.length,
      payloadToHash: { summary, assetAllocation, dailyChange, reportingCurrency }
    });

    const snapshot: NetWorthSnapshot = {
      snapshotId,
      lineage: {
        snapshotId,
        calculationVersion: manifest.calculationVersion,
        valuationVersion: 'VAL_V1',
        fxVersion: 'FX_V1',
        providerVersions: { YAHOO_FINANCE: '1.0.0', AMFI: '1.0.0' }
      },
      timeModel: {
        effectiveDate,
        valuationDate: asOfDate,
        calculationDate: new Date().toISOString()
      },
      manifest,
      reportingCurrency,
      summary,
      assetAllocation,
      dailyChange,
      unrealizedGainLoss,
      currencyAggregation,
      hierarchy: rootTree,
      processedHoldingsCount: valResults.length
    };

    auditTrail.push(`[Manifest] Checksum: ${manifest.checksum} generated in ${executionTimeMs}ms`);

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
}

export const netWorthEngine = new NetWorthEngine();
engineRegistry.register(netWorthEngine);
