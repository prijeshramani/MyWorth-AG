import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const backupsDir = path.resolve(__dirname, '../../../data/backups');
const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.db'));
console.log(`Searching ${files.length} backup files for Prijesh / Dhvani / Ramani...`);

for (const file of files) {
  const fullPath = path.join(backupsDir, file);
  try {
    const db = new Database(fullPath, { readonly: true });
    
    // Check family_members table
    const fm = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='family_members'").get();
    if (fm) {
      const members = db.prepare("SELECT * FROM family_members WHERE name LIKE '%Ramani%' OR name LIKE '%Prijesh%' OR name LIKE '%Dhvani%'").all() as any[];
      if (members.length > 0) {
        console.log(`\n🎉 FOUND RAMANI MEMBERS IN BACKUP: ${file}`);
        console.table(members);
      }
    }

    // Check assets table
    const ast = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='assets'").get();
    if (ast) {
      const assets = db.prepare("SELECT * FROM assets WHERE name LIKE '%Ramani%' OR name LIKE '%Prijesh%' OR name LIKE '%Dhvani%'").all() as any[];
      if (assets.length > 0) {
        console.log(`\n🎉 FOUND RAMANI ASSETS IN BACKUP: ${file}`);
        console.table(assets);
      }
    }
  } catch (err) {
    // ignore corrupt
  }
}
