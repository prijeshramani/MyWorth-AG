export interface AssetPrice {
  asset_id: number;
  date: string;
  price: number;
  created_at?: string;
}

export interface IPriceRepository {
  findLatestPrice(assetId: number): AssetPrice | null;
  findLatestPriceAbove(assetId: number, minPrice: number): AssetPrice | null;
  findPricesForAsset(assetId: number): AssetPrice[];
  findAllPrices(): AssetPrice[];
  upsertPrice(assetId: number, date: string, price: number): void;
}
