import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../../data/myworth.db');
const backupPath = path.resolve(__dirname, '../../../data/backups/recovery_api_backup_2026-08-07T17-45-34-142Z.db');

console.log(`Attaching backup ${backupPath} to ${dbPath}...`);
const db = new Database(dbPath);

db.pragma('foreign_keys = OFF');
db.prepare(`ATTACH DATABASE ? AS backup`).run(backupPath);

const tables = db.prepare("SELECT name FROM backup.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;

console.log(`Copying ${tables.length} tables from master backup...`);

db.transaction(() => {
  for (const t of tables) {
    try {
      db.prepare(`DROP TABLE IF EXISTS main."${t.name}"`).run();
      db.prepare(`CREATE TABLE main."${t.name}" AS SELECT * FROM backup."${t.name}"`).run();
      console.log(`  -> Restored table: ${t.name}`);
    } catch (err: any) {
      console.error(`Error restoring table ${t.name}:`, err.message);
    }
  }
})();

db.prepare('DETACH DATABASE backup').run();
db.pragma('foreign_keys = ON');

console.log('\n--- Restored Ramani Database Summary ---');
console.table(db.prepare("SELECT * FROM families WHERE deleted_at IS NULL").all());
console.table(db.prepare("SELECT * FROM family_members WHERE deleted_at IS NULL").all());
console.log('Assets count:', db.prepare('SELECT COUNT(*) as c FROM assets').get());
console.log('Holdings count:', db.prepare('SELECT COUNT(*) as c FROM holdings').get());
console.log('Transactions count:', db.prepare('SELECT COUNT(*) as c FROM transactions').get());
