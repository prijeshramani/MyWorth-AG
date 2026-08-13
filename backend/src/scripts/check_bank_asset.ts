import { db } from '../db';

console.log('=== BANKINSIGHTS ACCOUNT ASSET & FAMILY MEMBERS ===');

const familyMembers = db.prepare('SELECT id, name, relationship FROM family_members').all();
console.log('Family Members in DB:', familyMembers);

const bankAssets = db.prepare(`
  SELECT a.id, a.name, a.type, a.family_member_id, fm.name as member_name
  FROM assets a
  LEFT JOIN family_members fm ON a.family_member_id = fm.id
  WHERE a.type = 'BANK_ACCOUNT' OR a.identifier = 'BANK_INSIGHTS'
`).all();

console.log('Bank Assets in DB:', bankAssets);
