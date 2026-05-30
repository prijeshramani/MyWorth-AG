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

  // HEAL BROKEN FOREIGN KEYS POINTING TO 'assets_old'
  const brokenTables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%assets_old%'").all() as Array<{ name: string; sql: string }>;
  if (brokenTables.length > 0) {
    console.log(`Database schema correction required: Found ${brokenTables.length} tables referencing non-existent 'assets_old' due to a past migration. Correcting now...`);
    db.transaction(() => {
      db.pragma('foreign_keys = OFF');
      
      for (const table of brokenTables) {
        console.log(`Correcting foreign keys for table: ${table.name}...`);
        
        // Rename existing table
        db.prepare(`ALTER TABLE "${table.name}" RENAME TO "${table.name}_old"`).run();
        
        // Create new table with corrected foreign key pointing to "assets"
        const newSql = table.sql.replace(/REFERENCES\s+"assets_old"/gi, 'REFERENCES assets');
        db.prepare(newSql).run();
        
        // Copy data dynamically
        const columnsInfo = db.prepare(`PRAGMA table_info("${table.name}_old")`).all() as any[];
        const colNames = columnsInfo.map(c => `"${c.name}"`).join(', ');
        
        db.prepare(`
          INSERT INTO "${table.name}" (${colNames})
          SELECT ${colNames} FROM "${table.name}_old"
        `).run();
        
        // Drop old table
        db.prepare(`DROP TABLE "${table.name}_old"`).run();
      }
      
      db.pragma('foreign_keys = ON');
    })();
    console.log('Database schema correction successfully completed.');
  }

  // Create Assets table or run migration if needed
  const assetsTableCheck = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='assets'").get() as { sql: string } | undefined;
  
  if (assetsTableCheck) {
    if (!assetsTableCheck.sql.includes("'EPF'")) {
      console.log('Running database schema migration for assets table to support EPF (Provident Fund)...');
      db.transaction(() => {
        db.pragma('foreign_keys = OFF');
        
        // Rename table
        db.prepare('ALTER TABLE assets RENAME TO assets_old').run();
        
        // Create new table with expanded check constraints
        db.prepare(`
          CREATE TABLE assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'EPF', 'OTHER')),
            category TEXT NOT NULL CHECK(category IN ('Equity', 'Debt', 'Cash', 'Hybrid', 'Alternative', 'Other')),
            identifier TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        // Copy old data
        db.prepare(`
          INSERT INTO assets (id, name, type, category, identifier, created_at, updated_at)
          SELECT id, name, type, category, identifier, created_at, updated_at
          FROM assets_old
        `).run();
        
        // Drop old table
        db.prepare('DROP TABLE assets_old').run();
        
        db.pragma('foreign_keys = ON');
      })();
      console.log('Database assets schema migration successfully completed.');
    }
  } else {
    // Create new table directly
    db.prepare(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'EPF', 'OTHER')),
        category TEXT NOT NULL CHECK(category IN ('Equity', 'Debt', 'Cash', 'Hybrid', 'Alternative', 'Other')),
        identifier TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  }

  // Create Transactions table (check schema and migrate if needed)
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get();
  
  if (tableCheck) {
    const columns = db.prepare("PRAGMA table_info(transactions)").all() as any[];
    const hasNarration = columns.some(c => c.name === 'narration');
    
    if (!hasNarration) {
      console.log('Running database schema migration for transactions table to support Cash Flow & BankInsights...');
      db.transaction(() => {
        db.pragma('foreign_keys = OFF');
        
        // Rename table
        db.prepare('ALTER TABLE transactions RENAME TO transactions_old').run();
        
        // Create new table with expanded check constraints and columns
        db.prepare(`
          CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        
        // Copy old data
        db.prepare(`
          INSERT INTO transactions (id, asset_id, type, date, quantity, price, amount, source, created_at)
          SELECT id, asset_id, type, date, quantity, price, amount, source, created_at
          FROM transactions_old
        `).run();
        
        // Drop old table
        db.prepare('DROP TABLE transactions_old').run();
        
        db.pragma('foreign_keys = ON');
      })();
      console.log('Database schema migration successfully completed.');
    }
  } else {
    // Create new table directly
    db.prepare(`
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  }

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
