import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Resolve database path
const dbDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dbDir, 'myworth.db');

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

  // Create Assets table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'OTHER')),
      category TEXT NOT NULL CHECK(category IN ('Equity', 'Debt', 'Cash', 'Hybrid', 'Alternative', 'Other')),
      identifier TEXT, -- ISIN for MF, Ticker for Stocks, PRAN for NPS
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Create Transactions table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('BUY', 'SELL', 'REINVEST', 'DIVIDEND', 'INTEREST', 'BONUS')),
      date TEXT NOT NULL, -- YYYY-MM-DD
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      amount REAL NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('PDF_IMPORT', 'MANUAL')),
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

  console.log('Database tables successfully verified/created.');
}
