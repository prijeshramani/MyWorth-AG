import { ParsedTransaction } from './pdfParser';

// Splits a CSV line correctly while respecting double quotes and commas
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, '$1'));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"(.*)"$/, '$1'));
  return result;
}

// Convert dynamic date string to YYYY-MM-DD
function parseCsvDate(dateStr: string): string {
  const clean = dateStr.trim().replace(/[\/\.]/g, '-');
  
  // Format: DD-MMM-YYYY (e.g. 15-May-2024)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const dmyRegex = /^(\d{1,2})-(\w{3})-(\d{4})$/i;
  const match = clean.match(dmyRegex);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthWord = match[2].toLowerCase();
    const month = monthMap[monthWord] || '01';
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  // Format: DD-MM-YYYY or YYYY-MM-DD
  const numericRegex = /^(\d{1,2}|\d{4})-(\d{1,2})-(\d{4}|\d{1,2})$/;
  const matchNum = clean.match(numericRegex);
  if (matchNum) {
    let day = matchNum[1].padStart(2, '0');
    let month = matchNum[2].padStart(2, '0');
    let year = matchNum[3];
    
    // Check if format is YYYY-MM-DD
    if (day.length === 4) {
      return `${day}-${month}-${year.padStart(2, '0')}`;
    }
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

function cleanNpsSchemeName(rawName: string): string {
  let name = rawName.trim();
  
  // Remove "NPS TRUST- A/C " or similar prefixes
  name = name.replace(/^NPS TRUST-\s*A\/C\s+/i, '');
  
  // Remove " PENSION FUND MANAGEMENT LIMITED" or similar long suffixes
  name = name.replace(/\s+PENSION\s+FUND\s+MANAGEMENT\s+LIMITED/i, ' Pension Fund');
  name = name.replace(/\s+PENSION\s+FUND\s+MANAGEMENT\s+CO\s+LTD/i, ' Pension Fund');
  
  // Clean "SCHEME E - TIER I POP" -> "Scheme E"
  name = name.replace(/\s+-\s+TIER\s+I\s+POP/i, '');
  name = name.replace(/\s+TIER\s+I\s+POP/i, '');
  name = name.replace(/\s+SCHEME\s+([A-Z])\b/i, ' Scheme $1');
  
  return name.trim();
}

function isSchemeHeaderLine(line: string): boolean {
  const upper = line.toUpperCase();
  return (upper.includes('NPS TRUST') || upper.includes('SCHEME')) &&
         !upper.includes('DATE') && !upper.includes('DESCRIPTION') &&
         !upper.includes('PARTICULARS') && !upper.includes('SUMMARY') &&
         !upper.includes('HOLDINGS') && !/\d{2}-\w{3}-\d{4}/.test(line);
}

export function parseNpsCsvStatement(csvBuffer: Buffer): { statementType: string; transactions: ParsedTransaction[]; rawText: string } {
  const rawText = csvBuffer.toString('utf8');
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) {
    throw new Error('NPS CSV statement file is empty.');
  }

  // 1. Extract Subscriber PRAN
  const pranMatch = rawText.match(/PRAN,?['\s]*(\d{12})/i);
  const pran = pranMatch ? pranMatch[1] : 'NPS-PRAN-CSV';

  // 2. Scan Summary Table to collect Scheme Wise NAVs and Units (for fallback)
  const summaryNavs: Record<string, number> = {};
  const summaryUnits: Record<string, number> = {};
  
  const summaryStartIdx = lines.findIndex(l => l.toUpperCase().includes('SCHEME WISE SUMMARY'));
  const transactionDetailsIdx = lines.findIndex(l => l.toUpperCase().includes('TRANSACTION DETAILS'));
  
  if (summaryStartIdx !== -1 && transactionDetailsIdx !== -1) {
    for (let i = summaryStartIdx + 1; i < transactionDetailsIdx; i++) {
      const parts = splitCsvLine(lines[i]);
      if (parts.length >= 4) {
        const rawName = parts[0]?.trim();
        if (rawName && (rawName.toUpperCase().includes('NPS TRUST') || rawName.toUpperCase().includes('SCHEME'))) {
          const cleanName = cleanNpsSchemeName(rawName);
          const nav = parseFloat(parts[3]?.replace(/,/g, '') || '');
          const units = parseFloat(parts[2]?.replace(/,/g, '') || '');
          if (cleanName && !isNaN(nav)) {
            summaryNavs[cleanName] = nav;
          }
          if (cleanName && !isNaN(units)) {
            summaryUnits[cleanName] = units;
          }
        }
      }
    }
  }

  console.log('Extracted summary NAVs:', summaryNavs);

  // 3. Parse transactions in scheme blocks under "Transaction Details"
  const startIdx = transactionDetailsIdx !== -1 ? transactionDetailsIdx : 0;
  
  interface SchemeBlock {
    rawSchemeName: string;
    cleanSchemeName: string;
    lines: string[][];
  }

  const schemeBlocks: SchemeBlock[] = [];
  let currentBlock: SchemeBlock | null = null;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (isSchemeHeaderLine(line)) {
      const rawName = line;
      const cleanName = cleanNpsSchemeName(rawName);
      currentBlock = {
        rawSchemeName: rawName,
        cleanSchemeName: cleanName,
        lines: []
      };
      schemeBlocks.push(currentBlock);
      continue;
    }
    
    if (currentBlock) {
      const parts = splitCsvLine(line);
      currentBlock.lines.push(parts);
    }
  }

  const transactions: ParsedTransaction[] = [];

  // 4. Calculate total contribution from Investment Summary table if available
  let totalContribution = 0;
  const summaryHeaderIdx = lines.findIndex(l => l.includes('(A)') && l.includes('(B)') && l.includes('(C)'));
  if (summaryHeaderIdx !== -1 && lines[summaryHeaderIdx + 1]) {
    const parts = splitCsvLine(lines[summaryHeaderIdx + 1]);
    if (parts.length >= 3) {
      const rawContribution = parts[2]?.replace(/Rs/gi, '').replace(/,/g, '').trim();
      const parsedCont = parseFloat(rawContribution);
      if (!isNaN(parsedCont) && parsedCont > 0) {
        totalContribution = parsedCont;
      }
    }
  }

  console.log('Extracted total contribution:', totalContribution);

  // 5. Two-pass Block Processing
  // Pass 1: Scan all blocks to count opening units and calculate fallback NAVs and subsequent contributions
  const blockData: Array<{
    block: SchemeBlock;
    openingUnits: number;
    fallbackNav: number;
    subsequentBuyAmount: number;
  }> = [];

  let totalOpeningValuation = 0;
  let totalSubsequentBuys = 0;

  for (const block of schemeBlocks) {
    let dateIdx = 0;
    let descIdx = 1;
    let amountIdx = 2;
    let navIdx = 3;
    let unitsIdx = 4;
    
    const headerRow = block.lines.find(row => {
      const rowJoined = row.join(' ').toLowerCase();
      return rowJoined.includes('date') && rowJoined.includes('description');
    });
    
    if (headerRow) {
      dateIdx = headerRow.findIndex(p => p.toLowerCase().includes('date'));
      descIdx = headerRow.findIndex(p => p.toLowerCase().includes('description') || p.toLowerCase().includes('particulars'));
      amountIdx = headerRow.findIndex(p => p.toLowerCase().includes('amount'));
      navIdx = headerRow.findIndex(p => p.toLowerCase().includes('nav') || p.toLowerCase().includes('price') || p.toLowerCase().includes('rate'));
      unitsIdx = headerRow.findIndex(p => p.toLowerCase().includes('unit') || p.toLowerCase().includes('quantity'));
    }

    const txRows = block.lines.filter(row => {
      if (row.length <= Math.max(dateIdx, unitsIdx)) return false;
      const dateRaw = row[dateIdx]?.trim();
      return dateRaw && /\d{1,2}-\w{3}-\d{4}/.test(dateRaw);
    });

    let openingUnits = 0;
    let firstValidNav: number | null = null;
    let subsequentBuyAmount = 0;

    for (const row of txRows) {
      const descRaw = row[descIdx]?.trim() || 'BUY';
      const descUpper = descRaw.toUpperCase();
      const isOpening = descUpper.includes('OPENING') || descUpper.includes('BALANCE');
      const isClosing = descUpper.includes('CLOSING') || descUpper.includes('TOTAL VALUE') || descUpper.includes('VALUATION');
      
      if (isClosing) continue;

      const qtyRaw = row[unitsIdx]?.trim() || '';
      const quantity = parseFloat(qtyRaw.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));

      if (isOpening) {
        openingUnits = Math.abs(quantity);
      } else {
        const priceRaw = row[navIdx]?.replace(/,/g, '') || '';
        const price = parseFloat(priceRaw);
        if (!isNaN(price) && price > 0 && firstValidNav === null) {
          firstValidNav = price;
        }

        const amountRaw = row[amountIdx]?.trim() || '';
        let amount = 0;
        if (amountRaw) {
          amount = parseFloat(amountRaw.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));
        } else if (!isNaN(price) && !isNaN(quantity)) {
          amount = quantity * price;
        }

        const isSell = descUpper.includes('REDEMPTION') || descUpper.includes('SELL') || descUpper.includes('WITHDRAWAL') || quantity < 0;
        if (!isSell && amount > 0) {
          subsequentBuyAmount += amount;
        }
      }
    }

    const fallbackNav = firstValidNav || summaryNavs[block.cleanSchemeName] || 10;
    const openingValuation = openingUnits * fallbackNav;

    totalOpeningValuation += openingValuation;
    totalSubsequentBuys += subsequentBuyAmount;

    blockData.push({
      block,
      openingUnits,
      fallbackNav,
      subsequentBuyAmount
    });
  }

  // Pass 2: Calculate opening prices based on actual cost basis contribution, and construct final transactions
  const totalOpeningContribution = totalContribution > totalSubsequentBuys 
    ? totalContribution - totalSubsequentBuys 
    : 0;

  for (const data of blockData) {
    const block = data.block;
    
    let dateIdx = 0;
    let descIdx = 1;
    let amountIdx = 2;
    let navIdx = 3;
    let unitsIdx = 4;
    
    const headerRow = block.lines.find(row => {
      const rowJoined = row.join(' ').toLowerCase();
      return rowJoined.includes('date') && rowJoined.includes('description');
    });
    
    if (headerRow) {
      dateIdx = headerRow.findIndex(p => p.toLowerCase().includes('date'));
      descIdx = headerRow.findIndex(p => p.toLowerCase().includes('description') || p.toLowerCase().includes('particulars'));
      amountIdx = headerRow.findIndex(p => p.toLowerCase().includes('amount'));
      navIdx = headerRow.findIndex(p => p.toLowerCase().includes('nav') || p.toLowerCase().includes('price') || p.toLowerCase().includes('rate'));
      unitsIdx = headerRow.findIndex(p => p.toLowerCase().includes('unit') || p.toLowerCase().includes('quantity'));
    }

    const txRows = block.lines.filter(row => {
      if (row.length <= Math.max(dateIdx, unitsIdx)) return false;
      const dateRaw = row[dateIdx]?.trim();
      return dateRaw && /\d{1,2}-\w{3}-\d{4}/.test(dateRaw);
    });

    // Allocate cost basis to opening units proportionally
    let openingPrice = data.fallbackNav;
    if (totalOpeningContribution > 0 && totalOpeningValuation > 0 && data.openingUnits > 0) {
      const openingValuation = data.openingUnits * data.fallbackNav;
      const ratio = openingValuation / totalOpeningValuation;
      const allocatedCost = totalOpeningContribution * ratio;
      openingPrice = allocatedCost / data.openingUnits;
    }

    for (const row of txRows) {
      const dateRaw = row[dateIdx]?.trim();
      const descRaw = row[descIdx]?.trim() || 'BUY';
      const amountRaw = row[amountIdx]?.trim() || '';
      const priceRaw = row[navIdx]?.trim() || '';
      const qtyRaw = row[unitsIdx]?.trim() || '';
      
      const descUpper = descRaw.toUpperCase();
      
      if (descUpper.includes('CLOSING') || descUpper.includes('TOTAL VALUE') || descUpper.includes('VALUATION')) {
        continue;
      }
      
      const date = parseCsvDate(dateRaw);
      const quantity = parseFloat(qtyRaw.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));
      if (isNaN(quantity) || quantity === 0) continue;
      
      const isOpening = descUpper.includes('OPENING') || descUpper.includes('BALANCE');
      
      let price = parseFloat(priceRaw.replace(/,/g, ''));
      let amount = 0;

      if (isOpening) {
        price = openingPrice;
        amount = quantity * price;
      } else {
        if (isNaN(price)) {
          price = data.fallbackNav;
        }
        if (amountRaw) {
          amount = parseFloat(amountRaw.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));
        } else {
          amount = quantity * price;
        }
      }
      
      if (isNaN(price) || isNaN(amount)) continue;
      
      let txType: ParsedTransaction['type'] = 'BUY';
      if (descUpper.includes('REDEMPTION') || descUpper.includes('SELL') || descUpper.includes('WITHDRAWAL') || quantity < 0) {
        txType = 'SELL';
      }
      
      transactions.push({
        assetName: block.cleanSchemeName,
        assetType: 'NPS',
        category: 'Hybrid',
        identifier: pran,
        type: txType,
        date,
        quantity: Math.abs(quantity),
        price,
        amount: Math.abs(amount)
      });
    }
  }

  console.log(`Successfully parsed ${transactions.length} NPS transactions from CSV.`);

  return {
    statementType: 'NPS_PROTEAN',
    transactions,
    rawText
  };
}
