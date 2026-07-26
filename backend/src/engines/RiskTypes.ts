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

export type RiskClassification = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'SYSTEMIC' | 'IDIOSYNCRATIC';

export interface RiskSummary {
  annualizedVolatilityPercent: number; // RISK-003
  downsideDeviationPercent: number;
  maxDrawdownPercent: number;          // RISK-004
  maxDrawdownDurationDays: number;
  sharpeRatio: number;                 // RISK-001
  sortinoRatio: number;                // RISK-002
  riskFreeRateUsed: number;
  riskRating: RiskClassification;
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
