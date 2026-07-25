import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

export function createDatabaseBackup(dbPath: string): string {
  const backupsDir = path.join(path.dirname(dbPath), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupsDir, `myworth_backup_${timestamp}.db`);

  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Database backup successfully created at: ${backupPath}`);
  }

  return backupPath;
}

export function runMigrations(db: Database.Database, migrations: Migration[], dbPath: string) {
  // Ensure schema_migrations table exists
  db.prepare(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Get executed migration versions
  const executedRows = db.prepare('SELECT version FROM schema_migrations ORDER BY version ASC').all() as Array<{ version: number }>;
  const executedVersions = new Set(executedRows.map(r => r.version));

  const pendingMigrations = migrations.filter(m => !executedVersions.has(m.version));

  if (pendingMigrations.length === 0) {
    console.log('No pending database migrations.');
    return;
  }

  console.log(`Found ${pendingMigrations.length} pending database migrations.`);

  // Create timestamped backup before running migrations
  createDatabaseBackup(dbPath);

  for (const migration of pendingMigrations) {
    console.log(`Executing Migration [${migration.version}]: ${migration.name}...`);

    const runTransaction = db.transaction(() => {
      migration.up(db);
      db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
    });

    try {
      runTransaction();
      console.log(`Migration [${migration.version}] ${migration.name} completed successfully.`);
    } catch (err: any) {
      console.error(`Migration [${migration.version}] ${migration.name} FAILED:`, err.message);
      throw err;
    }
  }
}
