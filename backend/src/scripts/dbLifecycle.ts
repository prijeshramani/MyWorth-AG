import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { runMigrations } from '../db/migrationRunner';
import { migration001 } from '../db/migrations/001_initial_schema';
import { migration002 } from '../db/migrations/002_family_hierarchy';
import { migration003 } from '../db/migrations/003_holding_enhancements';
import { migration004 } from '../db/migrations/004_document_vault';
import { migration005 } from '../db/migrations/005_tax_engine';
import { migration006 } from '../db/migrations/006_insurance_protection';
import { migration007 } from '../db/migrations/007_knowledge_graph';
import { migration008 } from '../db/migrations/008_estate_planning';
import { migration009 } from '../db/migrations/009_financial_planning';
import { migration010 } from '../db/migrations/010_recommendation_engine';
import { migration011 } from '../db/migrations/011_ai_context';

const dataDir = path.resolve(__dirname, '../../../data');
const dbPath = path.join(dataDir, 'familywealth.db');
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

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('[dbLifecycle] Removed existing database file.');
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db, [
    migration001, migration002, migration003, migration004, migration005,
    migration006, migration007, migration008, migration009, migration010, migration011
  ], dbPath);

  console.log('[dbLifecycle] DB Reset & Migrations 001-011 completed cleanly.');
  db.close();
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
