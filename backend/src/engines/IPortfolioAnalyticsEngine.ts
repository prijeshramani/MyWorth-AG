import { IFinancialEngine } from './common/IFinancialEngine';
import { ValuationResult } from './valuation/ValuationResult';
import { AssetMetadataMap, PortfolioAnalyticsSnapshot } from './PortfolioAnalyticsTypes';
import { NetWorthSnapshot } from './NetWorthTypes';
import { PerformanceSnapshot } from './PerformanceTypes';

export interface FXRateMap {
  [currencyPair: string]: number; // e.g. 'USD_INR': 83.50
}

export interface PortfolioAnalyticsInputPayload {
  valuationResults: ValuationResult[];
  netWorthSnapshot?: NetWorthSnapshot;
  performanceSnapshot?: PerformanceSnapshot;
  assetMetadata?: AssetMetadataMap;
  fxRates?: FXRateMap;
  reportingCurrency?: string; // Default 'INR'
  asOfDate: string;           // YYYY-MM-DD
}

export interface IPortfolioAnalyticsEngine extends IFinancialEngine<PortfolioAnalyticsInputPayload, PortfolioAnalyticsSnapshot> {}
