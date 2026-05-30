import axios from 'axios';
import { db } from '../db';
import { ParsedTransaction } from './pdfParser';

// Save INDMoney access token securely in local sqlite db
export function saveIndMoneyAccessToken(token: string): void {
  db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('indmoney_access_token', token);
}

// Get INDMoney credentials metadata (check configuration status)
export function getIndMoneyCredentials(): { configured: boolean } {
  const row = db.prepare('SELECT value FROM credentials WHERE key = ?').get('indmoney_access_token') as { value: string } | undefined;
  return {
    configured: !!row?.value
  };
}

// Helper: Fetch dynamic exchange rate from Yahoo Finance for US Stocks (USD -> INR)
export async function getUsdInrRate(): Promise<number> {
  try {
    console.log('Fetching live USD-INR exchange rate from Yahoo Finance...');
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1d&range=1d', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const price = response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price && typeof price === 'number') {
      console.log(`Successfully fetched USD-INR exchange rate: Rs. ${price}`);
      return price;
    }
  } catch (err: any) {
    console.error('Failed to fetch dynamic exchange rate for US Stocks, using fallback 83.5:', err.message);
  }
  return 83.5;
}

// Fetch holdings from INDstocks API and standardize them
export async function fetchIndMoneyHoldings(token: string): Promise<ParsedTransaction[]> {
  try {
    console.log('Requesting holdings from INDstocks portfolio API...');
    
    // Support either pure token paste or full Bearer token
    const authHeader = token.startsWith('Bearer ') || token.startsWith('token ') ? token : `Bearer ${token}`;
    
    const response = await axios.get('https://api.indstocks.com/portfolio/holdings', {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    // Parse response robustly supporting multiple wrapper schemas
    let rawHoldings: any[] = [];
    if (Array.isArray(response.data)) {
      rawHoldings = response.data;
    } else if (Array.isArray(response.data?.data)) {
      rawHoldings = response.data.data;
    } else if (Array.isArray(response.data?.data?.holdings)) {
      rawHoldings = response.data.data.holdings;
    } else {
      console.warn('Holdings payload is empty or not in standard array format:', response.data);
    }
    
    console.log(`Retrieved ${rawHoldings.length} raw portfolio records from INDstocks API.`);
    
    const usdInrRate = await getUsdInrRate();
    const todayStr = new Date().toISOString().split('T')[0];
    const transactions: ParsedTransaction[] = [];
    
    for (const hold of rawHoldings) {
      // 1. Robust key-scanning
      const symbol = String(hold.symbol || hold.tradingsymbol || hold.tradingSymbol || hold.ticker || '').trim().toUpperCase();
      const isin = String(hold.isin || hold.isinCode || hold.isin_code || '').trim().toUpperCase() || null;
      const quantity = Number(hold.quantity || hold.qty || hold.holdingQty || hold.availableQuantity || hold.units || 0);
      const avgPrice = Number(hold.avgPrice || hold.averagePrice || hold.average_price || hold.averageBuyPrice || hold.buyPrice || 0);
      
      if (!symbol || isNaN(quantity) || quantity <= 0 || isNaN(avgPrice) || avgPrice <= 0) {
        continue;
      }
      
      // 2. Detect US Stock exchange or currency
      const exchange = String(hold.exchange || '').trim().toUpperCase();
      const currency = String(hold.currency || '').trim().toUpperCase();
      const isUS = exchange === 'US' || exchange === 'NASDAQ' || exchange === 'NYSE' || currency === 'USD';
      
      // 3. Asset categorization
      const category = symbol.startsWith('SGB') ? 'Alternative' : 'Equity';
      
      // 4. Select standard ticker notation
      let fullTicker = symbol;
      if (isUS || symbol.startsWith('SGB')) {
        // Keep clean without exchange suffix for US Stocks and Sovereign Gold Bonds
        fullTicker = symbol; 
      } else {
        // Standard Indian stock ticker with .NS suffix
        if (!symbol.includes('.') && !symbol.includes('-')) {
          fullTicker = `${symbol}.NS`;
        }
      }
      
      // 5. Convert buy averages from USD to INR if needed
      let priceInr = Number(hold.avgPriceInr || hold.averagePriceInr || hold.average_price_inr || hold.buyPriceInr || 0);
      if (isUS && (!priceInr || priceInr === 0)) {
        priceInr = avgPrice * usdInrRate;
      } else if (!isUS) {
        priceInr = avgPrice;
      }
      
      transactions.push({
        assetName: symbol,
        assetType: 'STOCK',
        category,
        identifier: fullTicker,
        type: 'BUY',
        date: todayStr,
        quantity,
        price: priceInr,
        amount: quantity * priceInr
      });
    }
    
    console.log(`Successfully parsed and mapped ${transactions.length} holdings from INDstocks.`);
    return transactions;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'API request failed';
    console.error('INDstocks fetch holdings failure:', errorMsg);
    throw new Error(`Failed to fetch holdings from INDMoney API: ${errorMsg}`);
  }
}

// Automatically sync INDMoney using stored credentials token if configured
export async function syncIndMoneyHoldingsWithStoredToken(): Promise<ParsedTransaction[] | null> {
  const row = db.prepare('SELECT value FROM credentials WHERE key = ?').get('indmoney_access_token') as { value: string } | undefined;
  if (!row?.value) {
    return null;
  }
  return await fetchIndMoneyHoldings(row.value);
}
