import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration016: Migration = {
  version: 16,
  name: '016_idempotency_keys',
  up: (db: Database.Database) => {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        idempotency_key TEXT PRIMARY KEY,
        family_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        response_status INTEGER,
        response_body TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (family_id) REFERENCES families(id)
      )
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_idempotency_family ON idempotency_keys(family_id)
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at)
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP TABLE IF EXISTS idempotency_keys').run();
  }
};
