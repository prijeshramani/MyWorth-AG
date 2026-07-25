import { db } from '../db';
import { AssetPrice, IPriceRepository } from './IPriceRepository';

export class SQLitePriceRepository implements IPriceRepository {
  public findLatestPrice(assetId: number): AssetPrice | null {
    const row = db.prepare(`
      SELECT asset_id, date, price FROM asset_prices 
      WHERE asset_id = ? 
      ORDER BY date DESC LIMIT 1
    `).get(assetId) as AssetPrice | undefined;
    
    return row || null;
  }

  public findLatestPriceAbove(assetId: number, minPrice: number): AssetPrice | null {
    const row = db.prepare(`
      SELECT asset_id, date, price FROM asset_prices 
      WHERE asset_id = ? AND price > ?
      ORDER BY date DESC LIMIT 1
    `).get(assetId, minPrice) as AssetPrice | undefined;
    
    return row || null;
  }

  public findPricesForAsset(assetId: number): AssetPrice[] {
    return db.prepare(`
      SELECT date, price FROM asset_prices
      WHERE asset_id = ?
      ORDER BY date ASC
    `).all(assetId) as AssetPrice[];
  }

  public findAllPrices(): AssetPrice[] {
    return db.prepare(`
      SELECT asset_id, date, price FROM asset_prices
      ORDER BY date ASC
    `).all() as AssetPrice[];
  }

  public upsertPrice(assetId: number, date: string, price: number): void {
    db.prepare(`
      INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
      VALUES (?, ?, ?)
    `).run(assetId, date, price);
  }
}

export const priceRepository = new SQLitePriceRepository();
