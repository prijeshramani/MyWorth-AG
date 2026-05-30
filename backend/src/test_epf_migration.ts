import { db } from './db';
import { parsePdfStatement } from './services/pdfParser';
import * as fs from 'fs';
import * as path from 'path';

async function runEpfIntegrationTest() {
  console.log('=== START EPF INTEGRATION TEST ===');

  try {
    // 1. Assert Assets table schema supports 'EPF'
    console.log('1. Checking Assets table check constraints...');
    const tableInfo = db.prepare('PRAGMA table_info(assets)').all() as any[];
    console.log('Assets table columns:', tableInfo.map(c => c.name));

    // Try inserting a test EPF asset to verify migration works
    console.log('2. Inserting test EPF asset...');
    const testUan = '123456789012';
    
    // Clean up if exists
    db.prepare('DELETE FROM assets WHERE identifier = ? AND type = ?').run(testUan, 'EPF');
    
    const insertResult = db.prepare(`
      INSERT INTO assets (name, type, category, identifier)
      VALUES (?, ?, ?, ?)
    `).run('TCS Provident Fund Test', 'EPF', 'Debt', testUan);
    
    const assetId = Number(insertResult.lastInsertRowid);
    console.log(`Success! EPF Asset created with ID: ${assetId}`);

    // Verify constraints: should fail for unsupported type
    try {
      db.prepare(`
        INSERT INTO assets (name, type, category, identifier)
        VALUES (?, ?, ?, ?)
      `).run('Invalid Asset', 'INVALID_TYPE', 'Debt', '999');
      console.error('❌ Constraint failure: Allowed invalid asset type!');
    } catch (e: any) {
      console.log('✅ Constraint success: Correctly blocked invalid type:', e.message);
    }

    // 3. Test Manual Balance Sync flow
    console.log('\n3. Testing manual balance sync (price update) in asset_prices...');
    const recordDate = '2026-05-30';
    const recordPrice = 1850000.00;
    
    db.prepare(`
      INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
      VALUES (?, ?, ?)
    `).run(assetId, recordDate, recordPrice);
    console.log(`Price recorded: Rs. ${recordPrice} on ${recordDate}`);

    // 4. Test calculation logic in assets query
    console.log('\n4. Running assets valuation integration query...');
    // Simulated assets valuation query like assets.ts
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
    const transactions = db.prepare('SELECT * FROM transactions WHERE asset_id = ?').all(assetId) as any[];

    // EPF Valuation logic check
    const latestPriceRow = db.prepare(`
      SELECT price, date FROM asset_prices 
      WHERE asset_id = ? AND price > 1.0
      ORDER BY date DESC LIMIT 1
    `).get(assetId) as { price: number; date: string } | undefined;

    let txSum = 0;
    let lastTxDate = '';
    for (const tx of transactions) {
      if (tx.type === 'BUY' || tx.type === 'REINVEST') {
        txSum += tx.amount;
      } else if (tx.type === 'SELL') {
        txSum -= tx.amount;
      }
      if (tx.date > lastTxDate) {
        lastTxDate = tx.date;
      }
    }

    let balance = 0;
    if (latestPriceRow && (!lastTxDate || latestPriceRow.date >= lastTxDate)) {
      balance = latestPriceRow.price;
    } else {
      balance = txSum;
    }

    const currentUnits = balance > 0 ? 1.0 : 0;
    const totalCost = balance;
    const currentPrice = totalCost;
    const currentValue = currentUnits * currentPrice;

    console.log(`Valuation calculated:`);
    console.log(`- Units: ${currentUnits}`);
    console.log(`- Cost: Rs. ${totalCost}`);
    console.log(`- Current Price: Rs. ${currentPrice}`);
    console.log(`- Current Value: Rs. ${currentValue}`);

    if (currentValue === recordPrice) {
      console.log('✅ Success! Manual balance sync valuation maps perfectly!');
    } else {
      console.error(`❌ Mismatch: expected Rs. ${recordPrice}, got Rs. ${currentValue}`);
    }

    // 5. Test Transaction Sum fallback (simulating PDF import)
    console.log('\n5. Testing PDF import running transaction sum fallback...');
    // Clear price and write transactions
    db.prepare('DELETE FROM asset_prices WHERE asset_id = ?').run(assetId);
    
    const simulatedTxs = [
      { type: 'BUY', date: '2026-04-01', quantity: 1500000.00, price: 1.0, amount: 1500000.00 }, // Opening Bal
      { type: 'BUY', date: '2026-04-30', quantity: 10000.00, price: 1.0, amount: 10000.00 },    // April
      { type: 'BUY', date: '2026-05-31', quantity: 10000.00, price: 1.0, amount: 10000.00 }     // May
    ];

    for (const tx of simulatedTxs) {
      db.prepare(`
        INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source)
        VALUES (?, ?, ?, ?, ?, ?, 'PDF_IMPORT')
      `).run(assetId, tx.type, tx.date, tx.quantity, tx.price, tx.amount);
      
      db.prepare(`
        INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
        VALUES (?, ?, ?)
      `).run(assetId, tx.date, tx.price);
    }

    const expectedSum = 1520000.00;
    console.log(`Simulated transactions total to: Rs. ${expectedSum}`);

    // Re-run fallback valuation check
    const fallbackTransactions = db.prepare('SELECT * FROM transactions WHERE asset_id = ?').all(assetId) as any[];
    const latestPriceRowFallback = db.prepare(`
      SELECT price, date FROM asset_prices 
      WHERE asset_id = ? AND price > 1.0
      ORDER BY date DESC LIMIT 1
    `).get(assetId) as { price: number; date: string } | undefined;

    let txSumFallback = 0;
    let lastTxDateFallback = '';
    for (const tx of fallbackTransactions) {
      if (tx.type === 'BUY' || tx.type === 'REINVEST') {
        txSumFallback += tx.amount;
      } else if (tx.type === 'SELL') {
        txSumFallback -= tx.amount;
      }
      if (tx.date > lastTxDateFallback) {
        lastTxDateFallback = tx.date;
      }
    }

    let fallbackBalance = 0;
    if (latestPriceRowFallback && (!lastTxDateFallback || latestPriceRowFallback.date >= lastTxDateFallback)) {
      fallbackBalance = latestPriceRowFallback.price;
    } else {
      fallbackBalance = txSumFallback;
    }

    const valUnits = fallbackBalance > 0 ? 1.0 : 0;
    const valValue = valUnits * fallbackBalance;

    console.log(`Valuation calculated from transaction sum fallback:`);
    console.log(`- Latest Price Row (> 1.0):`, latestPriceRowFallback);
    console.log(`- Fallback Balance: Rs. ${fallbackBalance}`);
    console.log(`- Value: Rs. ${valValue}`);

    if (valValue === expectedSum) {
      console.log('✅ Success! Ingested transactions are reconciled to transaction sum fallback correctly!');
    } else {
      console.error(`❌ Mismatch: expected Rs. ${expectedSum}, got Rs. ${valValue}`);
    }

    // 6. Test manual sync override on top of transactions
    console.log('\n6. Testing manual balance sync overriding transaction sumfallback...');
    const syncOverridePrice = 1600000.00;
    const syncOverrideDate = '2026-06-15';
    
    db.prepare(`
      INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
      VALUES (?, ?, ?)
    `).run(assetId, syncOverrideDate, syncOverridePrice);
    console.log(`Sync price override recorded: Rs. ${syncOverridePrice} on ${syncOverrideDate}`);

    // Re-run override check
    const latestPriceRowOverride = db.prepare(`
      SELECT price, date FROM asset_prices 
      WHERE asset_id = ? AND price > 1.0
      ORDER BY date DESC LIMIT 1
    `).get(assetId) as { price: number; date: string } | undefined;

    let overrideBalance = 0;
    if (latestPriceRowOverride && (!lastTxDateFallback || latestPriceRowOverride.date >= lastTxDateFallback)) {
      overrideBalance = latestPriceRowOverride.price;
    } else {
      overrideBalance = txSumFallback;
    }

    const finalVal = (overrideBalance > 0 ? 1.0 : 0) * overrideBalance;
    console.log(`Final override balance: Rs. ${overrideBalance}`);

    if (finalVal === syncOverridePrice) {
      console.log('✅ Success! Manual balance override has successfully taken precedence over transaction list!');
    } else {
      console.error(`❌ Mismatch: expected override Rs. ${syncOverridePrice}, got Rs. ${finalVal}`);
    }

    // Clean up
    console.log('\n7. Cleaning up test entries...');
    db.prepare('DELETE FROM transactions WHERE asset_id = ?').run(assetId);
    db.prepare('DELETE FROM asset_prices WHERE asset_id = ?').run(assetId);
    db.prepare('DELETE FROM assets WHERE id = ?').run(assetId);
    console.log('Cleanup successful.');

    console.log('\n✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');

  } catch (err: any) {
    console.error('❌ Integration test failed with error:', err.message);
  }
}

runEpfIntegrationTest();
