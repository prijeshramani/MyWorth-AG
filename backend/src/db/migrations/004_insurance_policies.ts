import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration004: Migration = {
  version: 4,
  name: '004_insurance_policies',
  up: (db: Database.Database) => {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS insurance_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        policy_number TEXT NOT NULL,
        insurer_name TEXT NOT NULL,
        policy_type TEXT NOT NULL,
        policy_holder_id REAL NOT NULL,
        sum_assured REAL NOT NULL,
        premium_amount REAL NOT NULL,
        premium_frequency TEXT NOT NULL DEFAULT 'ANNUAL',
        start_date TEXT NOT NULL,
        maturity_date TEXT,
        next_premium_due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        nominee_name TEXT,
        nominee_relationship TEXT,
        document_id TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (policy_holder_id) REFERENCES family_members(id) ON DELETE CASCADE
      )
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_insurance_policies_family 
      ON insurance_policies(family_id) 
      WHERE deleted_at IS NULL
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_insurance_policies_family').run();
    db.prepare('DROP TABLE IF EXISTS insurance_policies').run();
  }
};
