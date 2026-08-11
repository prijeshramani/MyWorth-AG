import { db } from '../db';

function main() {
  const familyId = 6;
  console.log('--- BANK ACCOUNTS & ASSETS IN DB FOR FAMILY ID 6 ---');

  const assets = db.prepare(`
    SELECT a.id, a.name, a.type, a.category, a.identifier, a.family_member_id, fm.name as member_name
    FROM assets a
    LEFT JOIN family_members fm ON a.family_member_id = fm.id
    WHERE fm.family_id = ? OR a.family_member_id IS NULL
  `).all(familyId) as any[];

  console.table(assets.filter((a: any) => a.type === 'BANK_ACCOUNT' || a.category === 'Debt' || a.type === 'EPF' || a.type === 'FIXED_DEPOSIT'));

  const accounts = db.prepare(`
    SELECT acc.*, e.name as entity_name, fm.name as member_name
    FROM accounts acc
    LEFT JOIN entities e ON acc.entity_id = e.id
    LEFT JOIN family_members fm ON e.family_member_id = fm.id
    WHERE acc.deleted_at IS NULL
  `).all() as any[];

  console.log('\n--- 3-TIER ACCOUNTS TABLE ---');
  console.table(accounts);
}

main();
