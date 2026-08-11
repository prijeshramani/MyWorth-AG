import * as XLSX from 'xlsx';
import { ParsedTransaction } from './pdfParser';
import { getUsdInrRate } from './indmoneyService';

// Helper to normalize date strings to YYYY-MM-DD
function parseDateStr(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim();
  
  const monthMap: Record<string, string> = { 
    jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', 
    jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' 
  };

  // Format: "22 Jan 2022, 12:09 AM" or "22 Jan 2022"
  const dmyMatch = str.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = monthMap[dmyMatch[2].toLowerCase()] || '01';
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Format: YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
  }
  
  // Format: DD/MM/YYYY or DD-MM-YYYY
  const dmySlash = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmySlash) {
    return `${dmySlash[3]}-${dmySlash[2].padStart(2, '0')}-${dmySlash[1].padStart(2, '0')}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

// 1. Zerodha Holdings Parser
export function parseZerodhaHoldingsStatement(excelBuffer: Buffer): { statementType: string; transactions: ParsedTransaction[]; rawText: string } {
  const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  const transactions: ParsedTransaction[] = [];
  
  if (sheetData.length === 0) {
    throw new Error('Zerodha Holdings spreadsheet is empty.');
  }

  let statementDate = new Date().toISOString().split('T')[0];
  for (const row of sheetData) {
    const rowStr = row.join(' ');
    const match = rowStr.match(/as on (\d{4}-\d{2}-\d{2})/i);
    if (match) {
      statementDate = match[1];
      break;
    }
  }

  const headerIdx = sheetData.findIndex(row => 
    row.some(c => String(c).toLowerCase().includes('symbol')) &&
    row.some(c => String(c).toLowerCase().includes('isin')) &&
    row.some(c => String(c).toLowerCase().includes('average price'))
  );

  if (headerIdx === -1) {
    throw new Error('Could not identify holdings column headers. Make sure the spreadsheet contains Symbol, ISIN, and Average Price columns.');
  }

  const headers = sheetData[headerIdx].map(h => String(h).trim().toLowerCase());
  const symbolCol = headers.findIndex(h => h.includes('symbol'));
  const isinCol = headers.findIndex(h => h.includes('isin'));
  const qtyCol = headers.findIndex(h => h.includes('quantity available') || h.includes('quantity') || h.includes('qty'));
  const avgPriceCol = headers.findIndex(h => h.includes('average price') || h.includes('avg price') || h.includes('cost'));

  for (let i = headerIdx + 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (row.length <= Math.max(symbolCol, qtyCol, avgPriceCol)) continue;
    
    const symbol = String(row[symbolCol] || '').trim().toUpperCase();
    const isin = String(row[isinCol] || '').trim().toUpperCase();
    const qtyVal = parseFloat(String(row[qtyCol]).replace(/,/g, ''));
    const avgPriceVal = parseFloat(String(row[avgPriceCol]).replace(/,/g, ''));
    
    if (!symbol || isNaN(qtyVal) || qtyVal <= 0 || isNaN(avgPriceVal) || avgPriceVal <= 0) continue;
    
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

  return {
    statementType: 'ZERODHA_HOLDINGS',
    transactions,
    rawText: `Zerodha Holdings Sheet - As on ${statementDate}\nTotal Holdings: ${transactions.length}`
  };
}

// 2. INDmoney US Stocks Order Book Parser (IND-ORDER_REPORT*.xls / .xlsx)
export async function parseIndMoneyOrderBookStatement(excelBuffer: Buffer): Promise<{ statementType: string; transactions: ParsedTransaction[]; rawText: string }> {
  const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find(s => s.toUpperCase() === 'ORDER_BOOK') || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  if (sheetData.length === 0) {
    throw new Error('INDmoney Order Book spreadsheet is empty.');
  }

  const headerIdx = sheetData.findIndex(row => {
    const rowJoined = row.map(c => String(c).toLowerCase()).join(' ');
    return rowJoined.includes('stock symbol') || (rowJoined.includes('stock name') && rowJoined.includes('quantity'));
  });

  if (headerIdx === -1) {
    throw new Error('Could not identify INDmoney Order Book headers (Stock Symbol, Quantity, Price).');
  }

  const headers = sheetData[headerIdx].map(h => String(h).trim().toLowerCase());
  const nameCol = headers.findIndex(h => h.includes('stock name') || h.includes('name'));
  const symbolCol = headers.findIndex(h => h.includes('stock symbol') || h.includes('symbol') || h.includes('ticker'));
  const typeCol = headers.findIndex(h => h.includes('transaction type') || h.includes('type'));
  const qtyCol = headers.findIndex(h => h.includes('quantity') || h.includes('qty'));
  const priceCol = headers.findIndex(h => h.includes('price') || h.includes('rate'));
  const dateCol = headers.findIndex(h => h.includes('order execution time') || h.includes('order placed time') || h.includes('time') || h.includes('date'));

  const usdInrRate = await getUsdInrRate();
  const transactions: ParsedTransaction[] = [];

  for (let i = headerIdx + 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (row.length <= Math.max(symbolCol !== -1 ? symbolCol : nameCol, qtyCol, priceCol)) continue;

    const rawSymbol = String((symbolCol !== -1 ? row[symbolCol] : '') || row[nameCol] || '').trim().toUpperCase();
    if (!rawSymbol) continue;

    let symbol = rawSymbol;
    if (symbol.includes(' ')) {
      const match = rawSymbol.match(/\b([A-Z]{1,5})\b/);
      if (match) symbol = match[1];
    }

    const rawType = String(row[typeCol] || 'BUY').trim().toUpperCase();
    const type: 'BUY' | 'SELL' = rawType.includes('SELL') ? 'SELL' : 'BUY';
    const quantity = parseFloat(String(row[qtyCol]).replace(/,/g, ''));
    const priceUsd = parseFloat(String(row[priceCol]).replace(/,/g, ''));
    const date = parseDateStr(row[dateCol]);

    if (isNaN(quantity) || quantity <= 0 || isNaN(priceUsd) || priceUsd <= 0) continue;

    const priceInr = priceUsd * usdInrRate;

    transactions.push({
      assetName: String(row[nameCol] || symbol).trim(),
      assetType: 'STOCK',
      category: 'Equity',
      identifier: symbol,
      type,
      date,
      quantity,
      price: priceInr,
      currentPrice: priceInr,
      amount: quantity * priceInr
    });
  }

  console.log(`Parsed ${transactions.length} transactions from INDmoney Order Book statement.`);

  return {
    statementType: 'INDMONEY_US_STOCKS_HOLDINGS',
    transactions,
    rawText: `INDmoney US Stocks Order Book - Total Transactions: ${transactions.length}`
  };
}

// 3. INDmoney Consolidated Tax Report Parser (consolidated_tax_report*.xlsx)
export async function parseIndMoneyTaxReportStatement(excelBuffer: Buffer): Promise<{ statementType: string; transactions: ParsedTransaction[]; rawText: string }> {
  const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
  const usdInrRate = await getUsdInrRate();
  const transactions: ParsedTransaction[] = [];

  // Parse STCG / LTCG sheets
  ['STCG', 'LTCG'].forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    let inUsStocksSection = false;
    let headerRowIdx = -1;
    let symbolCol = -1, buyDateCol = -1, sellDateCol = -1, qtyCol = -1, buyPriceCol = -1, rateCol = -1;

    for (let i = 0; i < data.length; i++) {
      const rowStr = data[i].map(c => String(c).trim()).join(' ');
      if (rowStr.toLowerCase().includes('us stocks') || (rowStr.toLowerCase().includes('name of stock') && rowStr.toLowerCase().includes('in us$'))) {
        inUsStocksSection = true;
      }

      if (inUsStocksSection && data[i].some(c => String(c).toLowerCase().includes('name of stock'))) {
        const headers = data[i].map(h => String(h).trim().toLowerCase());
        symbolCol = headers.findIndex(h => h.includes('name of stock') || h.includes('symbol'));
        buyDateCol = headers.findIndex(h => h.includes('purchase date'));
        sellDateCol = headers.findIndex(h => h.includes('sell date') || h.includes('redemption date'));
        qtyCol = headers.findIndex(h => h.includes('qty') || h.includes('units'));
        buyPriceCol = headers.findIndex(h => h.includes('per unit') || h.includes('price'));
        rateCol = headers.findIndex(h => h.includes('exchange rate'));
        headerRowIdx = i;
        continue;
      }

      if (headerRowIdx !== -1 && i > headerRowIdx) {
        const row = data[i];
        const stockName = String(row[symbolCol] || '').trim();
        if (!stockName || stockName.toLowerCase().includes('total') || stockName.toLowerCase().includes('disclaimer')) {
          if (stockName.toLowerCase().includes('total')) {
            headerRowIdx = -1;
          }
          continue;
        }

        let symbol = stockName.toUpperCase();
        if (symbol.includes('NVIDIA')) symbol = 'NVDA';
        else if (symbol.includes('APPLE')) symbol = 'AAPL';
        else if (symbol.includes('AMAZON')) symbol = 'AMZN';
        else if (symbol.includes('MICROSOFT')) symbol = 'MSFT';
        else if (symbol.includes('TESLA')) symbol = 'TSLA';
        else if (symbol.includes('META')) symbol = 'META';
        else if (symbol.includes('ALPHABET') || symbol.includes('GOOGLE')) symbol = 'GOOGL';
        else {
          const match = symbol.match(/\b([A-Z]{1,5})\b/);
          if (match) symbol = match[1];
        }

        const sellDate = parseDateStr(row[sellDateCol]);
        const qty = parseFloat(String(row[qtyCol]).replace(/,/g, ''));
        const priceUsd = parseFloat(String(row[buyPriceCol]).replace(/,/g, ''));
        const rate = parseFloat(String(row[rateCol]).replace(/,/g, '')) || usdInrRate;

        if (!isNaN(qty) && qty > 0) {
          const priceInr = (!isNaN(priceUsd) && priceUsd > 0) ? priceUsd * rate : 100 * rate;
          transactions.push({
            assetName: stockName,
            assetType: 'STOCK',
            category: 'Equity',
            identifier: symbol,
            type: 'SELL',
            date: sellDate,
            quantity: qty,
            price: priceInr,
            currentPrice: priceInr,
            amount: qty * priceInr
          });
        }
      }
    }
  });

  // Parse Schedule FA for foreign equity holdings
  const faSheet = workbook.Sheets['Schedule FA'];
  if (faSheet) {
    const faData = XLSX.utils.sheet_to_json(faSheet, { header: 1, defval: '' }) as any[][];
    const faHeaderIdx = faData.findIndex(row => row.some(c => String(c).toLowerCase().includes('acquisition date')) || row.some(c => String(c).toLowerCase().includes('initial value')));

    if (faHeaderIdx !== -1) {
      const headers = faData[faHeaderIdx].map(h => String(h).trim().toLowerCase());
      const nameCol = headers.findIndex(h => h.includes('entity') || h.includes('institution') || h.includes('name'));
      const dateCol = headers.findIndex(h => h.includes('acquisition date') || h.includes('opening date') || h.includes('date'));
      const initialValCol = headers.findIndex(h => h.includes('initial value') || h.includes('peak balance') || h.includes('closing value'));

      for (let i = faHeaderIdx + 1; i < faData.length; i++) {
        const row = faData[i];
        const entityName = String(row[nameCol] || '').trim();
        if (!entityName || entityName.toLowerCase().includes('disclaimer') || entityName.toLowerCase().includes('total')) continue;

        let symbol = entityName.toUpperCase();
        if (symbol.includes('NVIDIA')) symbol = 'NVDA';
        else if (symbol.includes('APPLE')) symbol = 'AAPL';
        else if (symbol.includes('AMAZON')) symbol = 'AMZN';
        else if (symbol.includes('MICROSOFT')) symbol = 'MSFT';
        else if (symbol.includes('TESLA')) symbol = 'TSLA';
        else if (symbol.includes('META')) symbol = 'META';
        else if (symbol.includes('ALPHABET') || symbol.includes('GOOGLE')) symbol = 'GOOGL';
        else {
          const match = symbol.match(/\b([A-Z]{1,5})\b/);
          if (match) symbol = match[1];
        }

        const date = parseDateStr(row[dateCol]);
        const amountUsd = parseFloat(String(row[initialValCol]).replace(/,/g, ''));
        if (!isNaN(amountUsd) && amountUsd > 0) {
          transactions.push({
            assetName: entityName,
            assetType: 'STOCK',
            category: 'Equity',
            identifier: symbol,
            type: 'BUY',
            date,
            quantity: 1,
            price: amountUsd * usdInrRate,
            currentPrice: amountUsd * usdInrRate,
            amount: amountUsd * usdInrRate
          });
        }
      }
    }
  }

  console.log(`Parsed ${transactions.length} records from INDmoney Consolidated Tax Report.`);

  return {
    statementType: 'INDMONEY_US_STOCKS_HOLDINGS',
    transactions,
    rawText: `INDmoney Consolidated Tax Report - Total Extracted Records: ${transactions.length}`
  };
}

// 4. Main Unified Excel Statement Parser Dispatcher
export async function parseExcelStatement(excelBuffer: Buffer): Promise<{ statementType: string; transactions: ParsedTransaction[]; rawText: string }> {
  const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames.map(s => s.toUpperCase());

  if (sheetNames.includes('ORDER_BOOK')) {
    console.log('Detected INDmoney US Stocks Order Book Excel statement.');
    return await parseIndMoneyOrderBookStatement(excelBuffer);
  }

  if (sheetNames.includes('SCHEDULE FA') || sheetNames.includes('LTCG') || sheetNames.includes('STCG')) {
    console.log('Detected INDmoney Consolidated Tax Report Excel statement.');
    return await parseIndMoneyTaxReportStatement(excelBuffer);
  }

  console.log('Falling back to Zerodha Holdings Excel parser...');
  return parseZerodhaHoldingsStatement(excelBuffer);
}

