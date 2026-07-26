import { IFinancialEngine } from './common/IFinancialEngine';
import { ValuationResult } from './valuation/ValuationResult';
import { NetWorthSnapshot } from './NetWorthTypes';

export interface FXRateMap {
  [currencyPair: string]: number; // e.g. 'USD_INR': 83.50, 'INR_INR': 1.0
}

export interface NetWorthInputPayload {
  valuationResults: ValuationResult[];
  fxRates: FXRateMap;
  reportingCurrency?: string; // Default 'INR'
  asOfDate: string;           // YYYY-MM-DD
  effectiveDate?: string;     // YYYY-MM-DD
  previousSnapshot?: NetWorthSnapshot | null;
  hierarchyContext?: {
    familyId?: number;
    familyName?: string;
    members?: Array<{
      id: number;
      name: string;
      entities?: Array<{
        id: number;
        name: string;
        accounts?: Array<{
          id: number;
          name: string;
          assetIds?: number[];
        }>;
      }>;
    }>;
  };
}

export interface INetWorthEngine extends IFinancialEngine<NetWorthInputPayload, NetWorthSnapshot> {}
