import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration010: Migration = {
  version: 10,
  name: '010_recommendation_engine',
  up: (db: Database.Database) => {
    // 1. Recommendation Rules Table (Central Configurable Rules)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS recommendation_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_code TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL CHECK(category IN ('INVESTMENT', 'TAX', 'ESTATE', 'PROTECTION', 'PLANNING')),
        title_template TEXT NOT NULL,
        description_template TEXT NOT NULL,
        threshold_config_json TEXT,
        priority_default TEXT NOT NULL DEFAULT 'HIGH' CHECK(priority_default IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
        journey_id TEXT,
        prerequisite_rule_code TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. Generated Recommendations Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        rule_id INTEGER,
        rule_code TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('INVESTMENT', 'TAX', 'ESTATE', 'PROTECTION', 'PLANNING')),
        journey_id TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'HIGH' CHECK(priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
        confidence_pct REAL NOT NULL DEFAULT 90.0,
        financial_impact_amount REAL NOT NULL DEFAULT 0.0,
        urgency TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(urgency IN ('IMMEDIATE', 'HIGH', 'MEDIUM', 'LOW')),
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'ACCEPTED', 'DISMISSED', 'SNOOZED', 'COMPLETED', 'EXPIRED')),
        snoozed_until TEXT,
        source_engines_json TEXT NOT NULL,
        supporting_evidence_json TEXT,
        next_action_json TEXT,
        ai_context_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
        FOREIGN KEY (rule_id) REFERENCES recommendation_rules(id) ON DELETE SET NULL
      )
    `).run();

    // 3. Recommendation Journeys Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS recommendation_journeys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        journey_code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        total_steps INTEGER NOT NULL DEFAULT 0,
        completed_steps INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 4. Recommendation Actions Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS recommendation_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recommendation_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        action_label TEXT NOT NULL,
        action_payload_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
      )
    `).run();

    // 5. Recommendation History & Audit Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS recommendation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recommendation_id INTEGER NOT NULL,
        family_id REAL NOT NULL,
        status_from TEXT NOT NULL,
        status_to TEXT NOT NULL,
        changed_by TEXT NOT NULL DEFAULT 'USER',
        reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 6. Recommendation Scores Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS recommendation_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recommendation_id INTEGER NOT NULL UNIQUE,
        priority_score REAL NOT NULL DEFAULT 0.0,
        impact_score REAL NOT NULL DEFAULT 0.0,
        urgency_score REAL NOT NULL DEFAULT 0.0,
        overall_rank_score REAL NOT NULL DEFAULT 0.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
      )
    `).run();

    db.prepare(`CREATE INDEX IF NOT EXISTS idx_recs_family_status ON recommendations(family_id, status)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_rec_history_family ON recommendation_history(family_id)`).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_rec_history_family').run();
    db.prepare('DROP INDEX IF EXISTS idx_recs_family_status').run();
    db.prepare('DROP TABLE IF EXISTS recommendation_scores').run();
    db.prepare('DROP TABLE IF EXISTS recommendation_history').run();
    db.prepare('DROP TABLE IF EXISTS recommendation_actions').run();
    db.prepare('DROP TABLE IF EXISTS recommendation_journeys').run();
    db.prepare('DROP TABLE IF EXISTS recommendations').run();
    db.prepare('DROP TABLE IF EXISTS recommendation_rules').run();
  }
};
