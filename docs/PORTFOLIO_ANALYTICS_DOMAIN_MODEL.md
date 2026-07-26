# 📊 PORTFOLIO_ANALYTICS_DOMAIN_MODEL.md — Domain Models & Contracts

**System Name**: Family Wealth OS  
**Phase**: Sprint 5A (Final ARB Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Analytics Registry & Formula Mapping

- **ANL-001**: Asset Allocation
- **ANL-002**: Sector Allocation
- **ANL-003**: Diversification (HHI)
- **ANL-004**: Portfolio Health
- **ANL-005**: Cash Allocation

---

## 2. Future Strategy & Context Abstractions (Documentation Only)

### A. Exposure Engine Abstraction (`ExposureModel`)
```typescript
export interface ExposureModel {
  marketExposure: Record<string, number>;
  currencyExposure: Record<string, number>;
  countryExposure: Record<string, number>;
  sectorExposure: Record<string, number>;
  assetClassExposure: Record<string, number>;
  issuerExposure: Record<string, number>;
}
```

### B. Explainable Portfolio Health Decomposition
```typescript
export interface ExplainableHealthDecomposition {
  diversificationScore: number;
  liquidityScore: number;
  concentrationScore: number;
  cashScore: number;
  currencyScore: number;
  overallHealthScore: number;
}
```

### C. Portfolio Policy Model (`PortfolioPolicy`)
```typescript
export interface PortfolioPolicy {
  minCashPercent: number;
  maxSingleHoldingPercent: number;
  maxSectorPercent: number;
  targetAssetAllocation: Record<string, number>;
  targetGeography: Record<string, number>;
  targetCurrency: Record<string, number>;
}
```

### D. Recommendation Model (`PortfolioRecommendation`)
```typescript
export interface PortfolioRecommendation {
  finding: string;
  recommendation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string;
}
```

---

## 3. Core Portfolio Analytics Contracts

```typescript
import { IFinancialEngine } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult } from './common/EngineResult';
import { ValuationResult } from './valuation/ValuationResult';
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
  key: string;               // Category name
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

export interface DiversificationScore {
  score: number;             // 0 to 100
  hhiIndex: number;          // Herfindahl-Hirschman Index
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
```
