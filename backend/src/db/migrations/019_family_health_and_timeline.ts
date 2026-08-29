import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration019: Migration = {
  version: 19,
  name: '019_family_health_and_timeline',
  up: (db: Database.Database) => {
    // 1. Family Financial Health History (Periodic & Material Snapshots)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS family_health_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER NOT NULL,
        overall_score REAL NOT NULL,
        pillar_scores_json TEXT NOT NULL,
        life_stage TEXT NOT NULL,
        weights_json TEXT NOT NULL,
        completeness_score REAL NOT NULL,
        state_hash TEXT NOT NULL,
        calculation_version TEXT NOT NULL,
        snapshot_period TEXT NOT NULL, -- YYYY-MM
        as_of_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id),
        UNIQUE(family_id, snapshot_period, state_hash)
      )
    `).run();

    // Indexes for Family Health History
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_health_hist_fam_date 
      ON family_health_history(family_id, as_of_date DESC)
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_health_hist_fam_hash 
      ON family_health_history(family_id, state_hash)
    `).run();

    // 2. Family Timeline Events (Derived Read Model Index)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS family_timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER NOT NULL,
        event_id TEXT NOT NULL,
        domain TEXT CHECK(domain IN ('PORTFOLIO', 'PROTECTION', 'TAX', 'ESTATE', 'GOAL', 'LIFE_EVENT', 'AI_DECISION')) NOT NULL,
        event_type TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        amount REAL,
        amount_type TEXT,
        currency TEXT DEFAULT 'INR',
        family_member_id INTEGER,
        event_date TEXT NOT NULL,
        importance_tier TEXT CHECK(importance_tier IN ('CRITICAL', 'HIGH', 'MEDIUM', 'INFO')) DEFAULT 'MEDIUM',
        metadata_json TEXT,
        state_hash TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id),
        FOREIGN KEY (family_member_id) REFERENCES family_members(id),
        UNIQUE(family_id, event_id)
      )
    `).run();

    // Composite indexes for fast family-scoped querying and synchronization
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_timeline_fam_date 
      ON family_timeline_events(family_id, event_date DESC)
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_timeline_fam_domain 
      ON family_timeline_events(family_id, domain)
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_timeline_fam_source 
      ON family_timeline_events(family_id, source_type, source_id)
    `).run();
  },

  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_timeline_fam_source').run();
    db.prepare('DROP INDEX IF EXISTS idx_timeline_fam_domain').run();
    db.prepare('DROP INDEX IF EXISTS idx_timeline_fam_date').run();
    db.prepare('DROP TABLE IF EXISTS family_timeline_events').run();

    db.prepare('DROP INDEX IF EXISTS idx_health_hist_fam_hash').run();
    db.prepare('DROP INDEX IF EXISTS idx_health_hist_fam_date').run();
    db.prepare('DROP TABLE IF EXISTS family_health_history').run();
  }
};
