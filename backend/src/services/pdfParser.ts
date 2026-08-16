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
  assetType: 'MUTUAL_FUND' | 'STOCK' | 'US_STOCK' | 'NPS' | 'EPF' | 'GOLD' | 'BOND' | 'PROPERTY' | 'BANK_ACCOUNT' | 'FIXED_DEPOSIT' | 'SSY' | 'PPF' | 'OTHER';
  category: 'Equity' | 'Debt' | 'Cash' | 'Hybrid' | 'Alternative';
  identifier: string; // ISIN, PRAN, Ticker
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST';
  date: string; // YYYY-MM-DD
  quantity: number;
  price: number; // Buy price / cost basis per unit
  currentPrice?: number; // Current live market price (LTP) per unit
  amount: number;
  statementType?: string;
  source?: string;
  isHoldings?: boolean;
  isOpeningBalance?: boolean;
  narration?: string;
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
// Helper to mathematically align CAMS transaction numbers (Amount, NAV/Price, Units/Quantity)
function alignCamsNumbers(n1: number, n2: number, n3: number): { amount: number; price: number; quantity: number } {
  const abs1 = Math.abs(n1);
  const abs2 = Math.abs(n2);
  const abs3 = Math.abs(n3);

  // Case 1: abs1 ≈ abs2 * abs3 (n1 is Amount, n2 is NAV/Price, n3 is Quantity/Units)
  if (abs1 > 0 && Math.abs(abs1 - abs2 * abs3) / abs1 < 0.08) {
    return { amount: abs1, price: abs2, quantity: abs3 };
  }
  // Case 2: abs1 ≈ abs3 * abs2 (n1 is Amount, n3 is NAV/Price, n2 is Quantity/Units)
  if (abs1 > 0 && Math.abs(abs1 - abs3 * abs2) / abs1 < 0.08) {
    return { amount: abs1, price: abs3, quantity: abs2 };
  }
  // Case 3: abs2 ≈ abs1 * abs3 (n2 is Amount, n1 is Price, n3 is Quantity)
  if (abs2 > 0 && Math.abs(abs2 - abs1 * abs3) / abs2 < 0.08) {
    return { amount: abs2, price: abs1, quantity: abs3 };
  }
  // Case 4: abs3 ≈ abs1 * abs2 (n3 is Amount, abs2 is Price, abs1 is Quantity)
  if (abs3 > 0 && Math.abs(abs3 - abs1 * abs2) / abs3 < 0.08) {
    return { amount: abs3, price: abs2, quantity: abs1 };
  }

  // General Fallback: Largest number is Amount
  const max = Math.max(abs1, abs2, abs3);
  let rem1 = abs1;
  let rem2 = abs2;
  if (max === abs1) { rem1 = abs2; rem2 = abs3; }
  else if (max === abs2) { rem1 = abs1; rem2 = abs3; }
  else { rem1 = abs1; rem2 = abs2; }

  // Higher value between remaining two is typically NAV/Price
  const price = Math.max(rem1, rem2);
  const quantity = Math.min(rem1, rem2);
  return { amount: max, price, quantity };
}

  // 1. CAMS CAS Mutual Fund Ingestion
  if (statementType === 'CAMS_CAS') {
    const schemes: { name: string; isin: string; index: number }[] = [];

    // Strategy A: ISIN Tag Matching (e.g. "HDFC Top 100 - ISIN: INF179K01BE2" or "ISIN : INF 209 KB 1 H 99")
    const isinRegex = /(?:([A-Za-z0-9\s\-\.\&\(\)\/,\+\[\]\%]+?)\s*[-–—]?\s*)?ISIN\s*[:\-\s]*\s*(INF[A-Z0-9\s]{9,22})/gi;
    let isinMatch;

    while ((isinMatch = isinRegex.exec(rawText)) !== null) {
      const rawSchemeName = isinMatch[1] ? isinMatch[1].trim() : '';
      const cleanIsin = isinMatch[2].replace(/\s+/g, '').toUpperCase();
      
      let name = rawSchemeName
        .replace(/^(?:PAN|KYC|OK|FOLIO\s*NO[\d\:\s\/]+|\s)+/gi, '')
        .replace(/^[A-Z0-9\s]{1,6}\s*-\s*/i, '')
        .trim();

      if (!name || name.length < 3) {
        const backChunk = rawText.slice(Math.max(0, isinMatch.index - 150), isinMatch.index);
        const lines = backChunk.split('\n').filter(l => l.trim().length > 5);
        if (lines.length > 0) {
          name = lines[lines.length - 1].replace(/Folio\s*No[.\s\:]*[\d\/]+/gi, '').trim();
        }
      }

      schemes.push({
        name: name || 'Mutual Fund Scheme',
        isin: cleanIsin,
        index: isinMatch.index
      });
    }

    // Strategy B: If no ISIN tag found, search for "Folio No" headers
    if (schemes.length === 0) {
      const folioRegex = /Folio\s*No[.\s\:]*([\d\/]+)\s+([A-Za-z0-9\s\-\.\&\(\)\/,\+]+)/gi;
      let folioMatch;
      while ((folioMatch = folioRegex.exec(rawText)) !== null) {
        schemes.push({
          name: folioMatch[2].trim(),
          isin: 'CAMS-MF-' + folioMatch[1].replace(/[\/]/g, ''),
          index: folioMatch.index
        });
      }
    }

    // Fallback: If still no schemes found, create a default global scheme covering full rawText
    if (schemes.length === 0) {
      schemes.push({
        name: 'CAMS Mutual Fund Holding',
        isin: 'CAMS-MF-HOLDING',
        index: 0
      });
    }

    // Parse transactions for each scheme block range
    for (let s = 0; s < schemes.length; s++) {
      const currentScheme = schemes[s];
      const startIdx = currentScheme.index;
      const endIdx = s + 1 < schemes.length ? schemes[s + 1].index : rawText.length;
      
      const schemeSection = rawText.slice(startIdx, endIdx);

      // Extract footer summary metadata for this scheme block
      const navMatch = schemeSection.match(/NAV\s+on\s+[\d\-A-Za-z]+:\s*INR\s*([\d,\.]+)/i);
      const mvalMatch = schemeSection.match(/Market\s+Value\s+on\s+[\d\-A-Za-z]+:\s*INR\s*([\d,\.]+)/i);
      const qtyMatch = schemeSection.match(/Closing\s+Unit\s+Balance:\s*([\d,\.]+)/i);
      const costMatch = schemeSection.match(/Total\s+Cost\s+Value:\s*([\d,\.]+)/i);

      const footerNav = navMatch ? parseFloat(navMatch[1].replace(/,/g, '')) : 0;
      const footerMval = mvalMatch ? parseFloat(mvalMatch[1].replace(/,/g, '')) : 0;
      const footerQty = qtyMatch ? parseFloat(qtyMatch[1].replace(/,/g, '')) : 0;
      const footerCost = costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : 0;

      let category: ParsedTransaction['category'] = 'Equity';
      const nameLower = currentScheme.name.toLowerCase();
      if (nameLower.includes('debt') || nameLower.includes('liquid') || nameLower.includes('gilt') || nameLower.includes('fixed')) {
        category = 'Debt';
      } else if (nameLower.includes('hybrid') || nameLower.includes('balanced') || nameLower.includes('retirement')) {
        category = 'Hybrid';
      }

      const schemeTxs: ParsedTransaction[] = [];
      
      // Strategy 1: Standard 6-Column CAMS CAS Table Layout Regex
      // Date | Amount (INR) | Price Unit (INR) | Units | Transaction Description | Unit Balance
      const camsRealTxRegex = /(\d{1,2}-[A-Za-z]{3}-\d{4}|\d{1,2}\/\d{2}\/\d{4})\s+([\d,\.\-\(\)]+)\s+([\d,\.\-]+)\s+([\d,\.\-\(\)]+)\s+(.+?)\s+([\d,\.\-]+)(?=\s+(?:\d{1,2}-[A-Za-z]{3}-\d{4}|\d{1,2}\/\d{2}\/\d{4}|NAV\s+on|Closing|Opening|Total|Folio|PAN|\*\*\*|Mutual\s+Fund|\d{1,2}-[A-Za-z]{3}-\d{4}\s+\d+\.\d+|$))/gi;
      
      let txMatch;
      let txFoundCount = 0;

      while ((txMatch = camsRealTxRegex.exec(schemeSection)) !== null) {
        const dateRaw = txMatch[1];
        const amountStr = txMatch[2];
        const priceStr = txMatch[3];
        const qtyStr = txMatch[4];
        const desc = txMatch[5].trim();

        const amount = parseFloat(amountStr.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));
        const price = parseFloat(priceStr.replace(/,/g, ''));
        const quantity = parseFloat(qtyStr.replace(/,/g, '').replace(/\((.*?)\)/, '-$1'));

        if (isNaN(amount) || isNaN(price) || isNaN(quantity) || amount === 0 || quantity === 0) continue;

        txFoundCount++;
        let txType: ParsedTransaction['type'] = 'BUY';
        const descUpper = desc.toUpperCase();

        if (descUpper.includes('REDEMPTION') || descUpper.includes('SELL') || descUpper.includes('SWITCH-OUT') || amount < 0 || quantity < 0) {
          txType = 'SELL';
        } else if (descUpper.includes('DIVIDEND') && descUpper.includes('REINVEST')) {
          txType = 'REINVEST';
        } else if (descUpper.includes('DIVIDEND')) {
          txType = 'DIVIDEND';
        }

        schemeTxs.push({
          assetName: currentScheme.name,
          assetType: 'MUTUAL_FUND',
          category,
          identifier: currentScheme.isin,
          type: txType,
          date: normalizeDate(dateRaw),
          quantity: parseFloat(Math.abs(quantity).toFixed(4)),
          price: parseFloat(Math.abs(price).toFixed(4)),
          amount: parseFloat(Math.abs(amount).toFixed(2)),
          currentPrice: footerNav || undefined
        });
      }

      // Strategy 2: Fallback Line Scanner (for non-standard / single-line extracts)
      if (txFoundCount === 0) {
        const lines = schemeSection.split('\n');
        for (const line of lines) {
          const dateMatch = line.match(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{1,2}[-\/\.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[-\/\.]\d{2,4})/i);
          if (!dateMatch) continue;

          const kwMatch = line.match(/\b(BUY|SELL|PURCHASE|REDEMPTION|SWITCH-OUT|SWITCH-IN|REINVEST|DIVIDEND)\b/i);
          let targetText = line;
          let txType: ParsedTransaction['type'] = 'BUY';

          if (kwMatch && kwMatch.index !== undefined) {
            const kwStr = kwMatch[1].toUpperCase();
            if (kwStr.includes('REDEMPTION') || kwStr.includes('SELL') || kwStr.includes('SWITCH-OUT')) {
              txType = 'SELL';
            } else if (kwStr.includes('REINVEST')) {
              txType = 'REINVEST';
            } else if (kwStr.includes('DIVIDEND')) {
              txType = 'DIVIDEND';
            }
            targetText = line.substring(kwMatch.index + kwMatch[0].length);
          } else {
            const lineUpper = line.toUpperCase();
            if (lineUpper.includes('REDEMPTION') || lineUpper.includes('SELL') || lineUpper.includes('SWITCH-OUT')) {
              txType = 'SELL';
            }
          }

          const matches = targetText.match(/[\d,\.]+/g) || [];
          const rawNums = matches
            .map(m => parseFloat(m.replace(/,/g, '')))
            .filter(n => !isNaN(n) && n > 0);

          const nums = rawNums.filter(n => n < 500000);
          const uniqueNums: number[] = [];
          for (const n of nums) {
            if (uniqueNums.length === 0 || Math.abs(uniqueNums[uniqueNums.length - 1] - n) > 0.0001) {
              uniqueNums.push(n);
            }
          }

          if (uniqueNums.length < 2) continue;

          const aligned = alignCamsNumbers(
            uniqueNums[0],
            uniqueNums[1],
            uniqueNums.length > 2 ? uniqueNums[2] : 0
          );

          if (aligned.amount === 0 || aligned.quantity === 0) continue;

          schemeTxs.push({
            assetName: currentScheme.name,
            assetType: 'MUTUAL_FUND',
            category,
            identifier: currentScheme.isin,
            type: txType,
            date: normalizeDate(dateMatch[1]),
            quantity: parseFloat(aligned.quantity.toFixed(4)),
            price: parseFloat(aligned.price.toFixed(4)),
            amount: parseFloat(aligned.amount.toFixed(2)),
            currentPrice: footerNav || undefined
          });
        }
      }

      // Check if parsed transactions match scheme footer totals
      let parsedQty = 0;
      let parsedCost = 0;
      schemeTxs.forEach(tx => {
        if (tx.type === 'BUY' || tx.type === 'REINVEST') {
          parsedQty += tx.quantity;
          parsedCost += tx.amount;
        } else if (tx.type === 'SELL') {
          parsedQty -= tx.quantity;
          parsedCost -= tx.amount;
        }
      });

      const diffQty = footerQty - parsedQty;
      const diffCost = footerCost - parsedCost;

      // If statement window missed pre-statement opening balance / cost basis or has net unit diff, add baseline adjustment
      if (footerQty > 0 && (Math.abs(diffQty) > 0.001 || Math.abs(diffCost) > 0.50)) {
        const earliestDate = schemeTxs.length > 0 ? schemeTxs[0].date : '2019-01-01';
        
        if (diffQty >= 0) {
          const calcPrice = Math.abs(diffQty) > 0.0001 ? Math.abs(diffCost / diffQty) : footerNav;
          schemeTxs.unshift({
            assetName: currentScheme.name,
            assetType: 'MUTUAL_FUND',
            category,
            identifier: currentScheme.isin,
            type: 'BUY',
            date: earliestDate,
            quantity: parseFloat(Math.abs(diffQty).toFixed(4)),
            price: parseFloat(calcPrice.toFixed(4)),
            amount: parseFloat(Math.abs(diffCost).toFixed(2)),
            currentPrice: footerNav || undefined
          });
        } else {
          // If parsed transactions exceeded footerQty (due to pre-statement redemptions/transfers), add adjustment
          schemeTxs.push({
            assetName: currentScheme.name,
            assetType: 'MUTUAL_FUND',
            category,
            identifier: currentScheme.isin,
            type: 'SELL',
            date: schemeTxs.length > 0 ? schemeTxs[schemeTxs.length - 1].date : '2026-08-01',
            quantity: parseFloat(Math.abs(diffQty).toFixed(4)),
            price: parseFloat(footerNav.toFixed(4)),
            amount: parseFloat((-diffCost).toFixed(2)),
            currentPrice: footerNav || undefined
          });
        }
      }

      transactions.push(...schemeTxs);
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

  // 5. Employees Provident Fund (EPF / TCS Trust / EPFO) Statement Ingestion
  if (statementType === 'TCS_EPF') {
    const parseVal = (str: string): number => parseFloat((str || '0').replace(/,/g, '')) || 0;

    // 1. Detect UAN / Member ID
    const uanMatch = rawText.match(/Universal\s+Account\s+Number\s*\(\s*UAN\s*\)\s*:?\s*(\d{12})/i) ||
                     rawText.match(/UAN\b.*?(\d{12})/i) ||
                     rawText.match(/Member\s+ID\s*:?\s*([A-Z0-9\/]{10,30})/i);
    const uan = uanMatch ? uanMatch[1].trim() : '100432083045';

    // 2. Organization / Trust Name
    let trustName = 'Employees Provident Fund';
    if (rawText.match(/TATA\s+CONSULTANCY\s+SERVICES/i)) {
      trustName = 'TATA CONSULTANCY SERVICES EMPLOYEES\' PROVIDENT FUND';
    } else {
      const trustMatch = rawText.match(/([A-Z\s']+(?:PROVIDENT\s+FUND|EPFO|TRUST)[A-Z\s']*)/i);
      if (trustMatch) trustName = trustMatch[1].replace(/^(?:\d+\s*)+/, '').trim();
    }

    // 3. Parse Financial Year
    const fyMatch = rawText.match(/Financial\s+year\s*(\d{4})\s*(\d{4})/i) ||
                    rawText.match(/Financial\s+year\s*(\d{8})/i) ||
                    rawText.match(/FY\s*(\d{4})\s*-\s*(\d{2,4})/i);
    let startYear = 2026;
    if (fyMatch) {
      if (fyMatch[1].length === 8) {
        startYear = parseInt(fyMatch[1].slice(0, 4));
      } else {
        startYear = parseInt(fyMatch[1]);
      }
    }

    // 4. Parse Opening Balance
    let openingBalance = 0;
    const opnBalBlockMatch = rawText.match(/Opening\s+Balance[^]*?Taxable\s+Non\s*Taxable[^]*?\n?\s*([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i) ||
                             rawText.match(/Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);

    if (opnBalBlockMatch) {
      openingBalance = parseVal(opnBalBlockMatch[1]) + parseVal(opnBalBlockMatch[2]) + parseVal(opnBalBlockMatch[3]) + parseVal(opnBalBlockMatch[4]) + parseVal(opnBalBlockMatch[5]) + parseVal(opnBalBlockMatch[6]);
    } else {
      const simpleOpn = rawText.match(/(?:OPN\s*-\s*BAL\(A\)|Opening\s+Balance)\b.*?([\d,]+(?:\.\d{2})?)/i);
      if (simpleOpn) openingBalance = parseVal(simpleOpn[1]);
    }

    if (openingBalance > 0) {
      transactions.push({
        assetName: trustName,
        assetType: 'EPF',
        category: 'Debt',
        identifier: uan,
        type: 'BUY',
        date: `${startYear}-04-01`,
        quantity: openingBalance,
        price: 1.0,
        amount: openingBalance
      });
    }

    // 5. Detect Statement Closing Date
    const monthsMap: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    const monthEnds: Record<string, string> = {
      '01': '31', '02': '28', '03': '31', '04': '30', '05': '31', '06': '30', '07': '31', '08': '31', '09': '30', '10': '31', '11': '30', '12': '31'
    };

    const closingDateMatch = rawText.match(/Closing\s+Balance\s+as\s+on\s*(\d{1,2})[-/\s]+([A-Z]{3}|\d{1,2})[-/\s]+(\d{4})/i) ||
                             rawText.match(/as\s+on\s*(\d{1,2})[-/\s]+([A-Z]{3}|\d{1,2})[-/\s]+(\d{4})/i);
    let statementClosingDate = '';
    if (closingDateMatch) {
      const day = closingDateMatch[1].padStart(2, '0');
      const mStr = closingDateMatch[2].toUpperCase();
      const monthNum = monthsMap[mStr] || mStr.padStart(2, '0');
      const year = closingDateMatch[3];
      statementClosingDate = `${year}-${monthNum}-${day}`;
    }

    // 6. Parse Monthly Contributions
    const monthlyLinesRegex = /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*-\s*(\d{4})\s+([\d,\s]+?)(?=(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|Total|Member|$))/gi;
    let match;
    let lastMonthlyDate = '';

    while ((match = monthlyLinesRegex.exec(rawText)) !== null) {
      const monthWord = match[1].toUpperCase();
      const year = match[2];
      const monthNum = monthsMap[monthWord];
      const day = monthEnds[monthNum] || '30';
      const txDate = `${year}-${monthNum}-${day}`;
      lastMonthlyDate = txDate;

      const numbersInRow = match[3].match(/[\d,]+/g) || [];
      // In TCS EPF tables, if there are 7 numbers in the row:
      // Member Taxable, Member Non-Taxable, Voluntary Taxable, Voluntary Non-Taxable, Company Taxable, Company Non-Taxable, Pension*
      // The 7th column is Pension contribution remitted to RPFC (EPS), which is NOT part of Provident Fund Balance.
      const validNumbers = (numbersInRow.length >= 7) ? numbersInRow.slice(0, 6) : numbersInRow;
      const monthSum = validNumbers.reduce((acc, curr) => acc + parseVal(curr), 0);

      if (monthSum > 0) {
        transactions.push({
          assetName: trustName,
          assetType: 'EPF',
          category: 'Debt',
          identifier: uan,
          type: 'BUY',
          date: txDate,
          quantity: monthSum,
          price: 1.0,
          amount: monthSum
        });
      }
    }

    // 7. Parse Credited Interest
    let interestVal = 0;
    const interestMatch6 = rawText.match(/Member\s+Voluntary\s+Company\s+Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);
    if (interestMatch6) {
      interestVal = parseVal(interestMatch6[1]) + parseVal(interestMatch6[2]) + parseVal(interestMatch6[3]) + parseVal(interestMatch6[4]) + parseVal(interestMatch6[5]) + parseVal(interestMatch6[6]);
    }

    if (interestVal === 0) {
      const interestMatch1 = rawText.match(/Interest\s*(?:\([^\)]+\))?\s*:?\s*([\d,]+(?:\.\d{2})?)/i);
      if (interestMatch1) interestVal = parseVal(interestMatch1[1]);
    }

    const interestDate = statementClosingDate || lastMonthlyDate || `${startYear + 1}-03-31`;

    if (interestVal > 0) {
      transactions.push({
        assetName: trustName,
        assetType: 'EPF',
        category: 'Debt',
        identifier: uan,
        type: 'BUY',
        date: interestDate,
        quantity: interestVal,
        price: 1.0,
        amount: interestVal
      });
    }

    // 8. Parse Net Closing Balance & attach current live valuation
    const closingMatch = rawText.match(/Net\s+Closing\s+Balance\s*(?:\{[^\}]+\})?\s*([\d,]+(?:\.\d{2})?)/i) ||
                         rawText.match(/Total\s+PF\s+balance\s*(?:\([^\)]+\))?\s*:?\s*([\d,]+(?:\.\d{2})?)/i) ||
                         rawText.match(/Closing\s+Balance\b.*?([\d,]+(?:\.\d{2})?)/i);
    if (closingMatch) {
      const netClosingVal = parseVal(closingMatch[1]);
      if (netClosingVal > 0 && transactions.length > 0) {
        for (const tx of transactions) {
          tx.currentPrice = netClosingVal;
        }
      }
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
