import axios from 'axios';
import crypto from 'crypto';
import { db } from '../db';
import { ParsedTransaction } from './pdfParser';

// Helper to encrypt/store in credentials
export function saveKiteCredentials(apiKey: string, apiSecret: string): void {
  db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('kite_api_key', apiKey);
  db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('kite_api_secret', apiSecret);
}

// Mask secret for safety
export function getKiteCredentials(): { configured: boolean; apiKey: string } {
  const apiKeyRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_api_key') as { value: string } | undefined;
  const apiSecretRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_api_secret') as { value: string } | undefined;
  
  return {
    configured: !!(apiKeyRow?.value && apiSecretRow?.value),
    apiKey: apiKeyRow?.value || ''
  };
}

// Generate authentication login URL
export function getKiteLoginUrl(): string {
  const apiKeyRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_api_key') as { value: string } | undefined;
  if (!apiKeyRow?.value) {
    throw new Error('Zerodha API Key is not configured. Please enter your API Key and Secret first.');
  }
  return `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKeyRow.value}`;
}

// Compute SHA-256 Checksum
function computeChecksum(apiKey: string, requestToken: string, apiSecret: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(apiKey + requestToken + apiSecret);
  return hash.digest('hex');
}

// Exchange Request Token for Access Token and fetch holdings
export async function exchangeKiteToken(requestToken: string): Promise<ParsedTransaction[]> {
  const apiKeyRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_api_key') as { value: string } | undefined;
  const apiSecretRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_api_secret') as { value: string } | undefined;
  
  if (!apiKeyRow?.value || !apiSecretRow?.value) {
    throw new Error('Kite credentials are not configured. Please enter API Key and Secret first.');
  }
  
  const apiKey = apiKeyRow.value;
  const apiSecret = apiSecretRow.value;
  const checksum = computeChecksum(apiKey, requestToken, apiSecret);
  
  console.log(`Exchanging request token with Kite Connect: requestToken=${requestToken.slice(0, 5)}...`);
  
  try {
    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('request_token', requestToken);
    params.append('checksum', checksum);
    
    const response = await axios.post('https://api.kite.trade/session/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3'
      }
    });
    
    const accessToken = response.data?.data?.access_token;
    if (!accessToken) {
      throw new Error('Token exchange response did not contain access_token.');
    }
    
    // Save access token and token date (today's date in YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('kite_access_token', accessToken);
    db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('kite_token_date', todayStr);
    
    console.log('Kite Access Token obtained and stored successfully.');
    
    // Fetch live holdings
    return await fetchKiteHoldings(apiKey, accessToken);
  } catch (error: any) {
    console.error('Kite Token Exchange Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to exchange token with Zerodha Kite.');
  }
}

// Fetch Holdings from Kite using specific credentials
export async function fetchKiteHoldings(apiKey: string, accessToken: string): Promise<ParsedTransaction[]> {
  try {
    console.log(`Fetching holdings from Kite portfolio api using apiKey=${apiKey.slice(0, 4)}...`);
    
    const response = await axios.get('https://api.kite.trade/portfolio/holdings', {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`
      }
    });
    
    const data = response.data;
    if (data.status !== 'success' || !Array.isArray(data.data)) {
      throw new Error(data.message || 'Invalid holdings response status from Kite.');
    }
    
    const holdings = data.data;
    const todayStr = new Date().toISOString().split('T')[0];
    const transactions: ParsedTransaction[] = [];
    
    for (const item of holdings) {
      const symbol = String(item.tradingsymbol || '').trim().toUpperCase();
      const isin = String(item.isin || '').trim().toUpperCase();
      const qty = parseFloat(String(item.quantity));
      const avgPrice = parseFloat(String(item.average_price));
      
      if (!symbol || isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice <= 0) continue;
      
      // Standardize ticker symbols with .NS suffix for stocks, keeping SGB separate
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
        date: todayStr,
        quantity: qty,
        price: avgPrice,
        amount: qty * avgPrice
      });
    }
    
    console.log(`Successfully mapped ${transactions.length} holdings from Kite API.`);
    return transactions;
  } catch (error: any) {
    console.error('Kite Fetch Holdings Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch portfolio holdings from Kite API.');
  }
}

// Try to fetch holdings using stored session token if valid for today
export async function syncKiteHoldingsWithStoredToken(): Promise<ParsedTransaction[] | null> {
  const apiKeyRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_api_key') as { value: string } | undefined;
  const accessTokenRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_access_token') as { value: string } | undefined;
  const tokenDateRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('kite_token_date') as { value: string } | undefined;
  
  if (!apiKeyRow?.value || !accessTokenRow?.value || !tokenDateRow?.value) {
    return null;
  }
  
  const todayStr = new Date().toISOString().split('T')[0];
  if (tokenDateRow.value !== todayStr) {
    console.log('Stored access token has expired (was generated on a different day).');
    return null;
  }
  
  console.log('Stored Kite access token is valid for today. Direct fetching...');
  return await fetchKiteHoldings(apiKeyRow.value, accessTokenRow.value);
}
