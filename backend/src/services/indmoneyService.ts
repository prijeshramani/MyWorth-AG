import axios from 'axios';
import * as crypto from 'crypto';
import { credentialRepository } from '../repositories/SQLiteCredentialRepository';
import { ParsedTransaction } from './pdfParser';

// Helper: Decode Base32 to hex string for TOTP calculation
function base32tohex(base32: string): string {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";

  const cleanBase32 = base32.toUpperCase()
    .replace(/[\s\=\-]/g, "")
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/8/g, 'B')
    .replace(/9/g, 'G');

  for (let i = 0; i < cleanBase32.length; i++) {
    const val = base32chars.indexOf(cleanBase32.charAt(i));
    if (val === -1) {
      throw new Error(`Invalid Base32 character '${cleanBase32.charAt(i)}' in TOTP secret key.`);
    }
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

function dec2hex(s: number): string {
  return (s < 0 ? "-" : "") + Math.abs(s).toString(16);
}

// Helper: Dynamic 6-digit TOTP generator from secret key using node:crypto
export function generateIndMoneyTOTP(secret: string): string {
  const trimmed = (secret || '').trim();
  if (!trimmed) {
    throw new Error('TOTP Secret key is required.');
  }

  if (/^\d{6}$/.test(trimmed)) {
    return trimmed;
  }

  let keyHex: string;
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0 && !/^[A-Z2-7]+$/i.test(trimmed)) {
    keyHex = trimmed;
  } else {
    keyHex = base32tohex(trimmed);
  }

  const epoch = Math.floor(Date.now() / 1000);
  const time = dec2hex(Math.floor(epoch / 30)).padStart(16, '0');

  const hmacObj = crypto.createHmac('sha1', Buffer.from(keyHex, 'hex'));
  hmacObj.update(Buffer.from(time, 'hex'));
  const hmac = hmacObj.digest('hex');

  const offset = parseInt(hmac.substring(hmac.length - 1), 16);
  const otp = (parseInt(hmac.substr(offset * 2, 8), 16) & 0x7fffffff) + '';
  return otp.substring(otp.length - 6).padStart(6, '0');
}

// Save INDMoney credentials securely in local sqlite db
export function saveIndMoneyCredentials(clientId: string, apiSecret: string, totpSecret: string, accessToken?: string): void {
  credentialRepository.saveCredential('indmoney_client_id', clientId);
  credentialRepository.saveCredential('indmoney_api_secret', apiSecret);
  credentialRepository.saveCredential('indmoney_totp_secret', totpSecret);
  if (accessToken) {
    credentialRepository.saveCredential('indmoney_access_token', accessToken);
  }
}

export function saveIndMoneyAccessToken(token: string): void {
  credentialRepository.saveCredential('indmoney_access_token', token);
}

// Get INDMoney credentials metadata (check configuration status)
export function getIndMoneyCredentials(): { configured: boolean; clientId?: string; hasAccessToken: boolean } {
  const clientId = credentialRepository.getCredential('indmoney_client_id');
  const token = credentialRepository.getCredential('indmoney_access_token');
  const totp = credentialRepository.getCredential('indmoney_totp_secret');
  return {
    configured: !!(clientId || token || totp),
    clientId: clientId || undefined,
    hasAccessToken: !!token
  };
}

// Authenticate with INDstocks API Trading using Client ID, Secret & 2FA TOTP
export async function authenticateIndMoneyApiTrading(clientId: string, apiSecret: string, totpSecret: string): Promise<string> {
  const totpCode = generateIndMoneyTOTP(totpSecret);
  console.log(`Generated dynamic 2FA TOTP code for INDMoney Client ${clientId}: ${totpCode}`);

  const loginEndpoints = [
    'https://api.indstocks.com/v1/auth/login',
    'https://api.indstocks.com/v1/oauth/token',
    'https://api.indstocks.com/portfolio/login',
    'https://api.indmoney.com/v1/auth/login'
  ];

  let tokenReceived = '';
  let lastErr: any = null;

  for (const endpoint of loginEndpoints) {
    try {
      console.log(`Sending TOTP authentication request to INDMoney: ${endpoint}`);
      const res = await axios.post(endpoint, {
        client_id: clientId,
        user_id: clientId,
        api_secret: apiSecret,
        secret: apiSecret,
        totp: totpCode,
        totp_code: totpCode
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      tokenReceived = res.data?.access_token || res.data?.data?.access_token || res.data?.data?.token || res.data?.token || '';
      if (tokenReceived) {
        console.log('Successfully authenticated with INDMoney API Trading using TOTP!');
        saveIndMoneyAccessToken(tokenReceived);
        return tokenReceived;
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`TOTP login endpoint ${endpoint} failed:`, err.response?.data || err.message);
    }
  }

  if (!tokenReceived) {
    const errDetails = lastErr?.response?.data?.message || lastErr?.response?.data?.error || lastErr?.message || 'Authentication Failed';
    throw new Error(`INDMoney TOTP Authentication Failed: ${errDetails}. Verify your Client ID, API Secret, & TOTP Secret from indstocks.com/app/api-trading/access-tokens.`);
  }

  return tokenReceived;
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
  const cleanToken = (token || '').trim();
  if (!cleanToken) {
    throw new Error("INDmoney does not support live API access for fetching US stocks holdings. Please export your statement file (Order Book XLS/XLSX or Consolidated Tax Report XLSX) from the INDmoney app and upload it via the File Upload section in Import Center.");
  }

  const rawToken = cleanToken.replace(/^["'\s]+|["'\s]+$/g, '').replace(/^(Bearer|token)\s+/i, '').trim();
  const clientId = credentialRepository.getCredential('indmoney_client_id') || '';

  const baseHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-app-version': '1.0.0',
    'x-platform': 'web'
  };

  const headerVariants = [
    { 'Authorization': rawToken, ...(clientId ? { 'x-api-key': clientId, 'x-client-id': clientId } : {}), ...baseHeaders },
    { 'Authorization': `Bearer ${rawToken}`, ...(clientId ? { 'x-api-key': clientId } : {}), ...baseHeaders },
    { 'Authorization': `Bearer ${rawToken}`, 'X-Access-Token': rawToken, ...baseHeaders },
    { 'X-Access-Token': rawToken, ...baseHeaders },
    { 'x-auth-token': rawToken, ...baseHeaders },
    { 'authtoken': rawToken, ...baseHeaders }
  ];

  const indianEndpoints = [
    'https://api.indstocks.com/portfolio/holdings',
    'https://api.indstocks.com/portfolio/positions?segment=equity&product=cnc',
    'https://api.indstocks.com/v1/portfolio/holdings',
    'https://api.indstocks.com/v1/user/holdings',
    'https://api.indmoney.com/portfolio/holdings'
  ];

  const usEndpoints = [
    'https://api.indmoney.com/us_stocks/holdings',
    'https://api.indmoney.com/v1/us_stocks/holdings',
    'https://api.indmoney.com/v1/us_stocks/portfolio',
    'https://api.indmoney.com/portfolio/us_stocks',
    'https://api.indstocks.com/v1/us_stocks/holdings'
  ];

  let lastError: any = null;
  let anyEndpointResponded200 = false;
  const allRawHoldings: Array<{ hold: any; isUSFromEndpoint: boolean }> = [];
  function extractHoldingsArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.holdings)) return data.data.holdings;
    if (Array.isArray(data?.holdings)) return data.holdings;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  }

  for (const endpoint of indianEndpoints) {
    let indianSuccess = false;
    for (const reqHeaders of headerVariants) {
      try {
        console.log(`Attempting live INDMoney Indian holdings fetch from: ${endpoint}`);
        const res = await axios.get(endpoint, { headers: reqHeaders, timeout: 8000 });
        if (res.data) {
          anyEndpointResponded200 = true;
          const raw = extractHoldingsArray(res.data);
          if (raw.length > 0) {
            console.log(`Received ${raw.length} Indian stock holdings from ${endpoint}`);
            raw.forEach(h => allRawHoldings.push({ hold: h, isUSFromEndpoint: false }));
            indianSuccess = true;
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Indian holdings attempt failed (${endpoint}):`, err.response?.data?.message || err.message);
      }
    }
    if (indianSuccess) break;
  }

  for (const endpoint of usEndpoints) {
    let usSuccess = false;
    for (const reqHeaders of headerVariants) {
      try {
        console.log(`Attempting live INDMoney US stock holdings fetch from: ${endpoint}`);
        const res = await axios.get(endpoint, { headers: reqHeaders, timeout: 8000 });
        if (res.data) {
          anyEndpointResponded200 = true;
          const raw = extractHoldingsArray(res.data);
          if (raw.length > 0) {
            console.log(`Received ${raw.length} US stock holdings from ${endpoint}`);
            raw.forEach(h => allRawHoldings.push({ hold: h, isUSFromEndpoint: true }));
            usSuccess = true;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`US stock holdings attempt failed (${endpoint}):`, err.response?.data?.message || err.message);
      }
    }
    if (usSuccess) break;
  }

  if (allRawHoldings.length === 0) {
    const status = lastError?.response?.status;
    const errorDetails = lastError?.response?.data?.message || lastError?.response?.data?.error || lastError?.message || 'Network Timeout';
    console.error('All INDMoney live endpoints failed:', status, errorDetails);
    
    saveIndMoneyAccessToken('');

    throw new Error(`INDmoney does not support live API access for fetching US stocks. Please export your US stocks statement (Order Book XLS/XLSX or Consolidated Tax Report XLSX) from the INDmoney app and upload it via the File Upload section in Import Center.`);
  }

  console.log(`Retrieved ${allRawHoldings.length} total portfolio records (Indian + US) from live INDMoney API.`);

  const usdInrRate = await getUsdInrRate();
  const todayStr = new Date().toISOString().split('T')[0];
  const transactions: ParsedTransaction[] = [];
  
  for (const item of allRawHoldings) {
    const hold = item.hold;
    const symbol = String(hold.symbol || hold.tradingsymbol || hold.tradingSymbol || hold.ticker || hold.stock_name || hold.name || '').trim().toUpperCase();
    const quantity = Number(hold.quantity || hold.qty || hold.holdingQty || hold.availableQuantity || hold.units || hold.total_units || 0);
    const avgPrice = Number(hold.avgPrice || hold.averagePrice || hold.average_price || hold.averageBuyPrice || hold.buyPrice || hold.avg_buy_price || 0);
    
    if (!symbol || isNaN(quantity) || quantity <= 0 || isNaN(avgPrice) || avgPrice <= 0) {
      continue;
    }
    
    const exchange = String(hold.exchange || hold.exchange_name || '').trim().toUpperCase();
    const currency = String(hold.currency || hold.currency_type || '').trim().toUpperCase();
    const isUS = item.isUSFromEndpoint || exchange === 'US' || exchange === 'NASDAQ' || exchange === 'NYSE' || currency === 'USD' || hold.is_us_stock === true || hold.asset_type === 'US_STOCK';
    const category = symbol.startsWith('SGB') ? 'Alternative' : 'Equity';
    
    let fullTicker = symbol;
    if (isUS || symbol.startsWith('SGB')) {
      fullTicker = symbol; 
    } else {
      if (!symbol.includes('.') && !symbol.includes('-')) {
        fullTicker = `${symbol}.NS`;
      }
    }
    
    let priceInr = Number(hold.avgPriceInr || hold.averagePriceInr || hold.average_price_inr || hold.buyPriceInr || 0);
    if (isUS && (!priceInr || priceInr === 0)) {
      priceInr = avgPrice * usdInrRate;
    } else if (!isUS) {
      priceInr = avgPrice;
    }
    
    const rawLtp = Number(hold.lastPrice || hold.ltp || hold.last_price || hold.currentPrice || hold.current_price || avgPrice);
    let currentPriceInr = isUS ? (rawLtp * usdInrRate) : rawLtp;
    if (currentPriceInr <= 0) currentPriceInr = priceInr;
    
    transactions.push({
      assetName: symbol,
      assetType: 'STOCK',
      category,
      identifier: fullTicker,
      type: 'BUY',
      date: todayStr,
      quantity,
      price: priceInr,
      currentPrice: currentPriceInr,
      amount: quantity * priceInr
    });
  }
  
  console.log(`Successfully parsed and mapped ${transactions.length} live holdings (Indian + US) from INDMoney.`);
  return transactions;
}

// Automatically sync INDMoney using stored credentials token or TOTP generator
export async function syncIndMoneyHoldings(overrideToken?: string): Promise<ParsedTransaction[]> {
  const clientId = credentialRepository.getCredential('indmoney_client_id');
  const apiSecret = credentialRepository.getCredential('indmoney_api_secret');
  const totpSecret = credentialRepository.getCredential('indmoney_totp_secret');
  let token = (overrideToken || '').trim() || credentialRepository.getCredential('indmoney_access_token') || '';

  if (!token || token.trim() === '') {
    if (clientId && apiSecret && totpSecret) {
      console.log('Authenticating with INDMoney API Trading using stored TOTP credentials...');
      try {
        token = await authenticateIndMoneyApiTrading(clientId, apiSecret, totpSecret);
      } catch (err: any) {
        console.warn('TOTP authentication attempt failed:', err.message);
      }
    }
  }

  if (!token || token.trim() === '') {
    throw new Error("INDmoney does not support live API access for fetching US stocks. Please export your US stocks statement (Order Book XLS/XLSX or Consolidated Tax Report XLSX) from the INDmoney app and upload it via the File Upload section in Import Center.");
  }

  console.log(`Executing live INDMoney holdings fetch with provided token (Length: ${token.length})...`);
  return await fetchIndMoneyHoldings(token);
}
