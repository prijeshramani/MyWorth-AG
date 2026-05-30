import * as fs from 'fs';
import * as path from 'path';

function parseVal(str: string): number {
  return parseFloat(str.replace(/,/g, '')) || 0;
}

async function testEpfParser() {
  console.log('--- TCS EPF PARSER TEST ---');
  const rawTextPath = path.resolve(__dirname, '../../scratch/tcs_epf_raw.txt');
  
  if (!fs.existsSync(rawTextPath)) {
    console.error(`Error: File does not exist at: ${rawTextPath}`);
    return;
  }

  const rawText = fs.readFileSync(rawTextPath, 'utf8');
  console.log(`Loaded raw text length: ${rawText.length} characters`);

  // 1. Detect UAN
  const uanMatch = rawText.match(/UAN\s+PF\s+Account\s+No\s+Member\s+ID\s*(\d{12})/i);
  const uan = uanMatch ? uanMatch[1] : '100432083045';
  console.log(`UAN parsed: ${uan}`);

  // 2. Parse Financial Year
  const fyMatch = rawText.match(/PF\s+Statement\s+for\s+the\s+Financial\s+year\s*(\d{4})\s*(\d{4})/i);
  let startYear = 2025;
  if (fyMatch) {
    startYear = parseInt(fyMatch[1]);
    console.log(`Financial Year parsed: ${startYear}-${fyMatch[2]}`);
  }

  const transactions: any[] = [];

  // 3. Parse Opening Balance
  const opnBalMatch = rawText.match(/OPN\s*-\s*BAL\(A\)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/i);
  let opnBal = 0;
  if (opnBalMatch) {
    opnBal = parseVal(opnBalMatch[1]) + parseVal(opnBalMatch[2]) + parseVal(opnBalMatch[3]) + parseVal(opnBalMatch[4]) + parseVal(opnBalMatch[5]) + parseVal(opnBalMatch[6]);
    console.log(`Opening Balance parsed: Rs. ${opnBal.toFixed(2)}`);
    
    transactions.push({
      assetName: 'TCS Employees Provident Fund',
      type: 'BUY',
      date: `${startYear}-04-01`,
      quantity: opnBal,
      price: 1.0,
      amount: opnBal
    });
  }

  // 4. Parse Monthly Contributions
  const monthRegex = /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*-\s*(\d{4})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/gi;
  let match;
  const monthsMap: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
  };
  const monthEnds: Record<string, string> = {
    '01': '31', '02': '28', '03': '31', '04': '30', '05': '31', '06': '30', '07': '31', '08': '31', '09': '30', '10': '31', '11': '30', '12': '31'
  };

  console.log('\n--- Parsing Monthly Contributions ---');
  while ((match = monthRegex.exec(rawText)) !== null) {
    const monthWord = match[1].toUpperCase();
    const year = match[2];
    const monthNum = monthsMap[monthWord];
    const day = monthEnds[monthNum] || '30';
    const txDate = `${year}-${monthNum}-${day}`;

    const monthVal = parseVal(match[3]) + parseVal(match[4]) + parseVal(match[5]) + parseVal(match[6]) + parseVal(match[7]) + parseVal(match[8]);
    
    console.log(`Month: ${monthWord}-${year} | Date: ${txDate} | Amount: Rs. ${monthVal.toFixed(2)}`);
    
    transactions.push({
      assetName: 'TCS Employees Provident Fund',
      type: 'BUY',
      date: txDate,
      quantity: monthVal,
      price: 1.0,
      amount: monthVal
    });
  }

  // 5. Parse Credited Interest
  const interestMatch = rawText.match(/Interest\s*\(A\)\s*\*?\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/i);
  let interestVal = 0;
  if (interestMatch) {
    interestVal = parseVal(interestMatch[1]) + parseVal(interestMatch[2]) + parseVal(interestMatch[3]) + parseVal(interestMatch[4]) + parseVal(interestMatch[5]) + parseVal(interestMatch[6]);
    console.log(`\nCredited Interest parsed: Rs. ${interestVal.toFixed(2)}`);
    
    transactions.push({
      assetName: 'TCS Employees Provident Fund',
      type: 'BUY',
      date: `${startYear + 1}-03-31`,
      quantity: interestVal,
      price: 1.0,
      amount: interestVal
    });
  }

  // Calculate Cumulative balance
  const cumulative = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  console.log(`\n--- Verification Summary ---`);
  console.log(`Total transactions parsed: ${transactions.length}`);
  console.log(`Aggregated Closing Balance: Rs. ${cumulative.toFixed(2)}`);
  
  const expectedClosingBalance = 1741353.00;
  console.log(`Expected Closing Balance (from Page 2): Rs. ${expectedClosingBalance.toFixed(2)}`);
  
  if (Math.abs(cumulative - expectedClosingBalance) < 0.01) {
    console.log('✅ Success! Mapped transactions match the statement closing balance down to the Rupee!');
  } else {
    console.error(`❌ Mismatch of Rs. ${(cumulative - expectedClosingBalance).toFixed(2)}`);
  }
}

testEpfParser();
