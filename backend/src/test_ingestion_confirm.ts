import * as fs from 'fs';
import * as path from 'path';
import { parseZerodhaHoldingsStatement } from './services/excelParser';
import { db } from './db';
import { syncStocks } from './services/marketSync';

async function runFullIngestionTest() {
  const filePath = path.resolve(__dirname, '../../data/holdings-YZ6485.xlsx');
  console.log('Running End-to-End Excel Ingestion Integration Test...');
  console.log('Loading file from:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    process.exit(1);
  }
  
  const buffer = fs.readFileSync(filePath);
  const parseResult = parseZerodhaHoldingsStatement(buffer);
  
  console.log(`Parsed ${parseResult.transactions.length} holdings.`);
  
  let assetsCreated = 0;
  let transactionsImported = 0;
  let duplicatesSkipped = 0;
  
  const processImport = db.transaction(() => {
    for (const tx of parseResult.transactions) {
      // Check if asset exists
      let assetId: number | null = null;
      let existing = null;
      
      if (tx.identifier) {
        existing = db.prepare('SELECT id FROM assets WHERE name = ? AND identifier = ? AND type = ?').get(tx.assetName, tx.identifier, tx.assetType) as { id: number } | undefined;
      }
      if (!existing) {
        existing = db.prepare('SELECT id FROM assets WHERE name = ? AND type = ?').get(tx.assetName, tx.assetType) as { id: number } | undefined;
      }
      
      if (existing) {
        assetId = existing.id;
      } else {
        const result = db.prepare(`
          INSERT INTO assets (name, type, category, identifier)
          VALUES (?, ?, ?, ?)
        `).run(tx.assetName, tx.assetType, tx.category, tx.identifier || null);
        assetId = Number(result.lastInsertRowid);
        assetsCreated++;
      }
      
      // Check duplicate transaction
      const duplicate = db.prepare(`
        SELECT id FROM transactions 
        WHERE asset_id = ? AND type = ? AND date = ? AND quantity = ? AND price = ? AND amount = ?
      `).get(assetId, tx.type, tx.date, tx.quantity, tx.price, tx.amount);
      
      if (duplicate) {
        duplicatesSkipped++;
        continue;
      }
      
      // Insert transaction
      db.prepare(`
        INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source)
        VALUES (?, ?, ?, ?, ?, ?, 'PDF_IMPORT')
      `).run(assetId, tx.type, tx.date, tx.quantity, tx.price, tx.amount);
      
      // Upsert price on transaction date
      db.prepare(`
        INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
        VALUES (?, ?, ?)
      `).run(assetId, tx.date, tx.price);
      
      transactionsImported++;
    }
  });
  
  processImport();
  
  console.log('\n--- Ingestion Metrics ---');
  console.log('Assets Created:', assetsCreated);
  console.log('Transactions Imported:', transactionsImported);
  console.log('Duplicates Skipped:', duplicatesSkipped);
  
  // Now sync stock prices from Yahoo Finance!
  console.log('\n--- Running Yahoo Finance Sync to update latest market prices... ---');
  const syncResult = await syncStocks();
  console.log('Sync Result:', syncResult.message);
  
  // Query and print all assets with their costs, current prices, and absolute returns!
  console.log('\n--- Current Database Portfolio Verification ---');
  const dbAssets = db.prepare(`
    SELECT a.id, a.name, a.identifier, a.category, 
           SUM(t.quantity) as total_qty, 
           SUM(t.amount) as total_cost,
           ap.price as latest_price
    FROM assets a
    JOIN transactions t ON a.id = t.asset_id
    LEFT JOIN (
      SELECT asset_id, price 
      FROM asset_prices 
      WHERE (asset_id, date) IN (
        SELECT asset_id, MAX(date) 
        FROM asset_prices 
        GROUP BY asset_id
      )
    ) ap ON a.id = ap.asset_id
    WHERE a.type = 'STOCK'
    GROUP BY a.id
  `).all() as any[];
  
  dbAssets.forEach((asset) => {
    const qty = asset.total_qty || 0;
    const cost = asset.total_cost || 0;
    const avgPrice = qty > 0 ? (cost / qty) : 0;
    const latestPrice = asset.latest_price || 0;
    const currentValue = qty * latestPrice;
    const returns = currentValue - cost;
    const returnsPct = cost > 0 ? ((returns / cost) * 100) : 0;
    
    console.log(`- ${asset.name} (${asset.identifier}) [${asset.category}]:`);
    console.log(`  Qty: ${qty} | Avg Buy Price: Rs. ${avgPrice.toFixed(2)} | Total Cost: Rs. ${cost.toFixed(2)}`);
    console.log(`  Latest Market Price: Rs. ${latestPrice.toFixed(2)} | Current Value: Rs. ${currentValue.toFixed(2)}`);
    console.log(`  Absolute Gain/Loss: Rs. ${returns.toFixed(2)} (${returnsPct.toFixed(2)}%)`);
  });
}

runFullIngestionTest();
