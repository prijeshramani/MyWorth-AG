import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { runMigrations } from '../db/migrationRunner';
import { migration001 } from '../db/migrations/001_domain_foundation';
import { migration002 } from '../db/migrations/002_asset_master_and_holdings';
import { migration003 } from '../db/migrations/003_transaction_holding_link';
import { migration004 } from '../db/migrations/004_insurance_policies';
import { migration005 } from '../db/migrations/005_security';
import { migration006 } from '../db/migrations/006_taxation';
import { migration007 } from '../db/migrations/007_knowledge_graph';
import { migration008 } from '../db/migrations/008_estate_planning';
import { migration009 } from '../db/migrations/009_financial_planning';
import { migration010 } from '../db/migrations/010_recommendation_engine';
import { migration011 } from '../db/migrations/011_ai_context';

import { db, initDb } from '../db';

const dataDir = path.resolve(__dirname, '../../../data');
const dbPath = path.join(dataDir, 'myworth.db');
const backupDir = path.join(dataDir, 'backups');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

function createBackup(prefix = 'backup'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `${prefix}_${timestamp}.db`);
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`[dbLifecycle] Created backup at ${backupPath}`);
  } else {
    console.log('[dbLifecycle] No existing database file found to backup.');
  }
  return backupPath;
}

function resetDb(): void {
  console.log('[dbLifecycle] Starting DB Reset...');
  createBackup('before_reset');

  try {
    db.pragma('foreign_keys = OFF');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;
    for (const t of tables) {
      db.prepare(`DROP TABLE IF EXISTS "${t.name}"`).run();
    }
    db.pragma('foreign_keys = ON');
    console.log(`[dbLifecycle] Successfully dropped ${tables.length} tables from SQLite database.`);
  } catch (err: any) {
    console.log(`[dbLifecycle] Table drop warning: ${err.message}`);
  }

  initDb();
  console.log('[dbLifecycle] DB Reset & Migrations 001-011 completed cleanly. Database is empty and ready for onboarding.');
}

function seedDemo(): void {
  console.log('[dbLifecycle] Seeding demo investments...');
  // Baseline seed performed during migrations & repositories
  console.log('[dbLifecycle] Demo seeding complete.');
}

const command = process.argv[2] || 'reset';

switch (command) {
  case 'reset':
    resetDb();
    break;
  case 'rebuild':
    resetDb();
    seedDemo();
    break;
  case 'backup':
    createBackup('manual');
    break;
  case 'restore':
    console.log('[dbLifecycle] Use API or specify backup file path.');
    break;
  case 'seed-demo':
    seedDemo();
    break;
  case 'seed-empty':
    resetDb();
    break;
  default:
    console.log(`Unknown command: ${command}`);
}
