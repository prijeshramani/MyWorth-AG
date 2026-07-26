import { CalculationManifest } from './common/CalculationManifest';

export interface AssetMetadataMap {
  [assetId: number]: {
    sector?: string;       // e.g. 'Technology', 'Financial Services'
    market?: string;       // e.g. 'IN_NSE', 'US_NASDAQ'
    country?: string;      // e.g. 'India', 'United States'
    isLiquid?: boolean;    // e.g. Cash, Bank, Liquid MF
  };
}

export interface AllocationItem {
  key: string;
  marketValue: number;
  percentageOfTotal: number;
  holdingCount: number;
}

export interface MultiDimensionalAllocations {
  assetAllocation: AllocationItem[];
  sectorAllocation: AllocationItem[];
  marketAllocation: AllocationItem[];
  currencyAllocation: AllocationItem[];
  geographicAllocation: AllocationItem[];
}

export interface DiversificationScore {
  score: number;             // 0 to 100
  hhiIndex: number;          // Herfindahl-Hirschman Index (0.0 to 1.0)
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'HIGHLY_CONCENTRATED';
}

export interface ConcentrationScore {
  top1AssetConcentrationPercent: number;
  top3AssetConcentrationPercent: number;
  top5AssetConcentrationPercent: number;
  topSectorConcentrationPercent: number;
  isConcentrationWarningTriggered: boolean;
}

export interface CashAllocation {
  liquidCashMarketValue: number;
  investedAssetsMarketValue: number;
  cashPercentage: number;
  recommendedCashRange: { minPercent: 5; maxPercent: 20 };
  status: 'OPTIMAL' | 'LOW_LIQUIDITY' | 'EXCESS_CASH';
}

export interface PortfolioHealth {
  healthScore: number;       // 0 to 100 overall score
  rating: 'HEALTHY' | 'MODERATE_RISK' | 'HIGH_RISK';
  diversification: DiversificationScore;
  concentration: ConcentrationScore;
  cashLiquidity: CashAllocation;
  warnings: string[];
}

export interface PortfolioAnalyticsSnapshot {
  snapshotId: string;
  asOfDate: string;
  reportingCurrency: string;
  manifest: CalculationManifest;
  allocations: MultiDimensionalAllocations;
  health: PortfolioHealth;
  growthSummary?: {
    totalMarketValue: number;
    totalCostBasis: number;
    totalUnrealizedGain: number;
  };
}
