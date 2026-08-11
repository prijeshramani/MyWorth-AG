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

  // HEAL ANY LEGACY TABLES MISSING PRIMARY KEY ON id COLUMN
  const allTables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_old' AND name NOT LIKE '%_legacy%'").all() as Array<{ name: string; sql: string }>;
  for (const t of allTables) {
    if (t.sql && !t.sql.toUpperCase().includes('PRIMARY KEY')) {
      const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all() as any[];
      const idCol = cols.find(c => c.name === 'id');
      if (idCol && (idCol.type.toUpperCase().includes('INT') || idCol.type === '')) {
        console.log(`Migrating legacy table '${t.name}' to include INTEGER PRIMARY KEY AUTOINCREMENT on id...`);
        db.pragma('foreign_keys = OFF');
        db.prepare(`ALTER TABLE "${t.name}" RENAME TO "${t.name}_legacy_pk"`).run();
        
        let newSql = t.sql.replace(/\bid\b\s+INT(EGER)?/i, 'id INTEGER PRIMARY KEY AUTOINCREMENT');
        if (!newSql.toUpperCase().includes('PRIMARY KEY')) {
          newSql = t.sql.replace(new RegExp(`CREATE TABLE\\s+"?${t.name}"?\\s*\\(`, 'i'), `CREATE TABLE "${t.name}" (id INTEGER PRIMARY KEY AUTOINCREMENT, `);
        }
        db.prepare(newSql).run();

        const colNames = cols.map(c => `"${c.name}"`).join(', ');
        db.prepare(`
          INSERT INTO "${t.name}" (${colNames})
          SELECT ${colNames} FROM "${t.name}_legacy_pk"
        `).run();

        db.prepare(`DROP TABLE "${t.name}_legacy_pk"`).run();
        db.pragma('foreign_keys = ON');
        console.log(`Legacy table '${t.name}' primary key migration completed.`);
      } else if (idCol && idCol.type.toUpperCase().includes('TEXT')) {
        console.log(`Migrating legacy table '${t.name}' to include TEXT PRIMARY KEY on id...`);
        db.pragma('foreign_keys = OFF');
        db.prepare(`ALTER TABLE "${t.name}" RENAME TO "${t.name}_legacy_pk"`).run();
        
        let newSql = t.sql.replace(/\bid\b\s+TEXT/i, 'id TEXT PRIMARY KEY');
        if (!newSql.toUpperCase().includes('PRIMARY KEY')) {
          newSql = t.sql.replace(new RegExp(`CREATE TABLE\\s+"?${t.name}"?\\s*\\(`, 'i'), `CREATE TABLE "${t.name}" (id TEXT PRIMARY KEY, `);
        }
        db.prepare(newSql).run();

        const colNames = cols.map(c => `"${c.name}"`).join(', ');
        db.prepare(`
          INSERT INTO "${t.name}" (${colNames})
          SELECT ${colNames} FROM "${t.name}_legacy_pk"
        `).run();

        db.prepare(`DROP TABLE "${t.name}_legacy_pk"`).run();
        db.pragma('foreign_keys = ON');
        console.log(`Legacy table '${t.name}' primary key migration completed.`);
      }
    }
  }

  // HEAL BROKEN FOREIGN KEYS POINTING TO ANY '_old' TABLES
  const brokenTables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%_old%'").all() as Array<{ name: string; sql: string }>;
  if (brokenTables.length > 0) {
    console.log(`Database schema correction required: Found ${brokenTables.length} tables referencing non-existent '_old' tables due to past migrations. Correcting now...`);
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      for (const table of brokenTables) {
        console.log(`Correcting foreign keys for table: ${table.name}...`);
        
        // Rename existing table
        db.prepare(`ALTER TABLE "${table.name}" RENAME TO "${table.name}_old"`).run();
        
        // Create new table with corrected foreign key pointing to clean table names
        const newSql = table.sql.replace(/REFERENCES\s+"?(\w+)_old"?/gi, 'REFERENCES $1');
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
    })();
    db.pragma('foreign_keys = ON');
    console.log('Database schema correction successfully completed.');
  }

  // Create Assets table or run migration if needed
  const assetsTableCheck = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='assets'").get() as { sql: string } | undefined;
  
  if (assetsTableCheck) {
    if (!assetsTableCheck.sql.includes("'SSY'")) {
      console.log('Running database schema migration for assets table to support SSY...');
      db.pragma('foreign_keys = OFF');
      db.transaction(() => {
        db.prepare('ALTER TABLE assets RENAME TO assets_old').run();
        
        db.prepare(`
          CREATE TABLE assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_member_id INTEGER,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'EPF', 'FIXED_DEPOSIT', 'SSY', 'OTHER')),
            category TEXT NOT NULL CHECK(category IN ('Equity', 'Debt', 'Cash', 'Hybrid', 'Alternative', 'Other')),
            identifier TEXT,
            metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (family_member_id) REFERENCES family_members(id)
          )
        `).run();
        
        const oldCols = (db.prepare("PRAGMA table_info(assets_old)").all() as any[]).map(c => c.name);
        const familyMemberStr = oldCols.includes('family_member_id') ? 'family_member_id' : 'NULL as family_member_id';
        const metaStr = oldCols.includes('metadata') ? 'metadata' : 'NULL as metadata';

        db.prepare(`
          INSERT INTO assets (id, family_member_id, name, type, category, identifier, metadata, created_at, updated_at)
          SELECT id, ${familyMemberStr}, name, type, category, identifier, ${metaStr}, created_at, updated_at FROM assets_old
        `).run();
        
        db.prepare('DROP TABLE assets_old').run();
      })();
      db.pragma('foreign_keys = ON');
      console.log('Database assets schema migration for SSY successfully completed.');
    }
  } else {
    // Create new table directly
    db.prepare(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_member_id INTEGER,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('MUTUAL_FUND', 'STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'EPF', 'FIXED_DEPOSIT', 'SSY', 'OTHER')),
        category TEXT NOT NULL CHECK(category IN ('Equity', 'Debt', 'Cash', 'Hybrid', 'Alternative', 'Other')),
        identifier TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_member_id) REFERENCES family_members(id)
      )
    `).run();
  }

  // Ensure assets table has family_member_id & metadata columns
  const assetsCols = db.prepare("PRAGMA table_info(assets)").all() as any[];
  if (assetsCols.length > 0 && !assetsCols.some(c => c.name === 'family_member_id')) {
    db.prepare('ALTER TABLE assets ADD COLUMN family_member_id INTEGER REFERENCES family_members(id)').run();
  }
  if (assetsCols.length > 0 && !assetsCols.some(c => c.name === 'metadata')) {
    db.prepare('ALTER TABLE assets ADD COLUMN metadata TEXT').run();
  }

  // Ensure accounts table has family_member_id column
  const accountsCols = db.prepare("PRAGMA table_info(accounts)").all() as any[];
  if (accountsCols.length > 0 && !accountsCols.some(c => c.name === 'family_member_id')) {
    db.prepare('ALTER TABLE accounts ADD COLUMN family_member_id INTEGER REFERENCES family_members(id)').run();
  }

  // Create Transactions table (check schema and migrate if needed)
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get();
  
  if (tableCheck) {
    const columns = db.prepare("PRAGMA table_info(transactions)").all() as any[];
    const hasNarration = columns.some(c => c.name === 'narration');
    
    if (!hasNarration) {
      console.log('Running database schema migration for transactions table to support Cash Flow & BankInsights...');
      db.pragma('foreign_keys = OFF');
      db.transaction(() => {
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
      })();
      db.pragma('foreign_keys = ON');
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

  // Execute Versioned Database Migrations
  runMigrations(db, [migration001, migration002, migration003, migration004, migration005, migration006, migration007, migration008, migration009, migration010, migration011, migration012], dbPath);

  // Ensure insurance_policies has Family Floater columns (idempotent)
  const insuranceCols = db.prepare("PRAGMA table_info(insurance_policies)").all() as any[];
  if (insuranceCols.length > 0) {
    if (!insuranceCols.some(c => c.name === 'is_family_floater')) {
      db.prepare('ALTER TABLE insurance_policies ADD COLUMN is_family_floater INTEGER NOT NULL DEFAULT 0').run();
      console.log('Added is_family_floater column to insurance_policies.');
    }
    if (!insuranceCols.some(c => c.name === 'covered_member_ids')) {
      db.prepare('ALTER TABLE insurance_policies ADD COLUMN covered_member_ids TEXT').run();
      console.log('Added covered_member_ids column to insurance_policies.');
    }
  }


  // Ensure default Family (id = 1) exists to satisfy Foreign Keys
  db.prepare("INSERT OR IGNORE INTO families (id, name, currency) VALUES (1, 'My Family', 'INR')").run();

  console.log('Database tables successfully verified/created.');
}
