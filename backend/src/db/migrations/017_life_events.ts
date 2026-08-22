import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration017: Migration = {
  version: 17,
  name: '017_life_events',
  up: (db: Database.Database) => {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS life_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        event_title TEXT NOT NULL,
        status TEXT CHECK(status IN ('DETECTED', 'VERIFIED', 'PROCESSED', 'DISMISSED')) DEFAULT 'DETECTED',
        event_version INTEGER NOT NULL DEFAULT 1,
        declared_at TEXT NOT NULL,
        effective_date TEXT NOT NULL,
        declared_by_member_id INTEGER,
        confidence_pct REAL NOT NULL DEFAULT 100.0,
        evidence_completeness_pct REAL NOT NULL DEFAULT 100.0,
        event_payload_json TEXT NOT NULL DEFAULT '{}',
        evidence_payload_json TEXT NOT NULL DEFAULT '{}',
        impact_summary_json TEXT NOT NULL DEFAULT '{}',
        baseline_state_hash TEXT,
        baseline_as_of TEXT,
        rule_version TEXT DEFAULT '2026.1',
        calculation_version TEXT DEFAULT '1.0.0',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        processed_at TEXT,
        dismissed_at TEXT,
        dismiss_reason TEXT,
        FOREIGN KEY (family_id) REFERENCES families(id)
      )
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_life_events_family_status ON life_events(family_id, status)
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_life_events_family_type ON life_events(family_id, event_type)
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP TABLE IF EXISTS life_events').run();
  }
};
