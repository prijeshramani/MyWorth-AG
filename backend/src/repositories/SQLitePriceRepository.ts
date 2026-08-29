import { db } from '../db';
import { AssetPrice, HistoricalPriceResult, IPriceRepository } from './IPriceRepository';

export const TIME_MACHINE_RULE_REGISTRY = {
  version: '2026.1',
  effectiveDate: '2026-01-01',
  jurisdiction: 'IN',
  sourceReference: 'FamilyWealthOS Fiduciary Valuation Standard',
  MAX_PROXY_AGE_DAYS: {
    Equity: { ruleCode: 'RULE_PROXY_EQUITY_30D', maxAgeDays: 30 },
    Hybrid: { ruleCode: 'RULE_PROXY_HYBRID_30D', maxAgeDays: 30 },
    Debt: { ruleCode: 'RULE_PROXY_DEBT_60D', maxAgeDays: 60 },
    Alternative: { ruleCode: 'RULE_PROXY_ALT_60D', maxAgeDays: 60 }, // Gold / Precious Metals
    RealEstate: { ruleCode: 'RULE_PROXY_PROPERTY_365D', maxAgeDays: 365 },
    Cash: { ruleCode: 'RULE_PROXY_CASH_90D', maxAgeDays: 90 },
    Other: { ruleCode: 'RULE_PROXY_DEFAULT_30D', maxAgeDays: 30 }
  }
};

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

  public findPriceAsOf(
    familyId: number,
    assetId: number,
    asOfDate: string,
    assetCategory: string,
    maxAgeDays?: number
  ): HistoricalPriceResult | null {
    // 1. Search for latest price on or before asOfDate with family ownership check
    const row = db.prepare(`
      SELECT ap.asset_id, ap.date, ap.price
      FROM asset_prices ap
      JOIN assets a ON a.id = ap.asset_id
      JOIN family_members fm ON fm.id = a.family_member_id
      WHERE fm.family_id = ? AND ap.asset_id = ? AND ap.date <= ?
      ORDER BY ap.date DESC
      LIMIT 1
    `).get(familyId, assetId, asOfDate) as AssetPrice | undefined;

    const catKey = (assetCategory || 'Other') as keyof typeof TIME_MACHINE_RULE_REGISTRY.MAX_PROXY_AGE_DAYS;
    const ruleConfig = TIME_MACHINE_RULE_REGISTRY.MAX_PROXY_AGE_DAYS[catKey] || TIME_MACHINE_RULE_REGISTRY.MAX_PROXY_AGE_DAYS.Other;
    const allowedMaxDays = maxAgeDays !== undefined ? maxAgeDays : ruleConfig.maxAgeDays;

    if (!row) {
      return null;
    }

    const asOfMs = new Date(asOfDate).getTime();
    const priceMs = new Date(row.date).getTime();
    const diffDays = Math.max(0, Math.floor((asOfMs - priceMs) / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) {
      return {
        requestedAsOfDate: asOfDate,
        resolvedValuationDate: row.date,
        amount: row.price,
        valuationType: 'MARKET_VALUE',
        provenance: 'EXACT_HISTORICAL',
        daysOfProxyLag: 0,
        status: 'COMPLETE',
        ruleCode: ruleConfig.ruleCode,
        ruleVersion: TIME_MACHINE_RULE_REGISTRY.version
      };
    }

    if (diffDays <= allowedMaxDays) {
      return {
        requestedAsOfDate: asOfDate,
        resolvedValuationDate: row.date,
        amount: row.price,
        valuationType: 'MARKET_VALUE',
        provenance: 'PRIOR_DATE_PROXY',
        daysOfProxyLag: diffDays,
        status: 'COMPLETE',
        ruleCode: ruleConfig.ruleCode,
        ruleVersion: TIME_MACHINE_RULE_REGISTRY.version
      };
    }

    // Proxy expired
    return {
      requestedAsOfDate: asOfDate,
      resolvedValuationDate: row.date,
      amount: row.price,
      valuationType: 'UNKNOWN',
      provenance: 'HISTORICAL_SOURCE_UNAVAILABLE',
      daysOfProxyLag: diffDays,
      status: 'INSUFFICIENT_DATA',
      missingDataReason: `Proxy price of ₹${row.price} from ${row.date} exceeds allowed ${allowedMaxDays}-day freshness window (${diffDays} days old).`,
      ruleCode: ruleConfig.ruleCode,
      ruleVersion: TIME_MACHINE_RULE_REGISTRY.version
    };
  }

  public findBatchPricesAsOf(familyId: number, asOfDate: string): Map<number, AssetPrice> {
    const rows = db.prepare(`
      SELECT ap.asset_id, ap.date, ap.price
      FROM asset_prices ap
      JOIN assets a ON a.id = ap.asset_id
      JOIN family_members fm ON fm.id = a.family_member_id
      WHERE fm.family_id = ? AND ap.date <= ?
      ORDER BY ap.asset_id ASC, ap.date DESC
    `).all(familyId, asOfDate) as AssetPrice[];

    const resultMap = new Map<number, AssetPrice>();
    for (const r of rows) {
      if (!resultMap.has(r.asset_id)) {
        resultMap.set(r.asset_id, r);
      }
    }
    return resultMap;
  }
}

export const priceRepository = new SQLitePriceRepository();
