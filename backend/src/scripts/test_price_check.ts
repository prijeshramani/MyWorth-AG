import { db } from '../db';
import { syncAllAssets } from '../services/marketSync';

async function main() {
  console.log('--- STOCKS IN DB ---');
  const stocks = db.prepare("SELECT id, name, identifier, type, category FROM assets WHERE type = 'STOCK'").all();
  console.table(stocks);

  for (const s of stocks as any[]) {
    const latestPrice = db.prepare("SELECT * FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1").get(s.id);
    console.log(`Stock [${s.id}] ${s.name} (${s.identifier}) -> Latest Price:`, latestPrice);
  }

  console.log('\n--- TRIGGERING MARKET SYNC ---');
  const results = await syncAllAssets();
  console.log('Sync Results:', JSON.stringify(results, null, 2));

  console.log('\n--- POST SYNC PRICES FOR STOCKS ---');
  for (const s of stocks as any[]) {
    const latestPrice = db.prepare("SELECT * FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1").get(s.id);
    console.log(`Stock [${s.id}] ${s.name} (${s.identifier}) -> Updated Price:`, latestPrice);
  }
}

main().catch(console.error);
