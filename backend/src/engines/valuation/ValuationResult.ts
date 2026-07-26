export interface ValuationResult {
  success: boolean;
  assetId?: number;
  assetType: string;
  quantity: number;
  unitPrice: number;
  priceDate?: string;
  valuationDate: string;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  currency: string;
  valuationMethod: string;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'STALE';
  priceSource: string;
  warnings: string[];
  errors: string[];
  auditTrail: string[];
  engineVersion: string;
}
