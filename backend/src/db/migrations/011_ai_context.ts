import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration011: Migration = {
  version: 11,
  name: '011_ai_context',
  up: (db: Database.Database) => {
    // 1. AI Capabilities Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_capabilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        capability_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        required_context_providers_json TEXT NOT NULL,
        required_permissions_json TEXT NOT NULL,
        safety_policy_json TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. AI Sessions Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        user_id INTEGER NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 3. AI Memory Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        memory_type TEXT NOT NULL CHECK(memory_type IN ('PERMANENT', 'SESSION', 'EXPIRING', 'USER_REMOVABLE')),
        key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        confidence_score REAL NOT NULL DEFAULT 95.0,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 4. AI Context Cache Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_context_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        context_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        freshness_status TEXT NOT NULL DEFAULT 'FRESH' CHECK(freshness_status IN ('FRESH', 'STALE')),
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 5. AI Evidence Table (with Provenance)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        evidence_code TEXT NOT NULL,
        source_engine TEXT NOT NULL,
        source_engine_version TEXT NOT NULL DEFAULT '1.0.0',
        rule_version TEXT NOT NULL DEFAULT '1.0.0',
        calculation_hash TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        proof_data_json TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 6. AI Prompt Templates Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_prompt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_code TEXT NOT NULL,
        system_prompt_template TEXT NOT NULL,
        user_prompt_template TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 7. AI Conversation State Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_conversation_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        family_id REAL NOT NULL,
        current_intent TEXT,
        active_entity_type TEXT,
        active_entity_id INTEGER,
        context_summary TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES ai_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    db.prepare(`CREATE INDEX IF NOT EXISTS idx_ai_mem_family ON ai_memory(family_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_ai_evidence_family ON ai_evidence(family_id)`).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_ai_evidence_family').run();
    db.prepare('DROP INDEX IF EXISTS idx_ai_mem_family').run();
    db.prepare('DROP TABLE IF EXISTS ai_conversation_state').run();
    db.prepare('DROP TABLE IF EXISTS ai_prompt_templates').run();
    db.prepare('DROP TABLE IF EXISTS ai_evidence').run();
    db.prepare('DROP TABLE IF EXISTS ai_context_cache').run();
    db.prepare('DROP TABLE IF EXISTS ai_memory').run();
    db.prepare('DROP TABLE IF EXISTS ai_sessions').run();
    db.prepare('DROP TABLE IF EXISTS ai_capabilities').run();
  }
};
