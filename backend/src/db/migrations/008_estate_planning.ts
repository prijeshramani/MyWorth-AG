import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration008: Migration = {
  version: 8,
  name: '008_estate_planning',
  up: (db: Database.Database) => {
    // 1. Estate Profiles Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS estate_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL UNIQUE,
        estate_health_score REAL NOT NULL DEFAULT 85.0,
        estate_value REAL NOT NULL DEFAULT 0.0,
        primary_executor_id INTEGER,
        lawyer_contact TEXT,
        ca_contact TEXT,
        doctor_contact TEXT,
        last_reviewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 2. Wills Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS wills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        testator_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        current_version INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ACTIVE', 'REGISTERED', 'REVOKED')),
        registration_number TEXT,
        registered_at TEXT,
        review_due_date TEXT,
        executor_name TEXT NOT NULL,
        witness1_name TEXT,
        witness2_name TEXT,
        document_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 3. Will Versions Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS will_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        will_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        changes_summary TEXT NOT NULL,
        document_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (will_id) REFERENCES wills(id) ON DELETE CASCADE
      )
    `).run();

    // 4. Trusts Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS trusts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        trust_name TEXT NOT NULL,
        trust_type TEXT NOT NULL CHECK(trust_type IN ('FAMILY', 'PRIVATE', 'CHARITABLE', 'REVOCABLE', 'IRREVOCABLE')),
        deed_number TEXT,
        corpus_amount REAL NOT NULL DEFAULT 0.0,
        settlor_id INTEGER NOT NULL,
        document_id TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 5. Trustees Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS trustees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trust_id INTEGER NOT NULL,
        person_id INTEGER NOT NULL,
        trustee_role TEXT NOT NULL CHECK(trustee_role IN ('PRIMARY', 'CO_TRUSTEE', 'SUCCESSOR')),
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        FOREIGN KEY (trust_id) REFERENCES trusts(id) ON DELETE CASCADE
      )
    `).run();

    // 6. Beneficiaries Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        person_id INTEGER NOT NULL,
        entitlement_percent REAL NOT NULL DEFAULT 0.0,
        relationship_type TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 7. Estate Simulations Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS estate_simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        scenario_name TEXT NOT NULL,
        deceased_person_id INTEGER NOT NULL,
        total_estate_value REAL NOT NULL DEFAULT 0.0,
        simulated_distribution_json TEXT NOT NULL,
        tax_impact_estimate REAL NOT NULL DEFAULT 0.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 8. Estate Timeline Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS estate_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    db.prepare(`CREATE INDEX IF NOT EXISTS idx_wills_family ON wills(family_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_trusts_family ON trusts(family_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_beneficiaries_family ON beneficiaries(family_id)`).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_beneficiaries_family').run();
    db.prepare('DROP INDEX IF EXISTS idx_trusts_family').run();
    db.prepare('DROP INDEX IF EXISTS idx_wills_family').run();
    db.prepare('DROP TABLE IF EXISTS estate_timeline').run();
    db.prepare('DROP TABLE IF EXISTS estate_simulations').run();
    db.prepare('DROP TABLE IF EXISTS beneficiaries').run();
    db.prepare('DROP TABLE IF EXISTS trustees').run();
    db.prepare('DROP TABLE IF EXISTS trusts').run();
    db.prepare('DROP TABLE IF EXISTS will_versions').run();
    db.prepare('DROP TABLE IF EXISTS wills').run();
    db.prepare('DROP TABLE IF EXISTS estate_profiles').run();
  }
};
