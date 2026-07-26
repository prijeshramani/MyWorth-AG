# 📊 PORTFOLIO_ANALYTICS_DOMAIN_MODEL.md — Domain Models & Contracts

**System Name**: Family Wealth OS  
**Phase**: Sprint 5A (Portfolio Analytics Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Engine Contract Interface (`IAnalyticsEngine`)

```typescript
import { IFinancialEngine } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult } from './common/EngineResult';
import { ValuationResult } from './valuation/ValuationResult';
import { NetWorthSnapshot } from './NetWorthTypes';
import { PerformanceSnapshot } from './PerformanceTypes';
import { CalculationManifest } from './common/CalculationManifest';

export interface AssetMetadataMap {
  [assetId: number]: {
    sector?: string;       // e.g. 'Technology', 'Financial Services'
    market?: string;       // e.g. 'IN_NSE', 'US_NASDAQ'
    country?: string;      // e.g. 'India', 'United States'
    isLiquid?: boolean;    // e.g. Cash, Bank, Liquid MF
  };
}

export interface PortfolioAnalyticsInputPayload {
  valuationResults: ValuationResult[];
  netWorthSnapshot?: NetWorthSnapshot;
  performanceSnapshot?: PerformanceSnapshot;
  assetMetadata: AssetMetadataMap;
  reportingCurrency?: string; // Default 'INR'
  asOfDate: string;           // YYYY-MM-DD
}

export interface IAnalyticsEngine extends IFinancialEngine<PortfolioAnalyticsInputPayload, PortfolioAnalyticsSnapshot> {
  // Inherits metadata and execute(context) method
}
```

---

## 2. Core Analytics Domain Models

### A. Allocation Models
```typescript
export interface AllocationItem {
  key: string;               // Category name (e.g. 'Technology', 'USD', 'India')
  marketValue: number;       // Converted market value in reporting currency
  percentageOfTotal: number; // e.g. 35.5%
  holdingCount: number;
}

export interface MultiDimensionalAllocations {
  assetAllocation: AllocationItem[];
  sectorAllocation: AllocationItem[];
  marketAllocation: AllocationItem[];
  currencyAllocation: AllocationItem[];
  geographicAllocation: AllocationItem[];
}
```

### B. Health & Risk Scores
```typescript
export interface DiversificationScore {
  score: number;             // 0 to 100 (100 = highly diversified, 0 = concentrated)
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
```

### C. Future Risk Metrics Extensions (Documentation Only)
```typescript
export interface FutureRiskMetricsExtensions {
  sharpeRatio?: number;
  sortinoRatio?: number;
  beta?: number;
  correlationMatrix?: Record<string, Record<string, number>>;
  annualizedVolatility?: number;
  maxDrawdownPercent?: number;
}
```

### D. Consolidated `PortfolioAnalyticsSnapshot`
```typescript
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
  futureRiskMetrics?: FutureRiskMetricsExtensions;
}
```
