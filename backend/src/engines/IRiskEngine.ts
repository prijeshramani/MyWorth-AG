import { IFinancialEngine } from './common/IFinancialEngine';
import { PortfolioTimePoint, BenchmarkReturnPoint, RiskSnapshot } from './RiskTypes';

export interface RiskInputPayload {
  portfolioTimeSeries: PortfolioTimePoint[];
  benchmarkTimeSeries?: Record<string, BenchmarkReturnPoint[]>;
  riskFreeRatePercent?: number; // Default 6.50% (India 10Y Sovereign Repo Rate)
  reportingCurrency?: string;   // Default 'INR'
  asOfDate: string;             // YYYY-MM-DD
}

export interface IRiskEngine extends IFinancialEngine<RiskInputPayload, RiskSnapshot> {}
