import { db } from '../db';

console.log('=== CLEANING DUPLICATED STOCK HOLDINGS TRANSACTIONS ===');

// Get all stock assets
const stockAssets = db.prepare(`
  SELECT id, name FROM assets WHERE type = 'STOCK'
`).all() as { id: number; name: string }[];

let totalCleaned = 0;

db.transaction(() => {
  for (const asset of stockAssets) {
    const txs = db.prepare(`
      SELECT id, date, quantity, price, amount, created_at 
      FROM transactions 
      WHERE asset_id = ? AND type = 'BUY'
      ORDER BY id DESC
    `).all(asset.id) as { id: number; date: string; quantity: number; price: number; amount: number; created_at: string }[];

    if (txs.length > 1) {
      console.log(`Asset "${asset.name}" has ${txs.length} BUY transactions:`);
      txs.forEach((t, i) => {
        console.log(`  ${i === 0 ? '[KEEP LATEST]' : '[DELETE DUP]'} ID: ${t.id} | Date: ${t.date} | Qty: ${t.quantity} | Price: ${t.price} | Amount: ${t.amount}`);
      });

      // Keep index 0 (latest holdings snapshot), delete older baseline transactions
      const toDelete = txs.slice(1);
      for (const dup of toDelete) {
        db.prepare('DELETE FROM transactions WHERE id = ?').run(dup.id);
        totalCleaned++;
      }
    }
  }
})();

console.log(`\nSuccessfully cleaned ${totalCleaned} duplicate holdings transaction(s).`);
