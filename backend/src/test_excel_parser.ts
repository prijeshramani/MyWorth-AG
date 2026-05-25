import * as fs from 'fs';
import * as path from 'path';
import { parseZerodhaHoldingsStatement } from './services/excelParser';

function testExcelParser() {
  const filePath = path.resolve(__dirname, '../../data/holdings-YZ6485.xlsx');
  console.log('Testing Zerodha Excel Holdings parser with:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('Holdings file not found!');
    process.exit(1);
  }
  
  const buffer = fs.readFileSync(filePath);
  const result = parseZerodhaHoldingsStatement(buffer);
  
  console.log('\n--- Parse Result ---');
  console.log('Statement Type:', result.statementType);
  console.log('Total Transactions:', result.transactions.length);
  
  console.log('\n--- Extracted Holdings Detail ---');
  result.transactions.forEach((tx, i) => {
    console.log(`[${i + 1}] Ticker: ${tx.identifier} | Name: ${tx.assetName} | Qty: ${tx.quantity} | Avg Price: ${tx.price} | Category: ${tx.category}`);
  });
}

testExcelParser();
