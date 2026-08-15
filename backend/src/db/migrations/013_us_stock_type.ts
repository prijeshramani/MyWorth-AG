import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration013: Migration = {
  version: 13,
  name: '013_us_stock_type',
  up: (db: Database.Database) => {
    // 1. Check if transactions table has broken foreign key reference to assets_old
    const txSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'").get() as { sql: string } | undefined;
    if (txSql && txSql.sql && txSql.sql.includes('assets_old')) {
      db.prepare('PRAGMA foreign_keys = OFF').run();
      db.prepare('DROP TABLE IF EXISTS transactions_new').run();
      db.prepare(`
        CREATE TABLE transactions_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          holding_id INTEGER,
          asset_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('BUY', 'SELL', 'REINVEST', 'DIVIDEND', 'INTEREST', 'BONUS', 'DEBIT', 'CREDIT')),
          date TEXT NOT NULL,
          quantity REAL NOT NULL,
          price REAL NOT NULL,
          amount REAL NOT NULL,
          source TEXT NOT NULL CHECK(source IN ('PDF_IMPORT', 'MANUAL', 'BANK_INSIGHTS')),
          narration TEXT,
          tx_category TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
        )
      `).run();
      db.prepare('INSERT INTO transactions_new SELECT * FROM transactions').run();
      db.prepare('DROP TABLE transactions').run();
      db.prepare('ALTER TABLE transactions_new RENAME TO transactions').run();
      db.prepare('PRAGMA foreign_keys = ON').run();
    }

    // 2. Check if assets table schema contains US_STOCK in CHECK constraint
    const assetsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='assets'").get() as { sql: string } | undefined;
    if (assetsSql && assetsSql.sql && !assetsSql.sql.includes('US_STOCK')) {
      db.prepare('PRAGMA foreign_keys = OFF').run();
      db.prepare('DROP TABLE IF EXISTS assets_new').run();
      db.prepare(`
        CREATE TABLE assets_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          family_member_id INTEGER,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'US_STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'EPF', 'FIXED_DEPOSIT', 'SSY', 'OTHER')),
          category TEXT NOT NULL CHECK(category IN ('Equity', 'Debt', 'Cash', 'Hybrid', 'Alternative', 'Other')),
          identifier TEXT,
          metadata TEXT,
          cost_basis REAL,
          current_value REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (family_member_id) REFERENCES family_members(id)
        )
      `).run();
      const oldCols = (db.prepare('PRAGMA table_info(assets)').all() as any[]).map(c => c.name);
      const newCols = (db.prepare('PRAGMA table_info(assets_new)').all() as any[]).map(c => c.name);
      const commonCols = oldCols.filter(c => newCols.includes(c));
      db.prepare(`INSERT INTO assets_new (${commonCols.join(', ')}) SELECT ${commonCols.join(', ')} FROM assets`).run();
      db.prepare('DROP TABLE assets').run();
      db.prepare('ALTER TABLE assets_new RENAME TO assets').run();
      db.prepare('PRAGMA foreign_keys = ON').run();
    }

    // 2. Update existing US Stock assets to type US_STOCK
    db.prepare(`
      UPDATE assets 
      SET type = 'US_STOCK' 
      WHERE (type = 'STOCK' OR type IS NULL) 
      AND (
        identifier IN ('MSFT','AAPL','NVDA','TSLA','GOOGL','AMZN','META','WMT','AMD')
        OR LOWER(name) LIKE '%common stock%' 
        OR LOWER(name) LIKE '%microsoft%' 
        OR LOWER(name) LIKE '%walmart%' 
        OR LOWER(name) LIKE '%advanced micro%'
      )
    `).run();
  }
};
