import { IFinancialEngine } from './common/IFinancialEngine';
import { CashFlowEvent, PerformanceSnapshot } from './PerformanceTypes';
import { ValuationResult } from './valuation/ValuationResult';

export interface FXRateMap {
  [currencyPair: string]: number; // e.g. 'USD_INR': 83.50
}

export interface PerformanceInputPayload {
  cashFlows: CashFlowEvent[];
  initialValuation?: ValuationResult | null;
  currentValuation: ValuationResult;
  fxRates?: FXRateMap;
  reportingCurrency?: string; // Default 'INR'
  asOfDate: string;           // YYYY-MM-DD
  startDate?: string;         // YYYY-MM-DD
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
          holdings?: Array<{
            id: number;
            name: string;
            cashFlows: CashFlowEvent[];
            currentValuation: ValuationResult;
          }>;
        }>;
      }>;
    }>;
  };
}

export interface IPerformanceEngine extends IFinancialEngine<PerformanceInputPayload, PerformanceSnapshot> {}
