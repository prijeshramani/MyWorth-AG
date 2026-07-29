import axios from 'axios';
import * as crypto from 'crypto';
import { credentialRepository } from '../repositories/SQLiteCredentialRepository';
import { ParsedTransaction } from './pdfParser';

// Helper: Decode Base32 to hex string with digit replacement for typos (0->O, 1->I, 8->B, 9->G)
function base32tohex(base32: string): string {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";

  // Replace common typos in Base32 (0->O, 1->I, 8->B, 9->G)
  const cleanBase32 = base32.toUpperCase()
    .replace(/[\s\=\-]/g, "")
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/8/g, 'B')
    .replace(/9/g, 'G');

  for (let i = 0; i < cleanBase32.length; i++) {
    const val = base32chars.indexOf(cleanBase32.charAt(i));
    if (val === -1) {
      throw new Error(`Invalid Base32 character '${cleanBase32.charAt(i)}' in secret key.`);
    }
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

// Helper: Convert decimal to hex
function dec2hex(s: number): string {
  return (s < 0 ? "-" : "") + Math.abs(s).toString(16);
}

// Helper: Dynamic 6-digit TOTP generator from secret key using node:crypto
export function generateTOTP(secret: string): string {
  try {
    const trimmed = (secret || '').trim();
    if (!trimmed) {
      throw new Error('TOTP Secret key is required.');
    }

    // Case A: User entered the 6-digit TOTP PIN directly (e.g., "982341")
    if (/^\d{6}$/.test(trimmed)) {
      return trimmed;
    }

    // Case B: User provided a Base32 or Hex secret key
    let keyHex: string;
    if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0 && !/^[A-Z2-7]+$/i.test(trimmed)) {
      keyHex = trimmed;
    } else {
      keyHex = base32tohex(trimmed);
    }

    const epoch = Math.floor(new Date().getTime() / 1000.0);
    const time = Math.floor(epoch / 30).toString(16).padStart(16, '0');

    // HMAC-SHA-1 using native Node.js crypto module
    const hmac = crypto.createHmac('sha1', Buffer.from(keyHex, 'hex'));
    const hmacResult = hmac.update(Buffer.from(time, 'hex')).digest('hex');

    // Dynamic Truncation
    const offset = parseInt(hmacResult.substring(hmacResult.length - 1), 16);
    const binary = parseInt(hmacResult.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff;
    const otp = (binary % 1000000).toString();
    return otp.padStart(6, '0');
  } catch (err: any) {
    throw new Error(`Failed to generate TOTP from secret: ${err.message}`);
  }
}

// Save AngelOne credentials securely in local sqlite db
export function saveAngelOneCredentials(clientCode: string, passwordSec: string, apiKey: string, totpSecret: string): void {
  credentialRepository.saveCredential('angelone_client_code', clientCode);
  credentialRepository.saveCredential('angelone_password', passwordSec);
  credentialRepository.saveCredential('angelone_api_key', apiKey);
  credentialRepository.saveCredential('angelone_totp_secret', totpSecret);
}

// Get AngelOne credentials metadata (with masked passwords for security)
export function getAngelOneCredentials(): {
  clientCode: string;
  hasPassword: boolean;
  apiKey: string;
  hasTotpSecret: boolean;
  hasSession: boolean;
} {
  const clientCode = credentialRepository.getCredential('angelone_client_code') || '';
  const password = credentialRepository.getCredential('angelone_password') || '';
  const apiKey = credentialRepository.getCredential('angelone_api_key') || '';
  const totpSecret = credentialRepository.getCredential('angelone_totp_secret') || '';
  
  // Check session token validity
  const sessionToken = credentialRepository.getCredential('angelone_session_token');
  const sessionDate = credentialRepository.getCredential('angelone_session_date');
  const todayStr = new Date().toISOString().split('T')[0];
  const hasSession = !!sessionToken && sessionDate === todayStr;

  return {
    clientCode,
    hasPassword: !!password,
    apiKey,
    hasTotpSecret: !!totpSecret,
    hasSession
  };
}

// Full authentication exchange flow with SmartAPI
export async function authenticateAngelOne(): Promise<string> {
  const clientCode = credentialRepository.getCredential('angelone_client_code') || '';
  const password = credentialRepository.getCredential('angelone_password') || '';
  const apiKey = credentialRepository.getCredential('angelone_api_key') || '';
  const totpSecret = credentialRepository.getCredential('angelone_totp_secret') || '';

  if (!clientCode || !password || !apiKey || !totpSecret) {
    throw new Error('AngelOne SmartAPI credentials are incomplete. Please configure Client Code, Password, API Key, and TOTP Secret.');
  }

  // 1. Generate active 6-digit TOTP
  const totp = generateTOTP(totpSecret);
  console.log(`Generated dynamic 2FA TOTP: ${totp} for Client: ${clientCode}`);

  try {
    // 2. Perform Login Request
    const response = await axios.post(
      'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword',
      {
        clientcode: clientCode,
        password: password,
        totp: totp
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-PrivateKey': apiKey,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '192.168.1.1',
          'X-ClientPublicIP': '106.193.147.99',
          'X-MACAddress': '00-00-00-00-00-00'
        }
      }
    );

    if (response.data?.status === false || !response.data?.data?.jwtToken) {
      const msg = response.data?.message || 'Authentication rejected by AngelOne.';
      throw new Error(msg);
    }

    const jwtToken = response.data.data.jwtToken;
    const todayStr = new Date().toISOString().split('T')[0];

    // Save session in credentials DB
    credentialRepository.saveCredential('angelone_session_token', jwtToken);
    credentialRepository.saveCredential('angelone_session_date', todayStr);

    console.log('AngelOne SmartAPI authentication successful, stored daily session token.');
    return jwtToken;
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || 'Network communication failure.';
    console.error('AngelOne login error:', errorMsg);
    throw new Error(`AngelOne Login Failed: ${errorMsg}`);
  }
}

// Fetch and map holdings from AngelOne SmartAPI
export async function syncAngelOneHoldings(): Promise<ParsedTransaction[]> {
  const getVal = (key: string) => {
    return credentialRepository.getCredential(key) || '';
  };

  let jwtToken = getVal('angelone_session_token');
  const sessionDate = getVal('angelone_session_date');
  const todayStr = new Date().toISOString().split('T')[0];
  const apiKey = getVal('angelone_api_key');

  // Authenticate if session is empty or expired
  if (!jwtToken || sessionDate !== todayStr) {
    console.log('Stored AngelOne session token is missing or expired. Starting new authentication...');
    jwtToken = await authenticateAngelOne();
  } else {
    console.log('Re-using active AngelOne session token.');
  }

  try {
    // Fetch Portfolio Holdings
    const response = await axios.get(
      'https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getHolding',
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-PrivateKey': apiKey,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '192.168.1.1',
          'X-ClientPublicIP': '106.193.147.99',
          'X-MACAddress': '00-00-00-00-00-00'
        }
      }
    );

    if (response.data?.status === false || !Array.isArray(response.data?.data)) {
      const msg = response.data?.message || 'Failed to fetch holdings from SmartAPI.';
      throw new Error(msg);
    }

    const rawHoldings = response.data.data;
    console.log(`Retrieved ${rawHoldings.length} raw stock holdings from AngelOne.`);

    const transactions: ParsedTransaction[] = rawHoldings.map((hold: any) => {
      // Standardize ticker name (e.g. INFY-EQ or INFY -> INFY)
      const rawTicker = (hold.tradingsymbol || '').replace(/-EQ$/i, '').trim().toUpperCase();
      
      // Select appropriate suffix for Yahoo Finance
      const exchange = (hold.exchange || 'NSE').toUpperCase();
      const suffix = exchange === 'BSE' ? '.BO' : '.NS';
      const fullTicker = rawTicker.includes('.') ? rawTicker : `${rawTicker}${suffix}`;

      const quantity = Number(hold.quantity || hold.isinquantity || 0);
      const avgPrice = Number(hold.averageprice || 0);
      const amount = quantity * avgPrice;

      return {
        assetName: rawTicker,
        assetType: 'STOCK',
        category: 'Equity',
        identifier: fullTicker,
        type: 'BUY',
        date: todayStr,
        quantity,
        price: avgPrice,
        amount
      };
    });

    return transactions;
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || 'Network communication failure.';
    
    // If it failed with 401/Invalid Token, clear stored token and re-throw with suggestion
    if (err.response?.status === 401 || errorMsg.toLowerCase().includes('token')) {
      credentialRepository.saveCredential('angelone_session_token', '');
      credentialRepository.saveCredential('angelone_session_date', '');
      throw new Error(`AngelOne Session expired. Please try syncing again to re-authenticate.`);
    }

    throw new Error(`Failed to retrieve holdings from AngelOne SmartAPI: ${errorMsg}`);
  }
}
