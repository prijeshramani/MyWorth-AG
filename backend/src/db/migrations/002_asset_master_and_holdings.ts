import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration002: Migration = {
  version: 2,
  name: '002_asset_master_and_holdings',
  up: (db: Database.Database) => {
    // 1. Assets Master Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS assets_master (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_type TEXT NOT NULL CHECK(asset_type IN (
          'STOCK', 'MUTUAL_FUND', 'ETF', 'BOND', 'FD', 'PPF', 'EPF', 'NPS', 'SSA', 'BANK', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'OTHER'
        )),
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        symbol TEXT,
        isin TEXT,
        currency TEXT NOT NULL DEFAULT 'INR',
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'DELISTED', 'MATURED')),
        metadata TEXT, -- JSON attributes
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL
      )
    `).run();

    // Partial Unique Index on ISIN
    db.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_master_isin_unique 
      ON assets_master(isin) 
      WHERE deleted_at IS NULL AND isin IS NOT NULL AND isin != ''
    `).run();

    // 2. Holdings Table (Account-to-Asset Ownership Link)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        asset_id INTEGER NOT NULL,
        opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        closed_at TEXT DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets_master(id) ON DELETE CASCADE
      )
    `).run();

    // Partial Unique Index on Open Holdings per Account
    db.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_account_asset_unique 
      ON holdings(account_id, asset_id) 
      WHERE deleted_at IS NULL AND status = 'OPEN'
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_holdings_account_asset_unique').run();
    db.prepare('DROP TABLE IF EXISTS holdings').run();
    db.prepare('DROP INDEX IF EXISTS idx_assets_master_isin_unique').run();
    db.prepare('DROP TABLE IF EXISTS assets_master').run();
  }
};
