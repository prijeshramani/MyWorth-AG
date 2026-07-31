import axios from 'axios';
import { credentialRepository } from '../repositories/SQLiteCredentialRepository';
import { ParsedTransaction } from './pdfParser';

// Save Upstox API credentials securely in local sqlite db
export function saveUpstoxCredentials(apiKey: string, apiSecret: string, redirectUri?: string): void {
  credentialRepository.saveCredential('upstox_api_key', apiKey.trim());
  credentialRepository.saveCredential('upstox_api_secret', apiSecret.trim());
  if (redirectUri) {
    credentialRepository.saveCredential('upstox_redirect_uri', redirectUri.trim());
  }
}

// Get Upstox credentials configuration status
export function getUpstoxCredentials(): {
  configured: boolean;
  apiKey: string;
  redirectUri: string;
  hasAccessToken: boolean;
  tokenDate: string;
} {
  const apiKey = credentialRepository.getCredential('upstox_api_key') || '';
  const apiSecret = credentialRepository.getCredential('upstox_api_secret') || '';
  const redirectUri = credentialRepository.getCredential('upstox_redirect_uri') || 'http://localhost:5173/';
  const accessToken = credentialRepository.getCredential('upstox_access_token') || '';
  const tokenDate = credentialRepository.getCredential('upstox_token_date') || '';

  return {
    configured: !!(apiKey && apiSecret),
    apiKey,
    redirectUri,
    hasAccessToken: !!accessToken,
    tokenDate
  };
}

// Generate OAuth login URL for Upstox Connect
export function getUpstoxLoginUrl(): string {
  const apiKey = credentialRepository.getCredential('upstox_api_key');
  const redirectUri = credentialRepository.getCredential('upstox_redirect_uri') || 'http://localhost:5173/';

  if (!apiKey) {
    throw new Error('Upstox API Key is not configured. Please enter your API Key and Secret first.');
  }

  const encodedRedirect = encodeURIComponent(redirectUri);
  return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${encodedRedirect}`;
}

// Exchange Auth Code for Access Token and fetch holdings
export async function exchangeUpstoxCode(code: string): Promise<ParsedTransaction[]> {
  const apiKey = credentialRepository.getCredential('upstox_api_key');
  const apiSecret = credentialRepository.getCredential('upstox_api_secret');
  const redirectUri = credentialRepository.getCredential('upstox_redirect_uri') || 'http://localhost:5173/';

  if (!apiKey || !apiSecret) {
    throw new Error('Upstox API Key or Secret not configured.');
  }

  console.log(`Exchanging authorization code with Upstox API: code=${code.slice(0, 6)}...`);

  try {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', apiKey);
    params.append('client_secret', apiSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    const accessToken = response.data?.access_token;
    if (!accessToken) {
      throw new Error('Upstox token response did not contain access_token.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    credentialRepository.saveCredential('upstox_access_token', accessToken);
    credentialRepository.saveCredential('upstox_token_date', todayStr);

    console.log('Upstox Access Token obtained and saved successfully.');

    return await fetchUpstoxHoldings(accessToken);
  } catch (error: any) {
    console.error('Upstox Code Exchange Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to exchange authorization code with Upstox API.');
  }
}

// Fetch Holdings directly using an Access Token
export async function fetchUpstoxHoldings(accessToken: string): Promise<ParsedTransaction[]> {
  try {
    console.log(`Fetching long-term holdings from Upstox API...`);

    const response = await axios.get('https://api.upstox.com/v2/portfolio/long-term-holdings', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const data = response.data?.data;
    if (!Array.isArray(data)) {
      console.warn('Upstox API returned non-array payload for holdings:', response.data);
      return [];
    }

    console.log(`Upstox returned ${data.length} long-term holding items.`);
    const todayStr = new Date().toISOString().split('T')[0];

    const parsedTxs: ParsedTransaction[] = data.map((item: any) => {
      const quantity = Math.abs(parseFloat(item.quantity || item.holding_quantity || 0));
      const avgPrice = parseFloat(item.average_price || item.avg_price || 0);
      const lastPrice = parseFloat(item.last_price || item.close_price || item.last_traded_price || avgPrice || 0);
      const isin = item.isin || item.isin_code || null;
      const rawSymbol = item.trading_symbol || item.symbol || item.company_name || 'UNKNOWN';
      const companyName = item.company_name || rawSymbol;

      const isinCode = isin ? isin.trim() : null;
      const buyPrice = avgPrice > 0 ? avgPrice : lastPrice;
      const livePrice = lastPrice > 0 ? lastPrice : buyPrice;

      return {
        assetName: `${companyName} (${rawSymbol})`,
        assetType: 'STOCK',
        category: 'Equity',
        identifier: isinCode || rawSymbol,
        type: 'BUY',
        date: todayStr,
        quantity,
        price: buyPrice,
        currentPrice: livePrice,
        amount: Math.round((quantity * buyPrice) * 100) / 100
      };
    });

    return parsedTxs;
  } catch (error: any) {
    console.error('Upstox Fetch Holdings Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch holdings from Upstox API.');
  }
}

// Sync using stored access token if valid for today
export async function syncUpstoxHoldingsWithStoredToken(): Promise<ParsedTransaction[]> {
  const accessToken = credentialRepository.getCredential('upstox_access_token');
  const tokenDate = credentialRepository.getCredential('upstox_token_date');
  const todayStr = new Date().toISOString().split('T')[0];

  if (!accessToken || tokenDate !== todayStr) {
    throw new Error('Upstox session expired or not initialized. Please click Login with Upstox to authenticate.');
  }

  return await fetchUpstoxHoldings(accessToken);
}
