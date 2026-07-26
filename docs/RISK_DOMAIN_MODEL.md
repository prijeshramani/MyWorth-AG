# 📊 RISK_DOMAIN_MODEL.md — Risk Engine Contracts & Models

**System Name**: Family Wealth OS  
**Phase**: Sprint 5B (Risk Intelligence Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Engine Contract Interface (`IRiskEngine`)

```typescript
import { IFinancialEngine } from './common/IFinancialEngine';
import { EngineContext } from './common/EngineContext';
import { EngineResult } from './common/EngineResult';
import { CalculationManifest } from './common/CalculationManifest';

export interface BenchmarkReturnPoint {
  date: string;           // YYYY-MM-DD
  indexValue: number;
  returnPercent: number;
}

export interface PortfolioTimePoint {
  date: string;           // YYYY-MM-DD
  portfolioValue: number;
  returnPercent: number;
}

export interface RiskInputPayload {
  portfolioTimeSeries: PortfolioTimePoint[];
  benchmarkTimeSeries?: Record<string, BenchmarkReturnPoint[]>;
  riskFreeRatePercent?: number; // Default 6.5% (India 10Y Repo Rate)
  reportingCurrency?: string;   // Default 'INR'
  asOfDate: string;             // YYYY-MM-DD
}

export interface IRiskEngine extends IFinancialEngine<RiskInputPayload, RiskSnapshot> {
  // Inherits metadata and execute(context) method
}
```

---

## 2. Core Risk Domain Models

### A. `RiskSummary`
```typescript
export interface RiskSummary {
  annualizedVolatilityPercent: number; // RISK-003
  downsideDeviationPercent: number;
  maxDrawdownPercent: number;          // RISK-004
  maxDrawdownDurationDays: number;
  sharpeRatio: number;                 // RISK-001
  sortinoRatio: number;                // RISK-002
  riskFreeRateUsed: number;
  riskRating: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
}
```

### B. `BenchmarkComparison`
```typescript
export interface BenchmarkComparisonItem {
  benchmarkSymbol: string;             // e.g. 'NIFTY_50', 'S_AND_P_500'
  benchmarkName: string;               // e.g. 'Nifty 50 Index'
  benchmarkReturnPercent: number;
  portfolioExcessReturnPercent: number;
  beta: number;                        // RISK-005
  correlation: number;                 // RISK-006
  trackingErrorPercent: number;        // RISK-007
  alphaPercent: number;
}

export interface BenchmarkComparison {
  primaryBenchmark: BenchmarkComparisonItem;
  benchmarks: BenchmarkComparisonItem[];
}
```

### C. `RiskRecommendation`
```typescript
export interface RiskRecommendation {
  id: string;
  category: 'VOLATILITY' | 'DRAWDOWN' | 'CONCENTRATION' | 'BENCHMARK_LAG';
  title: string;
  finding: string;
  recommendation: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### D. Future Advanced Risk Extensions (Documentation Only)
```typescript
export interface FutureAdvancedRiskExtensions {
  stressTesting?: {
    scenarioName: string; // e.g. '2008 Financial Crisis', '2020 COVID Crash'
    simulatedLossPercent: number;
  }[];
  monteCarloSimulation?: {
    numSimulations: 10000;
    expectedReturn5Yr: number;
    worstCase5Yr95Percentile: number;
    bestCase5Yr95Percentile: number;
  };
  valueAtRisk?: {
    var95Percent1Day: number;
    var99Percent1Day: number;
    conditionalVar95Percent: number; // CVaR / Expected Shortfall
  };
}
```

### E. Consolidated `RiskSnapshot`
```typescript
export interface RiskSnapshot {
  snapshotId: string;
  asOfDate: string;
  reportingCurrency: string;
  manifest: CalculationManifest;
  summary: RiskSummary;
  benchmarkComparison?: BenchmarkComparison;
  recommendations: RiskRecommendation[];
  advancedExtensions?: FutureAdvancedRiskExtensions;
}
```
