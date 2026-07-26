# 💾 PRICE_STORAGE_STRATEGY.md — Price Storage & Caching Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 2 (Architecture & Provider Framework)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Physical Database Schema (Architecture v1.0 Frozen)

Price snapshots are persisted in the existing `asset_prices` table defined in Migration `001_domain_foundation.ts`:

```sql
CREATE TABLE IF NOT EXISTS asset_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  price_date TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  UNIQUE(asset_id, price_date)
);

CREATE INDEX IF NOT EXISTS idx_asset_prices_lookup 
ON asset_prices(asset_id, price_date DESC);
```

---

## 2. Multi-Tier Caching Architecture

To achieve sub-millisecond price lookups during portfolio valuation calculations, a 2-tier caching strategy is employed:

```
[ValuationEngine]
        │
        ▼
[Tier-1: In-Memory LRU Cache] (Capacity: 5,000 entries, TTL: 1 Hour)
        │
        ├─ Cache Hit (0.01ms) ──► Return PriceSnapshot
        │
        ▼ (Cache Miss)
[Tier-2: SQLite asset_prices Repository] (Indexed Lookup: asset_id + price_date)
        │
        ├─ DB Hit (0.5ms) ────► Populate LRU Cache & Return
        │
        ▼ (DB Miss)
[Price Provider Framework] ──► Fetch Market API ──► Persist DB & Cache
```

---

## 3. Pruning & Retention Policy

- Daily closing prices are retained permanently for tax and capital gains historical lookback.
- Intraday price ticks are NOT stored (Family Wealth OS is an end-of-day portfolio engine, not a high-frequency trading platform).
