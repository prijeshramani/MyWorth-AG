# 📊 NET_WORTH_DOMAIN_MODEL.md — Net Worth Engine Contracts & Models

**System Name**: Family Wealth OS  
**Phase**: Sprint 3 (Final ARB Review Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Shared Calculation Manifest (`CalculationManifest`)

Reusable metadata envelope generated across all financial engines:

```typescript
export interface CalculationManifest {
  engine: string;                 // e.g. 'NET_WORTH_ENGINE'
  engineVersion: string;          // e.g. '1.0.0'
  businessRuleVersion: string;    // e.g. '2026.1' (ARB Rec #6)
  algorithmVersion: string;       // e.g. 'ALGO_V1_LINEAR'
  calculationVersion: string;     // e.g. 'CALC_V1'
  valuationSnapshotId?: string;   // Lineage ID to Valuation Snapshot (ARB Rec #1, #2)
  fxSnapshotId?: string;          // Lineage ID to FX Rate Snapshot
  executionTimeMs: number;
  processedHoldings: number;
  processedValuations: number;
  warningCount: number;
  checksum: string;               // SHA-256 calculation hash for reproducibility
}
```

---

## 2. Engine Contract Interface (`INetWorthEngine`)

```typescript
import { IFinancialEngine } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult } from './common/EngineResult';
import { ValuationResult } from './valuation/ValuationResult';

export interface FXRateMap {
  [currencyPair: string]: number; // e.g. 'USD_INR': 83.50, 'INR_INR': 1.0
}

export interface NetWorthInputPayload {
  valuationResults: ValuationResult[];
  fxRates: FXRateMap;
  reportingCurrency?: string; // Default 'INR'
  asOfDate: string;           // YYYY-MM-DD
  effectiveDate?: string;     // ARB Rec #4: Future Time Model
  previousSnapshot?: NetWorthSnapshot | null;
}

export interface INetWorthEngine extends IFinancialEngine<NetWorthInputPayload, NetWorthSnapshot> {
  // Inherits metadata and execute(context) method
}
```

---

## 3. Core Net Worth Domain Models

### A. Snapshot Lineage & Versioning (ARB Rec #2, #3)
```typescript
export interface SnapshotLineage {
  snapshotId: string;
  calculationVersion: string;
  valuationVersion: string;
  fxVersion: string;
  providerVersions: Record<string, string>; // Provider ID -> Version
}

export interface TimeModel {
  effectiveDate: string;   // Economic effective date
  valuationDate: string;   // Target price valuation date
  calculationDate: string; // Execution timestamp
}
```

### B. `HierarchicalBreakdownNode` (ARB Rec #7)
```typescript
export type AggregationMethod = 'SUM' | 'WEIGHTED' | 'AVERAGE';

export interface HierarchicalBreakdownNode {
  id: number;
  name: string;
  type: 'FAMILY' | 'MEMBER' | 'ENTITY' | 'ACCOUNT';
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  percentageOfParent: number;
  aggregationMethod: AggregationMethod; // ARB Rec #7
  children?: HierarchicalBreakdownNode[];
}
```

### C. Future Portfolio Health Extensions (Documentation Only - ARB Rec #5)
```typescript
export interface PortfolioHealthExtensions {
  diversificationScore?: number; // 0-100 score
  concentrationRisk?: {
    topAssetConcentrationPercent: number;
    topSectorConcentrationPercent: number;
  };
  currencyExposure?: Record<string, number>; // Currency -> Percent
  liquidityScore?: {
    liquidPercent: number;
    semiLiquidPercent: number;
    illiquidPercent: number;
  };
}
```

### D. Consolidated `NetWorthSnapshot`
```typescript
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
  healthExtensions?: PortfolioHealthExtensions; // Optional future extension
  processedHoldingsCount: number;
}
```
