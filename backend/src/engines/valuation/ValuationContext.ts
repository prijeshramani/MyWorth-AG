import { PriceSnapshot } from './PriceSnapshot';

export interface AssetMetadata {
  exchange?: string;
  isin?: string;
  amfiCode?: string;
  npsScheme?: string;
  interestRate?: number; // annual percentage e.g. 7.25
  compoundingFrequency?: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  maturityDate?: string;
  startDate?: string;
  areaSqFt?: number;
  pricePerSqFt?: number;
  lastAppraisedValue?: number;
  [key: string]: any;
}

export interface ValuationContext {
  assetId?: number;
  assetType: string;
  quantity: number;
  costBasis: number;
  priceSnapshot?: PriceSnapshot | null;
  valuationDate: string; // YYYY-MM-DD
  currency?: string;
  metadata?: AssetMetadata | null;
  options?: Record<string, any>;
}
