const sampleRawText = `--- PAGE 1 ---
Date & Time of Generation:-   31 Jul 2026,20:11:07  TATA CONSULTANCY SERVICES EMPLOYEES' PROVIDENT FUND  9th floor, Nirmal Building, Nariman Point, Mumbai - 400 021  PF Statement for the Financial year   20262027   Universal Account Number(UAN):   100432083045  Emp No   Name   PF No   DOJ PF   Member ID   DOJ EPS  2065164   MR. Prijesh Hiralal Ramani   MH/BAN/48475/2065164   02-Sep-2021   MH/BAN/48475/ 2399040   02-Sep-2021  Opening Balance  Monthly  Contributions for  year   20262027  Month-Year   Member   Voluntary   Company   Pension*  Taxable   Non Taxable   Taxable   Non Taxable   Taxable   Non Taxable  0   9,43,957   0   1,20,124   0   6,77,272  APR -   2026   0   5184   0   0   0   3934   1250  MAY -   2026   0   5184   0   0   0   3934   1250  JUN -   2026   0   5688   0   2676   0   4438   1250  Total   0   16,056   0   2,676   0   12,306   3,750  Total PF balance (I) :   17,72,391  Member   Voluntary   Company  Taxable   Non Taxable   Taxable   Non Taxable   Taxable   NonTaxable  0   19,576   0   2,478   0   14,050  Interest (IV):   36,104  Closing Balance as on   30-JUN-2026  Net Closing Balance   {I+IV}   18,08,495  Provisional Interest Rate(%)   8.25  All the figures in the above statement are in Indian Rupees.`;

function parseEPFStatement(rawText: string) {
  const parseVal = (str: string): number => parseFloat((str || '0').replace(/,/g, '')) || 0;

  // 1. Detect UAN
  const uanMatch = rawText.match(/Universal\s+Account\s+Number\s*\(\s*UAN\s*\)\s*:?\s*(\d{12})/i) ||
                   rawText.match(/UAN\b.*?(\d{12})/i);
  const uan = uanMatch ? uanMatch[1] : '100432083045';

  // 2. Organization / Trust Name
  const trustMatch = rawText.match(/([A-Z0-9\s']+(?:PROVIDENT\s+FUND|EPFO|TRUST)[A-Z0-9\s']*)/i);
  const trustName = trustMatch ? trustMatch[1].trim() : 'TATA CONSULTANCY SERVICES EMPLOYEES\' PROVIDENT FUND';

  // 3. Opening Balance
  let openingBalance = 0;
  const opnBalBlockMatch = rawText.match(/Opening\s+Balance[^]*?Taxable\s+Non\s*Taxable[^]*?\n?\s*([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i) ||
                           rawText.match(/Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+Taxable\s+Non\s*Taxable\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);

  if (opnBalBlockMatch) {
    openingBalance = parseVal(opnBalBlockMatch[1]) + parseVal(opnBalBlockMatch[2]) + parseVal(opnBalBlockMatch[3]) + parseVal(opnBalBlockMatch[4]) + parseVal(opnBalBlockMatch[5]) + parseVal(opnBalBlockMatch[6]);
  }

  // 4. Monthly Contributions
  const monthsMap: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
  };
  const monthEnds: Record<string, string> = {
    '01': '31', '02': '28', '03': '31', '04': '30', '05': '31', '06': '30', '07': '31', '08': '31', '09': '30', '10': '31', '11': '30', '12': '31'
  };

  const monthlyLinesRegex = /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*-\s*(\d{4})\s+([\d,\s]+?)(?=(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|Total|Member|$))/gi;
  const monthlyTxs: any[] = [];

  let match;
  while ((match = monthlyLinesRegex.exec(rawText)) !== null) {
    const monthWord = match[1].toUpperCase();
    const year = match[2];
    const monthNum = monthsMap[monthWord];
    const day = monthEnds[monthNum] || '30';
    const txDate = `${year}-${monthNum}-${day}`;

    // Extract all numbers in the row
    const numbersInRow = match[3].match(/[\d,]+/g) || [];
    const monthSum = numbersInRow.reduce((acc, curr) => acc + parseVal(curr), 0);

    if (monthSum > 0) {
      monthlyTxs.push({
        date: txDate,
        month: `${monthWord}-${year}`,
        amount: monthSum,
        numbers: numbersInRow
      });
    }
  }

  // 5. Interest
  let interestVal = 0;
  const interestMatch = rawText.match(/Interest\s*(?:\([^\)]+\))?\s*:?\s*([\d,]+(?:\.\d{2})?)/i);
  if (interestMatch) {
    interestVal = parseVal(interestMatch[1]);
  }

  // 6. Net Closing Balance
  let closingBalance = 0;
  const closingMatch = rawText.match(/Net\s+Closing\s+Balance\s*(?:\{[^\}]+\})?\s*([\d,]+(?:\.\d{2})?)/i) ||
                       rawText.match(/Total\s+PF\s+balance\s*(?:\([^\)]+\))?\s*:?\s*([\d,]+(?:\.\d{2})?)/i);
  if (closingMatch) {
    closingBalance = parseVal(closingMatch[1]);
  }

  return {
    trustName,
    uan,
    openingBalance,
    monthlyTxs,
    interestVal,
    closingBalance
  };
}

console.log('=== TEST RESULT ===');
console.log(JSON.stringify(parseEPFStatement(sampleRawText), null, 2));
