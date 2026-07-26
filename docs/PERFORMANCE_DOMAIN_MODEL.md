# 📊 PERFORMANCE_DOMAIN_MODEL.md — Performance Engine Contracts & Models

**System Name**: Family Wealth OS  
**Phase**: Sprint 4 (Final ARB Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Extended Financial Event Taxonomy

The Performance Engine accepts transaction events categorized under the unified financial event taxonomy:

- **Capital Flows**: `BUY`, `SELL`, `DEPOSIT`, `WITHDRAWAL`
- **Income Events**: `DIVIDEND`, `INTEREST`
- **Expense Events**: `FEE`, `TAX`
- **Corporate Actions**: `BONUS`, `SPLIT`, `MERGER`, `RIGHTS`

---

## 2. Performance Quality Classification (`PerformanceQuality`)

```typescript
export type PerformanceQuality = 'EXACT' | 'ESTIMATED' | 'DEGRADED' | 'INSUFFICIENT_DATA';

export interface PerformanceQualityMetadata {
  quality: PerformanceQuality;
  reasons?: string[];
}
```

---

## 3. Future Strategy & Context Abstractions (Documentation Only)

### A. Root Solver Strategy Hierarchy (`IRootSolver`)
```typescript
export interface IRootSolver {
  solve(cashFlows: Array<{ days: number; amount: number }>, initialGuess?: number): {
    rate: number;
    iterations: number;
    converged: boolean;
  };
}
```

### B. Benchmark Comparison Model (`PerformanceBenchmark`)
```typescript
export interface PerformanceBenchmark {
  benchmarkId: string;
  benchmarkName: string;
  symbol: string;
  cagrPercent: number;
  alpha: number;
  beta: number;
}
```

---

## 4. Performance Engine Contracts

```typescript
import { IFinancialEngine } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult } from './common/EngineResult';
import { CalculationManifest } from './common/CalculationManifest';

export type CashFlowEventType = 
  | 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL'
  | 'INTEREST' | 'FEE' | 'TAX' | 'BONUS' | 'SPLIT' | 'MERGER' | 'RIGHTS';

export interface CashFlowEvent {
  date: string;       // YYYY-MM-DD
  amount: number;     // Negative for inflows (investment), positive for outflows (distribution/div)
  type: CashFlowEventType;
  currency?: string;  // Default 'INR'
}

export interface PerformanceSummary {
  beginningValue: number;
  endingValue: number;
  totalNetInflows: number;
  realizedGainLoss: number;
  unrealizedGainLoss: number;
  totalGainLoss: number;
  absoluteReturnPercent: number; // PERF-001
  cagrPercent: number;           // PERF-002
  xirrPercent: number;           // PERF-003
  twrPercent: number;            // PERF-004
  mwrPercent: number;            // PERF-005
  holdingPeriodDays: number;
  reportingCurrency: string;
}

export interface HierarchicalPerformanceNode {
  id: number;
  name: string;
  type: 'FAMILY' | 'MEMBER' | 'ENTITY' | 'ACCOUNT' | 'HOLDING';
  summary: PerformanceSummary;
  children?: HierarchicalPerformanceNode[];
}

export interface PerformanceSnapshot {
  snapshotId: string;
  timeModel: {
    startDate: string;
    endDate: string;
    holdingPeriodDays: number;
  };
  manifest: CalculationManifest;
  reportingCurrency: string;
  summary: PerformanceSummary;
  hierarchy: HierarchicalPerformanceNode;
  quality: PerformanceQuality;
}
```
