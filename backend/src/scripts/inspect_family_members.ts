import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../../data/myworth.db');
const db = new Database(dbPath);

console.log('--- FAMILIES ---');
console.table(db.prepare("SELECT * FROM families").all());

console.log('\n--- FAMILY MEMBERS ---');
console.table(db.prepare("SELECT * FROM family_members").all());

console.log('\n--- ASSETS BY FAMILY MEMBER ---');
console.table(db.prepare(`
  SELECT fm.id as member_id, fm.family_id, fm.name as member_name, COUNT(a.id) as asset_count 
  FROM family_members fm 
  LEFT JOIN assets a ON a.family_member_id = fm.id 
  GROUP BY fm.id
`).all());
