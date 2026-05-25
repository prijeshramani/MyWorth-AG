import { ParsedTransaction } from './pdfParser';

export function parseZerodhaXmlStatement(xmlBuffer: Buffer): { statementType: string; transactions: ParsedTransaction[]; rawText: string } {
  const rawText = xmlBuffer.toString('utf8');
  const transactions: ParsedTransaction[] = [];

  // Parse contract notes
  const contractMatches = [...rawText.matchAll(/<contract>([\s\S]*?)<\/contract>/gi)];
  console.log(`Found ${contractMatches.length} contracts in XML.`);

  for (const match of contractMatches) {
    const contractContent = match[1];
    
    // Extract contract date
    const dateMatch = contractContent.match(/<timestamp>([\s\S]*?)<\/timestamp>/i);
    const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];

    // Extract trades section
    const tradesMatch = contractContent.match(/<trades>([\s\S]*?)<\/trades>/i);
    if (!tradesMatch) continue;

    const tradesSection = tradesMatch[1];
    const tradeMatches = [...tradesSection.matchAll(/<trade([\s\S]*?)>([\s\S]*?)<\/trade>/gi)];

    for (const tradeMatch of tradeMatches) {
      const tradeContent = tradeMatch[2];

      const symbolMatch = tradeContent.match(/<description>([\s\S]*?)<\/description>/i);
      const symbol = symbolMatch ? symbolMatch[1].trim().toUpperCase() : '';

      const exchangeMatch = tradeContent.match(/<exchange>([\s\S]*?)<\/exchange>/i);
      const exchange = exchangeMatch ? exchangeMatch[1].trim().toUpperCase() : 'NSE';

      const typeMatch = tradeContent.match(/<type>([\s\S]*?)<\/type>/i);
      const type = typeMatch ? typeMatch[1].trim().toUpperCase() : 'BUY';

      const qtyMatch = tradeContent.match(/<quantity>([\s\S]*?)<\/quantity>/i);
      const quantity = qtyMatch ? parseFloat(qtyMatch[1].trim()) : 0;

      const priceMatch = tradeContent.match(/<average_price>([\s\S]*?)<\/average_price>/i);
      const price = priceMatch ? parseFloat(priceMatch[1].trim()) : 0;

      const valueMatch = tradeContent.match(/<value>([\s\S]*?)<\/value>/i);
      const value = valueMatch ? parseFloat(valueMatch[1].trim()) : quantity * price;

      if (!symbol || quantity <= 0 || price <= 0) continue;

      const suffix = exchange === 'BSE' ? '.BO' : '.NS';
      const fullTicker = `${symbol}${suffix}`;

      const txType: ParsedTransaction['type'] = type === 'SELL' ? 'SELL' : 'BUY';

      transactions.push({
        assetName: symbol,
        assetType: 'STOCK',
        category: 'Equity',
        identifier: fullTicker,
        type: txType,
        date,
        quantity,
        price,
        amount: Math.abs(value)
      });
    }
  }

  console.log(`Successfully parsed ${transactions.length} stock transactions from Zerodha XML.`);

  return {
    statementType: 'ZERODHA_XML',
    transactions,
    rawText
  };
}
