import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration014: Migration = {
  version: 14,
  name: '014_ppf_type',
  up: (db: Database.Database) => {
    // 1. Check if assets table schema contains PPF in CHECK constraint
    const assetsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='assets'").get() as { sql: string } | undefined;
    if (assetsSql && assetsSql.sql && !assetsSql.sql.includes("'PPF'")) {
      db.prepare('PRAGMA foreign_keys = OFF').run();
      db.prepare('DROP TABLE IF EXISTS assets_new').run();
      db.prepare(`
        CREATE TABLE assets_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          family_member_id INTEGER,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'US_STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'EPF', 'FIXED_DEPOSIT', 'SSY', 'PPF', 'OTHER')),
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
  }
};
