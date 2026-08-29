export interface AssetPrice {
  asset_id: number;
  date: string;
  price: number;
  created_at?: string;
}

export interface HistoricalPriceResult {
  requestedAsOfDate: string;
  resolvedValuationDate: string;
  amount: number;
  valuationType: 'MARKET_VALUE' | 'NAV' | 'ACQUISITION_COST' | 'ACCRUED_VALUE' | 'LEDGER_BALANCE' | 'UNKNOWN';
  provenance: 'EXACT_HISTORICAL' | 'PRIOR_DATE_PROXY' | 'KNOWN_ACQUISITION_COST' | 'CALCULATED' | 'HISTORICAL_SOURCE_UNAVAILABLE';
  daysOfProxyLag: number;
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'HISTORICAL_SOURCE_UNAVAILABLE';
  missingDataReason?: string;
  ruleCode: string;
  ruleVersion: string;
}

export interface IPriceRepository {
  findLatestPrice(assetId: number): AssetPrice | null;
  findLatestPriceAbove(assetId: number, minPrice: number): AssetPrice | null;
  findPricesForAsset(assetId: number): AssetPrice[];
  findAllPrices(): AssetPrice[];
  upsertPrice(assetId: number, date: string, price: number): void;
  findPriceAsOf(familyId: number, assetId: number, asOfDate: string, assetCategory: string, maxAgeDays?: number): HistoricalPriceResult | null;
  findBatchPricesAsOf(familyId: number, asOfDate: string): Map<number, AssetPrice>;
}
