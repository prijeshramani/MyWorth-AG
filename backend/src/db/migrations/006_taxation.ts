import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration006: Migration = {
  version: 6,
  name: '006_taxation',
  up: (db: Database.Database) => {
    // 1. Tax Profiles Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tax_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        user_id INTEGER,
        financial_year TEXT NOT NULL DEFAULT '2025-26',
        assessment_year TEXT NOT NULL DEFAULT '2026-27',
        residential_status TEXT NOT NULL DEFAULT 'RESIDENT' CHECK(residential_status IN ('RESIDENT', 'RNOR', 'NON_RESIDENT')),
        age_category TEXT NOT NULL DEFAULT 'REGULAR' CHECK(age_category IN ('REGULAR', 'SENIOR', 'SUPER_SENIOR')),
        pan TEXT,
        aadhaar_linked INTEGER NOT NULL DEFAULT 1,
        preferred_regime TEXT NOT NULL DEFAULT 'NEW' CHECK(preferred_regime IN ('OLD', 'NEW')),
        is_huf INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 2. Tax Income Sources Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tax_income_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        tax_profile_id INTEGER NOT NULL,
        category TEXT NOT NULL CHECK(category IN (
          'SALARY', 'BUSINESS', 'HOUSE_PROPERTY', 'CAPITAL_GAINS', 'DIVIDEND', 'INTEREST', 'AGRICULTURE', 'FOREIGN', 'OTHER'
        )),
        gross_amount REAL NOT NULL DEFAULT 0,
        tax_deducted REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (tax_profile_id) REFERENCES tax_profiles(id) ON DELETE CASCADE
      )
    `).run();

    // 3. Tax Rules Table (Rule Engine Engine)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tax_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        financial_year TEXT NOT NULL,
        assessment_year TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0.0',
        effective_from TEXT NOT NULL,
        effective_to TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        government_reference TEXT,
        finance_act_year INTEGER NOT NULL,
        cbdt_notification TEXT,
        rule_json TEXT NOT NULL,
        created_date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 4. Tax Slabs Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tax_slabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id INTEGER NOT NULL,
        regime TEXT NOT NULL CHECK(regime IN ('OLD', 'NEW')),
        min_income REAL NOT NULL,
        max_income REAL,
        rate_percent REAL NOT NULL,
        surcharge_percent REAL NOT NULL DEFAULT 0,
        cess_percent REAL NOT NULL DEFAULT 4,
        FOREIGN KEY (rule_id) REFERENCES tax_rules(id) ON DELETE CASCADE
      )
    `).run();

    // 5. Deduction Rules Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS deduction_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL,
        max_limit REAL NOT NULL,
        applicable_regime TEXT NOT NULL CHECK(applicable_regime IN ('OLD', 'NEW', 'BOTH')),
        description TEXT
      )
    `).run();

    // 6. Tax Deductions Claimed Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tax_deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        tax_profile_id INTEGER NOT NULL,
        section TEXT NOT NULL,
        claimed_amount REAL NOT NULL DEFAULT 0,
        document_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (tax_profile_id) REFERENCES tax_profiles(id) ON DELETE CASCADE
      )
    `).run();

    // 7. Capital Gain Summary Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS capital_gain_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        financial_year TEXT NOT NULL,
        asset_category TEXT NOT NULL,
        stcg_amount REAL NOT NULL DEFAULT 0,
        ltcg_amount REAL NOT NULL DEFAULT 0,
        tax_payable REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 8. Tax Recommendations Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tax_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        estimated_savings REAL NOT NULL DEFAULT 0,
        priority TEXT NOT NULL CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')),
        action_type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 9. Tax Compliance Calendar Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tax_calendar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'UPCOMING',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_tax_profiles_family 
      ON tax_profiles(family_id) 
      WHERE deleted_at IS NULL
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_tax_profiles_family').run();
    db.prepare('DROP TABLE IF EXISTS tax_calendar').run();
    db.prepare('DROP TABLE IF EXISTS tax_recommendations').run();
    db.prepare('DROP TABLE IF EXISTS capital_gain_summary').run();
    db.prepare('DROP TABLE IF EXISTS tax_deductions').run();
    db.prepare('DROP TABLE IF EXISTS deduction_rules').run();
    db.prepare('DROP TABLE IF EXISTS tax_slabs').run();
    db.prepare('DROP TABLE IF EXISTS tax_rules').run();
    db.prepare('DROP TABLE IF EXISTS tax_income_sources').run();
    db.prepare('DROP TABLE IF EXISTS tax_profiles').run();
  }
};
