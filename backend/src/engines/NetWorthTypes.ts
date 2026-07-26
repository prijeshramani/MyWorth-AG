import { CalculationManifest } from './common/CalculationManifest';

export interface SnapshotLineage {
  snapshotId: string;
  calculationVersion: string;
  valuationVersion: string;
  fxVersion: string;
  providerVersions: Record<string, string>;
}

export interface TimeModel {
  effectiveDate: string;   // Economic effective date (YYYY-MM-DD)
  valuationDate: string;   // Price valuation date (YYYY-MM-DD)
  calculationDate: string; // Timestamp when calculation was run (ISO)
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedGain: number;
  totalUnrealizedGainPercent: number;
  reportingCurrency: string;
}

export interface AssetAllocationItem {
  assetType: string;
  marketValue: number;
  costBasis: number;
  percentageOfTotal: number;
  holdingCount: number;
}

export interface AssetAllocation {
  breakdown: AssetAllocationItem[];
  dominantAssetType: string;
}

export interface DailyChange {
  previousValuationDate?: string;
  previousMarketValue?: number;
  absoluteChange: number;
  percentageChange: number;
}

export interface UnrealizedGainLoss {
  totalGain: number;
  totalLoss: number;
  netUnrealizedGain: number;
  gainersCount: number;
  losersCount: number;
}

export interface CurrencyValuationItem {
  nativeCurrency: string;
  nativeMarketValue: number;
  fxRateToReporting: number;
  convertedMarketValue: number;
}

export interface CurrencyAggregation {
  reportingCurrency: string;
  nativeCurrencies: CurrencyValuationItem[];
}

export type AggregationMethod = 'SUM' | 'WEIGHTED' | 'AVERAGE';

export interface HierarchicalBreakdownNode {
  id: number;
  name: string;
  type: 'FAMILY' | 'MEMBER' | 'ENTITY' | 'ACCOUNT';
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  percentageOfParent: number;
  aggregationMethod: AggregationMethod;
  children?: HierarchicalBreakdownNode[];
}

export interface PortfolioHealthExtensions {
  diversificationScore?: number;
  concentrationRisk?: {
    topAssetConcentrationPercent: number;
    topSectorConcentrationPercent: number;
  };
  currencyExposure?: Record<string, number>;
  liquidityScore?: {
    liquidPercent: number;
    semiLiquidPercent: number;
    illiquidPercent: number;
  };
}

export interface NetWorthSnapshot {
  snapshotId: string;
  lineage: SnapshotLineage;
  timeModel: TimeModel;
  manifest: CalculationManifest;
  reportingCurrency: string;
  summary: PortfolioSummary;
  assetAllocation: AssetAllocation;
  dailyChange: DailyChange;
  unrealizedGainLoss: UnrealizedGainLoss;
  currencyAggregation: CurrencyAggregation;
  hierarchy: HierarchicalBreakdownNode;
  healthExtensions?: PortfolioHealthExtensions;
  processedHoldingsCount: number;
}
