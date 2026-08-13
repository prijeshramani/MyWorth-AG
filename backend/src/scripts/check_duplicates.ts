import { db } from '../db';

console.log('=== ALL TRANSACTIONS IN DATABASE ===');
const allTxs = db.prepare(`
  SELECT t.id, t.asset_id, a.name as asset_name, a.type as asset_type, t.type as tx_type, t.date, t.quantity, t.price, t.amount, t.source, t.created_at
  FROM transactions t
  LEFT JOIN assets a ON t.asset_id = a.id
  ORDER BY t.id ASC
`).all();

console.table(allTxs);
