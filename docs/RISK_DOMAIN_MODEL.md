# 📊 RISK_DOMAIN_MODEL.md — Risk Engine Contracts & Models

**System Name**: Family Wealth OS  
**Phase**: Sprint 5B (Final ARB Integration)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Risk Metric Taxonomy & Rule Registry

- **RISK-001**: Sharpe Ratio ($\frac{R_p - R_f}{\sigma_p}$)
- **RISK-002**: Sortino Ratio ($\frac{R_p - R_f}{\sigma_d}$)
- **RISK-003**: Annualized Volatility ($\sigma_p \cdot \sqrt{252}$)
- **RISK-004**: Maximum Drawdown ($\frac{\text{Peak} - \text{Trough}}{\text{Peak}}$)
- **RISK-005**: Portfolio Beta ($\frac{\text{Cov}(R_p, R_m)}{\text{Var}(R_m)}$)
- **RISK-006**: Benchmark Correlation ($\rho_{p, m}$)
- **RISK-007**: Tracking Error ($\sigma(R_p - R_m)$)

---

## 2. Future Strategy & Context Abstractions (Documentation Only)

### A. Extended Risk Classification Registry
- `LOW`: Minimal volatility, capital preservation focus.
- `MODERATE`: Balanced risk-return profile.
- `HIGH`: Growth focus with elevated volatility.
- `EXTREME`: High concentration or speculative assets.
- `SYSTEMIC`: Market-wide broad market risk.
- `IDIOSYNCRATIC`: Single-asset or issuer specific risk.

### B. Risk Source Attribution Model
```typescript
export interface RiskSourceAttribution {
  overallRisk: number;
  marketRiskContribution: number;
  sectorRiskContribution: number;
  issuerRiskContribution: number;
  currencyRiskContribution: number;
  liquidityRiskContribution: number;
}
```

### C. Reusable Scenario Registry (`ScenarioRegistry`)
- `2008 Financial Crisis`: -45% equity shock, credit spread widening.
- `COVID Crash`: -33% rapid equity drawdown, liquidity freeze.
- `Dot-com Crash`: -75% tech sector drawdown.
- `Interest Rate Shock`: +200 bps rate increase (bond price decline).
- `Oil Crisis`: Energy price surge & stagflation.

### D. Centralized Benchmark Registry Architecture (`BenchmarkRegistry`)
```typescript
export interface CentralizedBenchmarkRegistry {
  benchmarks: Record<string, {
    id: string;
    name: string;
    currency: string;
    market: string;
    ticker: string;
  }>;
}
```

---

## 3. Core Risk Engine Contracts

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

export interface RiskSummary {
  annualizedVolatilityPercent: number; // RISK-003
  downsideDeviationPercent: number;
  maxDrawdownPercent: number;          // RISK-004
  maxDrawdownDurationDays: number;
  sharpeRatio: number;                 // RISK-001
  sortinoRatio: number;                // RISK-002
  riskFreeRateUsed: number;
  riskRating: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'SYSTEMIC' | 'IDIOSYNCRATIC';
}

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

export interface RiskRecommendation {
  id: string;
  category: 'VOLATILITY' | 'DRAWDOWN' | 'CONCENTRATION' | 'BENCHMARK_LAG';
  title: string;
  finding: string;
  recommendation: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RiskSnapshot {
  snapshotId: string;
  asOfDate: string;
  reportingCurrency: string;
  manifest: CalculationManifest;
  summary: RiskSummary;
  benchmarkComparison?: BenchmarkComparison;
  recommendations: RiskRecommendation[];
}
```
