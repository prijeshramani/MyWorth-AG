import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './db/migrationRunner';
import { migration001 } from './db/migrations/001_domain_foundation';
import { migration002 } from './db/migrations/002_asset_master_and_holdings';
import { migration003 } from './db/migrations/003_transaction_holding_link';
import { migration004 } from './db/migrations/004_insurance_policies';
import { migration005 } from './db/migrations/005_security';
import { migration006 } from './db/migrations/006_taxation';
import { migration007 } from './db/migrations/007_knowledge_graph';
import { migration008 } from './db/migrations/008_estate_planning';
import { migration009 } from './db/migrations/009_financial_planning';
import { migration010 } from './db/migrations/010_recommendation_engine';
import { migration011 } from './db/migrations/011_ai_context';
import { up as migration012Up, down as migration012Down } from './db/migrations/012_ai_actions';

import { migration013 } from './db/migrations/013_us_stock_type';
import { migration014 } from './db/migrations/014_ppf_type';
import { migration015 } from './db/migrations/015_insurance_floater_fields';
import { migration016 } from './db/migrations/016_idempotency_keys';
import { migration017 } from './db/migrations/017_life_events';

const migration012 = {
  version: 12,
  name: '012_ai_actions',
  up: migration012Up,
  down: migration012Down
};

// Resolve database path
const dbDir = path.resolve(__dirname, '../../data');
export const dbPath = path.join(dbDir, 'myworth.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
export const db = new Database(dbPath, { verbose: console.log });

// Enable Foreign Keys
db.pragma('foreign_keys = ON');

// Schema Initialization
export function initDb() {
  console.log(`Initializing database at: ${dbPath}`);

  // Create Assets table if missing
  db.prepare(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_member_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'US_STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'EPF', 'FIXED_DEPOSIT', 'SSY', 'PPF', 'OTHER')),
      category TEXT NOT NULL CHECK(category IN ('Equity', 'Debt', 'Cash', 'Hybrid', 'Alternative', 'Other')),
      identifier TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (family_member_id) REFERENCES family_members(id)
    )
  `).run();

  // Create Transactions table if missing
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      holding_id INTEGER,
      asset_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('BUY', 'SELL', 'REINVEST', 'DIVIDEND', 'INTEREST', 'BONUS', 'DEBIT', 'CREDIT')),
      date TEXT NOT NULL, -- YYYY-MM-DD
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

  // Create Asset Prices table (for tracking closing prices / daily NAVs)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS asset_prices (
      asset_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      price REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (asset_id, date),
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )
  `).run();

  // Create Sync Logs table (tracks AMFI/Yahoo daily updates)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type TEXT NOT NULL CHECK(sync_type IN ('AMFI', 'YAHOO', 'NPS')),
      status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED')),
      message TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Create Credentials table (for secure key-value integration secrets)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS credentials (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Execute Versioned Database Migrations
  runMigrations(db, [migration001, migration002, migration003, migration004, migration005, migration006, migration007, migration008, migration009, migration010, migration011, migration012, migration013, migration014, migration015, migration016, migration017], dbPath);

  // Ensure family_members has pan, email, phone columns (idempotent)
  const memberCols = db.prepare("PRAGMA table_info(family_members)").all() as any[];
  if (memberCols.length > 0) {
    if (!memberCols.some(c => c.name === 'pan')) {
      db.prepare('ALTER TABLE family_members ADD COLUMN pan TEXT').run();
    }
    if (!memberCols.some(c => c.name === 'email')) {
      db.prepare('ALTER TABLE family_members ADD COLUMN email TEXT').run();
    }
    if (!memberCols.some(c => c.name === 'phone')) {
      db.prepare('ALTER TABLE family_members ADD COLUMN phone TEXT').run();
    }
  }

  // Idempotent repair for transactions foreign key constraint if pointing to assets_old
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

  // Idempotent repair for asset_prices foreign key constraint if pointing to assets_old
  const priceSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='asset_prices'").get() as { sql: string } | undefined;
  if (priceSql && priceSql.sql && priceSql.sql.includes('assets_old')) {
    db.prepare('PRAGMA foreign_keys = OFF').run();
    db.prepare('DROP TABLE IF EXISTS asset_prices_new').run();
    db.prepare(`
      CREATE TABLE asset_prices_new (
        asset_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (asset_id, date),
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      )
    `).run();
    db.prepare('INSERT INTO asset_prices_new SELECT * FROM asset_prices').run();
    db.prepare('DROP TABLE asset_prices').run();
    db.prepare('ALTER TABLE asset_prices_new RENAME TO asset_prices').run();
    db.prepare('PRAGMA foreign_keys = ON').run();
  }

  console.log('Database tables successfully verified/created.');
}
