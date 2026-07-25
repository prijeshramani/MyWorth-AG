import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration001: Migration = {
  version: 1,
  name: '001_domain_foundation',
  up: (db: Database.Database) => {
    // 1. Families Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL
      )
    `).run();

    // 2. Family Members Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL CHECK(relationship IN (
          'SELF', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDPARENT', 'GRANDCHILD', 'IN_LAW', 'OTHER'
        )),
        date_of_birth TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL,
        FOREIGN KEY (family_id) REFERENCES families(id)
      )
    `).run();

    // 3. Entities Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_member_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        entity_type TEXT NOT NULL CHECK(entity_type IN (
          'INDIVIDUAL', 'HUF', 'MINOR', 'COMPANY', 'TRUST', 'PARTNERSHIP', 'LLP', 'OTHER'
        )),
        pan_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL,
        FOREIGN KEY (family_member_id) REFERENCES family_members(id)
      )
    `).run();

    // Partial Unique Index for PAN Number (rejects active duplicate PANs)
    db.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_pan_unique 
      ON entities(pan_number) 
      WHERE deleted_at IS NULL AND pan_number IS NOT NULL AND pan_number != ''
    `).run();

    // 4. Accounts Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_id INTEGER NOT NULL,
        account_name TEXT NOT NULL,
        account_type TEXT NOT NULL CHECK(account_type IN (
          'DEMAT', 'BANK', 'EPF', 'PPF', 'NPS', 'FD', 'MUTUAL_FUND_FOLIO', 'CREDIT_CARD', 'OTHER'
        )),
        provider TEXT,
        institution_name TEXT,
        account_number TEXT,
        masked_account_number TEXT,
        nickname TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
      )
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP TABLE IF EXISTS accounts').run();
    db.prepare('DROP INDEX IF EXISTS idx_entities_pan_unique').run();
    db.prepare('DROP TABLE IF EXISTS entities').run();
    db.prepare('DROP TABLE IF EXISTS family_members').run();
    db.prepare('DROP TABLE IF EXISTS families').run();
  }
};
