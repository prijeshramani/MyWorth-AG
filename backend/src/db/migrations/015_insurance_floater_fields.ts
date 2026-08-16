import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration015: Migration = {
  version: 15,
  name: '015_insurance_floater_fields',
  up: (db: Database.Database) => {
    const tableInfo = db.prepare("PRAGMA table_info('insurance_policies')").all() as Array<{ name: string }>;
    const colNames = tableInfo.map(c => c.name);

    if (!colNames.includes('is_family_floater')) {
      db.prepare('ALTER TABLE insurance_policies ADD COLUMN is_family_floater INTEGER DEFAULT 0').run();
    }
    if (!colNames.includes('covered_member_ids')) {
      db.prepare('ALTER TABLE insurance_policies ADD COLUMN covered_member_ids TEXT').run();
    }
  },
  down: (db: Database.Database) => {
    // SQLite does not support dropping columns cleanly in older versions
  }
};
