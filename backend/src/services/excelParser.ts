import * as XLSX from 'xlsx';
import { ParsedTransaction } from './pdfParser';

export function parseZerodhaHoldingsStatement(excelBuffer: Buffer): { statementType: string; transactions: ParsedTransaction[]; rawText: string } {
  const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  const transactions: ParsedTransaction[] = [];
  
  if (sheetData.length === 0) {
    throw new Error('Zerodha Holdings spreadsheet is empty.');
  }

  // 1. Extract Statement Date
  let statementDate = new Date().toISOString().split('T')[0];
  for (const row of sheetData) {
    const rowStr = row.join(' ');
    const match = rowStr.match(/as on (\d{4}-\d{2}-\d{2})/i);
    if (match) {
      statementDate = match[1];
      break;
    }
  }

  console.log('Extracted statement date:', statementDate);

  // 2. Identify Header Row Index
  const headerIdx = sheetData.findIndex(row => 
    row.some(c => String(c).toLowerCase().includes('symbol')) &&
    row.some(c => String(c).toLowerCase().includes('isin')) &&
    row.some(c => String(c).toLowerCase().includes('average price'))
  );

  if (headerIdx === -1) {
    throw new Error('Could not identify holdings column headers. Make sure the spreadsheet contains Symbol, ISIN, and Average Price columns.');
  }

  // 3. Map Columns Dynamically
  const headers = sheetData[headerIdx].map(h => String(h).trim().toLowerCase());
  const symbolCol = headers.findIndex(h => h.includes('symbol'));
  const isinCol = headers.findIndex(h => h.includes('isin'));
  const qtyCol = headers.findIndex(h => h.includes('quantity available') || h.includes('quantity') || h.includes('qty'));
  const avgPriceCol = headers.findIndex(h => h.includes('average price') || h.includes('avg price') || h.includes('cost'));

  console.log(`Mapped Excel Columns: symbol=${symbolCol}, isin=${isinCol}, quantity=${qtyCol}, average_price=${avgPriceCol}`);

  // 4. Parse Stock Holding Rows
  for (let i = headerIdx + 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (row.length <= Math.max(symbolCol, qtyCol, avgPriceCol)) continue;
    
    const symbol = String(row[symbolCol] || '').trim().toUpperCase();
    const isin = String(row[isinCol] || '').trim().toUpperCase();
    const qtyVal = parseFloat(String(row[qtyCol]).replace(/,/g, ''));
    const avgPriceVal = parseFloat(String(row[avgPriceCol]).replace(/,/g, ''));
    
    if (!symbol || isNaN(qtyVal) || qtyVal <= 0 || isNaN(avgPriceVal) || avgPriceVal <= 0) continue;
    
    // Add Yahoo suffix for standard tickers (excluding SGB or custom names)
    let fullTicker = symbol;
    if (!symbol.includes('.') && !symbol.includes('-')) {
      fullTicker = `${symbol}.NS`;
    }
    
    const category = symbol.startsWith('SGB') ? 'Alternative' : 'Equity';

    transactions.push({
      assetName: symbol,
      assetType: 'STOCK',
      category,
      identifier: fullTicker,
      type: 'BUY',
      date: statementDate,
      quantity: qtyVal,
      price: avgPriceVal,
      amount: qtyVal * avgPriceVal
    });
  }

  console.log(`Parsed ${transactions.length} holdings from Zerodha Excel sheet.`);

  return {
    statementType: 'ZERODHA_HOLDINGS',
    transactions,
    rawText: `Zerodha Holdings Sheet - As on ${statementDate}\nTotal Holdings: ${transactions.length}`
  };
}
