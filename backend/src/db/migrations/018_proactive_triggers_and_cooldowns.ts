import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration018: Migration = {
  version: 18,
  name: '018_proactive_triggers_and_cooldowns',
  up: (db: Database.Database) => {
    // 1. Cooldown Registry Table (Rule-level cooldowns and suppression per family)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS proactive_cooldown_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER NOT NULL,
        rule_code TEXT NOT NULL,
        rule_version TEXT NOT NULL DEFAULT '2026.1',
        entity_id TEXT NOT NULL DEFAULT 'FAMILY',
        last_triggered_at TEXT NOT NULL,
        cooldown_until TEXT NOT NULL,
        last_state_hash TEXT NOT NULL,
        last_metric_value REAL,
        status TEXT CHECK(status IN ('ACTIVE', 'COOLDOWN', 'DISMISSED', 'SNOOZED')) DEFAULT 'COOLDOWN',
        snoozed_until TEXT,
        dismissed_at TEXT,
        dismiss_reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id),
        UNIQUE(family_id, rule_code, entity_id)
      )
    `).run();

    // 2. Proactive Triggers Table (Authoritative store for all proactive fiduciary triggers)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS proactive_triggers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger_id TEXT UNIQUE NOT NULL,
        family_id INTEGER NOT NULL,
        rule_code TEXT NOT NULL,
        rule_version TEXT NOT NULL DEFAULT '2026.1',
        entity_id TEXT NOT NULL DEFAULT 'FAMILY',
        urgency TEXT CHECK(urgency IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) NOT NULL,
        priority_score INTEGER NOT NULL DEFAULT 50,
        confidence_pct REAL NOT NULL,
        data_completeness_score REAL NOT NULL,
        headline TEXT NOT NULL,
        rationale TEXT NOT NULL,
        evidence_payload_json TEXT NOT NULL DEFAULT '{}',
        explainability_lineage_json TEXT NOT NULL DEFAULT '{}',
        action_payload_json TEXT NOT NULL DEFAULT '{}',
        state_hash TEXT NOT NULL,
        as_of_date TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        status TEXT CHECK(status IN ('ACTIVE', 'ACKNOWLEDGED', 'SNOOZED', 'DISMISSED', 'RESOLVED', 'STALE', 'EXPIRED')) DEFAULT 'ACTIVE',
        snoozed_until TEXT,
        resolved_at TEXT,
        resolved_reason TEXT,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id)
      )
    `).run();

    // 3. Performance Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_proactive_triggers_family_status ON proactive_triggers(family_id, status)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_proactive_triggers_rule ON proactive_triggers(family_id, rule_code)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_cooldown_lookup ON proactive_cooldown_registry(family_id, rule_code, entity_id)`).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP TABLE IF EXISTS proactive_triggers').run();
    db.prepare('DROP TABLE IF EXISTS proactive_cooldown_registry').run();
  }
};
