import { syncBankInsightsTransactions, getBankInsightsPath } from './services/bankinsightsService';
import { db } from './db';

async function runBankInsightsSyncTest() {
  console.log('====================================================');
  console.log('   MyWorth BankInsights Sync Integration Test       ');
  console.log('====================================================');
  
  const dbPath = getBankInsightsPath();
  console.log(`Database target path: ${dbPath}`);
  
  try {
    const start = Date.now();
    const result = await syncBankInsightsTransactions();
    const elapsed = Date.now() - start;
    
    console.log('\n--- Sync Process Completed Successfully ---');
    console.log(`Imported Transactions : ${result.importedCount}`);
    console.log(`Duplicates Skipped    : ${result.duplicatesSkipped}`);
    console.log(`Current Balance       : Rs. ${result.latestBalance.toLocaleString()}`);
    console.log(`Execution Time        : ${elapsed} ms`);
    
    // Query asset details from MyWorth DB to verify
    const assetRow = db.prepare("SELECT * FROM assets WHERE type='BANK_ACCOUNT'").get() as any;
    console.log('\n--- Ingested Asset Verification ---');
    console.log(`Asset Name    : ${assetRow.name}`);
    console.log(`Asset Type    : ${assetRow.type}`);
    console.log(`Category      : ${assetRow.category}`);
    console.log(`Identifier    : ${assetRow.identifier}`);
    
    // Query recent price from MyWorth DB to verify
    const latestPrice = db.prepare("SELECT price, date FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1").get(assetRow.id) as any;
    console.log(`Latest Balance: Rs. ${latestPrice.price.toLocaleString()} as of ${latestPrice.date}`);
    
    // Assertions
    if (!assetRow || assetRow.name !== 'BankInsights Account') {
      throw new Error('Verification Failed: BankInsights asset not correctly mapped!');
    }
    
    console.log('\n✅ BankInsights Sync Integration assertions passed successfully!');
    console.log('====================================================');
  } catch (err: any) {
    console.error('\n❌ Integration Test Failure:', err.message);
    process.exit(1);
  }
}

runBankInsightsSyncTest();
