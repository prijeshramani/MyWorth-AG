import { CalculationManifest } from './common/CalculationManifest';

export type CashFlowEventType = 
  | 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL'
  | 'INTEREST' | 'FEE' | 'TAX' | 'BONUS' | 'SPLIT' | 'MERGER' | 'RIGHTS';

export interface CashFlowEvent {
  date: string;       // YYYY-MM-DD
  amount: number;     // Negative for investment inflows, positive for distributions/withdrawals
  type: CashFlowEventType;
  currency?: string;  // Default 'INR'
}

export type PerformanceQuality = 'EXACT' | 'ESTIMATED' | 'DEGRADED' | 'INSUFFICIENT_DATA';

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
