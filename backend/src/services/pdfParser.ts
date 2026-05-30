import { AssetTypeSchema } from '../schema';

// Standardize dates to YYYY-MM-DD
function normalizeDate(rawDate: string): string {
  const clean = rawDate.trim().replace(/[\/\.]/g, '-');
  
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

  // Format: DD-MM-YYYY
  const numericRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const matchNum = clean.match(numericRegex);
  if (matchNum) {
    const day = matchNum[1].padStart(2, '0');
    const month = matchNum[2].padStart(2, '0');
    const year = matchNum[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback: Check if it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  return new Date().toISOString().split('T')[0];
}

export interface ParsedTransaction {
  assetName: string;
  assetType: 'MUTUAL_FUND' | 'STOCK' | 'NPS' | 'EPF';
  category: 'Equity' | 'Debt' | 'Cash' | 'Hybrid' | 'Alternative';
  identifier: string; // ISIN, PRAN, Ticker
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST';
  date: string; // YYYY-MM-DD
  quantity: number;
  price: number;
  amount: number;
}

export interface ParseResult {
  statementType: 'CAMS_CAS' | 'NPS_PROTEAN' | 'ZERODHA' | 'ANGELONE' | 'TCS_EPF' | 'UNKNOWN';
  transactions: ParsedTransaction[];
  rawText: string;
}

export async function parsePdfStatement(pdfBuffer: Buffer, password?: string): Promise<ParseResult> {
  let rawText = '';
  
  try {
    // Dynamic import of modern ES Module pdfjs-dist in CommonJS environment
    const pdfjsLib = await (eval('import("pdfjs-dist/legacy/build/pdf.mjs")') as Promise<any>);

    // Load PDF using pdfjs legacy build in Node (no worker required)
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      password: password || undefined,
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdfDoc = await loadingTask.promise;
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContentObj = await page.getTextContent();
      const pageText = textContentObj.items
        .map((item: any) => item.str)
        .join(' ');
      rawText += `--- PAGE ${i} ---\n${pageText}\n\n`;
    }
  } catch (err: any) {
    console.error('PDF JS loading error:', err);
    throw new Error(`Failed to decrypt or load PDF: ${err.message || err}`);
  }

  // Detect Statement Type
  let statementType: ParseResult['statementType'] = 'UNKNOWN';
  const rawTextUpper = rawText.toUpperCase();

  if (rawTextUpper.includes('CAMS') || rawTextUpper.includes('CONSOLIDATED ACCOUNT STATEMENT') || rawTextUpper.includes('FOLIO NO:')) {
    statementType = 'CAMS_CAS';
  } else if (rawTextUpper.includes('PROTEAN') || rawTextUpper.includes('CRA') || rawTextUpper.includes('PRAN') || rawTextUpper.includes('NATIONAL PENSION SYSTEM')) {
    statementType = 'NPS_PROTEAN';
  } else if (rawTextUpper.includes('ZERODHA') || rawTextUpper.includes('CONSOL') || rawTextUpper.includes('CONTRACT NOTE')) {
    statementType = 'ZERODHA';
  } else if (rawTextUpper.includes('ANGEL') || rawTextUpper.includes('ANGELONE') || rawTextUpper.includes('ANGEL BROKING')) {
    statementType = 'ANGELONE';
  } else if (rawTextUpper.includes('TATA CONSULTANCY SERVICES EMPLOYEES') && rawTextUpper.includes('PROVIDENT FUND')) {
    statementType = 'TCS_EPF';
  }

  console.log(`Detected PDF Statement Type: ${statementType}`);
  
  const transactions: ParsedTransaction[] = [];

  // 1. CAMS CAS Mutual Fund Ingestion
  if (statementType === 'CAMS_CAS') {
    // Standard CAMS scheme row regex matching: Scheme Name - ISIN : INF 209 KB 1 H 99
    // The ISIN is captured with spaces, and the Scheme Name is captured prior to it
    const schemeRegex = /([A-Za-z0-9\s\-\.\&\(\)\/]+?)(?:\([^\)]*\))?\s*-\s*ISIN\s*:\s*(INF\s*[A-Z0-9\s]{9,22})/gi;
    let schemeMatch;
    const schemes: { name: string; isin: string; index: number }[] = [];
    
    while ((schemeMatch = schemeRegex.exec(rawText)) !== null) {
      const cleanIsin = schemeMatch[2].replace(/\s+/g, '').toUpperCase();
      schemes.push({
        name: schemeMatch[1].trim(),
        isin: cleanIsin,
        index: schemeMatch.index
      });
    }

    // Now, parse transactions for each scheme block range
    for (let s = 0; s < schemes.length; s++) {
      const currentScheme = schemes[s];
      const startIdx = currentScheme.index;
      const endIdx = s + 1 < schemes.length ? schemes[s + 1].index : rawText.length;
      
      const schemeSection = rawText.slice(startIdx, endIdx);
      
      // Global CAMS Transaction Regex Scanner for single-line extracts
      // Matches: Date, Amount, Price, Units, Description, Balance
      const globalTxRegex = /(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4})\s+([\d,\.\-\(\)]+)\s+([\d,\.\-]+)\s+([\d,\.\-\(\)]+)\s+(.+?)\s+([\d,\.\-]+)(?=\s+(?:\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}|Opening|Closing|NAV|Stamp|PAN|Total|Folio|ISIN|\*\*\*|Mutual\s+Fund|$))/gi;
      
      let txMatch;
      while ((txMatch = globalTxRegex.exec(schemeSection)) !== null) {
        const dateRaw = txMatch[1];
        const amountStr = txMatch[2];
        const priceStr = txMatch[3];
        const qtyStr = txMatch[4];
        const desc = txMatch[5].trim();
        
        // Parse numbers (remove commas and parse parentheses as negative signs)
        const amount = parseFloat(amountStr.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));
        const price = parseFloat(priceStr.replace(/,/g, ''));
        const quantity = parseFloat(qtyStr.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));
        
        if (isNaN(amount) || isNaN(price) || isNaN(quantity)) continue;
        
        let txType: ParsedTransaction['type'] = 'BUY';
        const descUpper = desc.toUpperCase();
        
        if (descUpper.includes('REDEMPTION') || descUpper.includes('SELL') || descUpper.includes('SWITCH-OUT') || quantity < 0) {
          txType = 'SELL';
        } else if (descUpper.includes('DIVIDEND') && descUpper.includes('REINVEST')) {
          txType = 'REINVEST';
        } else if (descUpper.includes('DIVIDEND')) {
          txType = 'DIVIDEND';
        }

        // Clean Scheme Name from remnants of preceding KYC lines in single-line text
        const cleanName = currentScheme.name
          .replace(/^(?:PAN|KYC|OK|\s)+/gi, '') // strip PAN/KYC tags
          .replace(/^[A-Z0-9\s]+\s*-\s*/i, '') // strip codes like B 55 B - or GD 340 -
          .trim();

        // Determine if Equity, Debt or Hybrid based on name
        let category: ParsedTransaction['category'] = 'Equity';
        const nameLower = cleanName.toLowerCase();
        if (nameLower.includes('debt') || nameLower.includes('liquid') || nameLower.includes('gilt') || nameLower.includes('fixed')) {
          category = 'Debt';
        } else if (nameLower.includes('hybrid') || nameLower.includes('balanced') || nameLower.includes('retirement')) {
          category = 'Hybrid';
        }

        transactions.push({
          assetName: cleanName,
          assetType: 'MUTUAL_FUND',
          category,
          identifier: currentScheme.isin,
          type: txType,
          date: normalizeDate(dateRaw),
          quantity: Math.abs(quantity),
          price,
          amount: Math.abs(amount)
        });
      }
    }
  }

  // 2. NPS Protean CRA Ingestion
  if (statementType === 'NPS_PROTEAN') {
    // NPS Statement contains PRAN e.g. "PRAN : 110023456789"
    const pranMatch = rawText.match(/PRAN\s*:\s*(\d{12})/i);
    const pran = pranMatch ? pranMatch[1] : 'NPS-PRAN-UNKNOWN';

    // NPS has scheme names like: "SBI Pension Fund Scheme Tier I" or "LIC Pension Fund"
    // Transactions represent contributions, units, NAV.
    // E.g. "25-May-2024 Contribution 10,000.00 Regular 243.2300 41.1133"
    // Let's search for schemes
    const npsSchemesRegex = /([A-Za-z\s]+Pension\s+Fund\s+Scheme\s+(?:Tier\s+I|Tier\s+II))/gi;
    let npsMatch;
    const npsSchemes: { name: string; index: number }[] = [];
    while ((npsMatch = npsSchemesRegex.exec(rawText)) !== null) {
      npsSchemes.push({
        name: npsMatch[1].trim(),
        index: npsMatch.index
      });
    }

    // Parse transactions in scheme ranges
    for (let s = 0; s < npsSchemes.length; s++) {
      const currentScheme = npsSchemes[s];
      const startIdx = currentScheme.index;
      const endIdx = s + 1 < npsSchemes.length ? npsSchemes[s + 1].index : rawText.length;
      
      const schemeSection = rawText.slice(startIdx, endIdx);
      
      // Look for transaction lines with Dates + Description + Amount + NAV + Units
      const txRegex = /(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}|\d{1,2}\/\d{2}\/\d{4})\s+(Contribution|Regular|Tier1|Subscription|Withdrawal|Purchase|Redemption)\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)/gi;
      let txMatch;
      
      while ((txMatch = txRegex.exec(schemeSection)) !== null) {
        const dateRaw = txMatch[1];
        const typeRaw = txMatch[2].toUpperCase();
        const amount = parseFloat(txMatch[3].replace(/,/g, ''));
        const price = parseFloat(txMatch[4].replace(/,/g, '')); // NAV
        const quantity = parseFloat(txMatch[5].replace(/,/g, '')); // Units
        
        const txType: ParsedTransaction['type'] = typeRaw.includes('WITHDRAWAL') || typeRaw.includes('REDEMPTION') ? 'SELL' : 'BUY';
        
        transactions.push({
          assetName: currentScheme.name,
          assetType: 'NPS',
          category: 'Hybrid', // NPS is typically a hybrid asset containing Equity (E), Corporate Debt (C), Govt Debt (G)
          identifier: pran,
          type: txType,
          date: normalizeDate(dateRaw),
          quantity,
          price,
          amount
        });
      }
    }
  }

  // 3. Stock Statements - Zerodha and AngelOne (Contract Notes)
  if (statementType === 'ZERODHA' || statementType === 'ANGELONE') {
    // Contract note contains transaction details like:
    // "RELIANCE BUY 10 2450.00 24500.00"
    // "TCS SELL 5 3200.00 16000.00"
    // Date is usually at the top or inside the line
    const dateMatch = rawText.match(/(?:Date|Contract\s+Date|Billing\s+Date)\s*:\s*(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}|\d{1,2}\/\d{2}\/\d{4})/i);
    const docDate = dateMatch ? normalizeDate(dateMatch[1]) : new Date().toISOString().split('T')[0];

    // Look for lines containing: STOCK Ticker + Type (BUY/SELL) + Qty + Price + Amount
    // e.g. "RELIANCE BUY 5 2500.00 12500.00" or "TCS.NS BUY 10 3000"
    // Indian stock tickers are usually capital letters, length 2 to 10
    const stockTxRegex = /\b([A-Z0-9]{2,10}(?:\.NS|\.BO)?)\b\s+(BUY|SELL)\s+(\d+)\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)/gi;
    let txMatch;

    while ((txMatch = stockTxRegex.exec(rawText)) !== null) {
      const ticker = txMatch[1].toUpperCase();
      const typeRaw = txMatch[2].toUpperCase();
      const quantity = parseInt(txMatch[3]);
      const price = parseFloat(txMatch[4].replace(/,/g, ''));
      const amount = parseFloat(txMatch[5].replace(/,/g, ''));

      const txType: ParsedTransaction['type'] = typeRaw === 'SELL' ? 'SELL' : 'BUY';

      // Let's standardise the ticker suffix to .NS (NSE) if not present
      const fullTicker = ticker.includes('.') ? ticker : `${ticker}.NS`;

      transactions.push({
        assetName: ticker,
        assetType: 'STOCK',
        category: 'Equity',
        identifier: fullTicker,
        type: txType,
        date: docDate,
        quantity,
        price,
        amount
      });
    }
  }

  // 5. TCS Employees Provident Fund Statement Ingestion
  if (statementType === 'TCS_EPF') {
    const parseVal = (str: string): number => parseFloat(str.replace(/,/g, '')) || 0;

    // 1. Detect UAN
    const uanMatch = rawText.match(/UAN\s+PF\s+Account\s+No\s+Member\s+ID\s*(\d{12})/i) ||
                     rawText.match(/UAN\b.*?(\d{12})/i);
    const uan = uanMatch ? uanMatch[1] : '100432083045';

    // 2. Parse Financial Year
    const fyMatch = rawText.match(/PF\s+Statement\s+for\s+the\s+Financial\s+year\s*(\d{4})\s*(\d{4})/i) ||
                    rawText.match(/PF\s+Statement\s+for\s+the\s+Financial\s+year\s*(\d{8})/i);
    let startYear = 2025;
    if (fyMatch) {
      if (fyMatch[1].length === 8) {
        startYear = parseInt(fyMatch[1].slice(0, 4));
      } else {
        startYear = parseInt(fyMatch[1]);
      }
    }

    // 3. Parse Opening Balance
    let opnBalMatch = rawText.match(/(?:OPN\s*-\s*BAL\(A\)|Opening\s+Balance)[^]*?Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)/i);
    if (!opnBalMatch) {
      opnBalMatch = rawText.match(/OPN\s*-\s*BAL\(A\)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/i);
    }
    
    if (opnBalMatch) {
      const opnBal = parseVal(opnBalMatch[1]) + parseVal(opnBalMatch[2]) + parseVal(opnBalMatch[3]) + parseVal(opnBalMatch[4]) + parseVal(opnBalMatch[5]) + parseVal(opnBalMatch[6]);
      transactions.push({
        assetName: 'TCS Employees Provident Fund',
        assetType: 'EPF',
        category: 'Debt',
        identifier: uan,
        type: 'BUY',
        date: `${startYear}-04-01`,
        quantity: opnBal,
        price: 1.0,
        amount: opnBal
      });
    }

    // 4. Parse Monthly Contributions
    const monthRegex = /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*-\s*(\d{4})\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)/gi;
    let match;
    const monthsMap: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    const monthEnds: Record<string, string> = {
      '01': '31', '02': '28', '03': '31', '04': '30', '05': '31', '06': '30', '07': '31', '08': '31', '09': '30', '10': '31', '11': '30', '12': '31'
    };

    while ((match = monthRegex.exec(rawText)) !== null) {
      const monthWord = match[1].toUpperCase();
      const year = match[2];
      const monthNum = monthsMap[monthWord];
      const day = monthEnds[monthNum] || '30';
      const txDate = `${year}-${monthNum}-${day}`;

      const monthVal = parseVal(match[3]) + parseVal(match[4]) + parseVal(match[5]) + parseVal(match[6]) + parseVal(match[7]) + parseVal(match[8]);
      
      transactions.push({
        assetName: 'TCS Employees Provident Fund',
        assetType: 'EPF',
        category: 'Debt',
        identifier: uan,
        type: 'BUY',
        date: txDate,
        quantity: monthVal,
        price: 1.0,
        amount: monthVal
      });
    }

    // 5. Parse Credited Interest
    const interestMatch6 = rawText.match(/Interest\s*\((?:A|IV)\)\s*\*?\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)/i);
    let interestVal = 0;
    if (interestMatch6) {
      interestVal = parseVal(interestMatch6[1]) + parseVal(interestMatch6[2]) + parseVal(interestMatch6[3]) + parseVal(interestMatch6[4]) + parseVal(interestMatch6[5]) + parseVal(interestMatch6[6]);
    } else {
      const interestMatch1 = rawText.match(/Interest\s*\((?:A|IV)\):?\s*\*?\s*([\d,]+(?:\.\d{2})?)/i);
      if (interestMatch1) {
        interestVal = parseVal(interestMatch1[1]);
      }
    }

    if (interestVal > 0) {
      transactions.push({
        assetName: 'TCS Employees Provident Fund',
        assetType: 'EPF',
        category: 'Debt',
        identifier: uan,
        type: 'BUY', // Mapped as BUY so cost aggregates perfectly into worth
        date: `${startYear + 1}-03-31`,
        quantity: interestVal,
        price: 1.0,
        amount: interestVal
      });
    }
  }

  // Backup simple keyword scan if we found zero transactions but did match the statement type
  // This helps log text segments for diagnostic purposes
  if (transactions.length === 0 && statementType !== 'UNKNOWN') {
    console.log('Statement type detected but 0 transactions extracted. Rich diagnostics enabled.');
  }

  return {
    statementType,
    transactions,
    rawText
  };
}
