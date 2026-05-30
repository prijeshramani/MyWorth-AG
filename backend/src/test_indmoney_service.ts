import { fetchIndMoneyHoldings, saveIndMoneyAccessToken, getIndMoneyCredentials } from './services/indmoneyService';
import { db } from './db';

// Mock holdings response from INDstocks REST API
const mockHoldingsResponse = {
  status: true,
  message: "SUCCESS",
  data: [
    {
      symbol: "INFY",
      isin: "INE009A01021",
      exchange: "NSE",
      quantity: 10,
      avgPrice: 1450.00,
      currency: "INR"
    },
    {
      symbol: "TSLA",
      isin: "US88160R1014",
      exchange: "NASDAQ",
      quantity: 5,
      avgPrice: 175.50, // Denominated in USD
      currency: "USD"
    },
    {
      symbol: "SGBJAN29X",
      isin: "IN0020180256",
      exchange: "NSE",
      quantity: 20,
      avgPrice: 5800.00, // Denominated in INR
      currency: "INR"
    }
  ]
};

// Mock Yahoo Finance USDINR chart response
const mockExchangeRateResponse = {
  chart: {
    result: [
      {
        meta: {
          regularMarketPrice: 83.50,
          currency: "INR"
        }
      }
    ],
    error: null
  }
};

async function testIndMoneyIntegration() {
  console.log('====================================================');
  console.log('🤖 STARTING INDMONEY INTEGRATION TEST 🤖');
  console.log('====================================================\n');

  // Test 1: Verify Credentials Save & Read local state
  console.log('--- Test 1: SQLite Credentials Access ---');
  try {
    saveIndMoneyAccessToken('mock_indmoney_token_123');
    const creds = getIndMoneyCredentials();
    
    console.log(`Saved token configured status: ${creds.configured}`);
    if (!creds.configured) {
      throw new Error('SQLite credentials failed to save or read.');
    }
    
    const readRow = db.prepare('SELECT value FROM credentials WHERE key = ?').get('indmoney_access_token') as { value: string } | undefined;
    if (readRow?.value !== 'mock_indmoney_token_123') {
      throw new Error(`Token mismatch: expected "mock_indmoney_token_123", got "${readRow?.value}"`);
    }
    
    console.log('✅ Local credentials read/write successfully verified!');
  } catch (err: any) {
    console.error('❌ Credentials test failed:', err.message);
    process.exit(1);
  }

  // Test 2: Verify Holdings & US Stock Conversion Mapping
  console.log('\n--- Test 2: holdings Ingestion & Currency Conversion ---');
  const axios = require('axios');
  const originalGet = axios.get;

  // Mock axios get call to intercept endpoints
  axios.get = async (url: string, config: any) => {
    console.log(`[MOCKED AXIOS GET] Intercepted URL: ${url}`);
    if (url.includes('api.indstocks.com/portfolio/holdings')) {
      return { data: mockHoldingsResponse };
    }
    if (url.includes('query1.finance.yahoo.com/v8/finance/chart/USDINR=X')) {
      return { data: mockExchangeRateResponse };
    }
    throw new Error(`Unexpected axios GET request to: ${url}`);
  };

  try {
    const transactions = await fetchIndMoneyHoldings('mock_indmoney_token_123');

    console.log('\n--- Parse Ingestion Results ---');
    console.log(`Successfully mapped ${transactions.length} holdings from INDstocks API!`);
    
    transactions.forEach((tx, i) => {
      console.log(`[${i + 1}] Ticker: ${tx.identifier} | Name: ${tx.assetName} | Qty: ${tx.quantity} | Avg Price: Rs. ${tx.price.toFixed(2)} | Amount: Rs. ${tx.amount.toFixed(2)} | Category: ${tx.category}`);
    });

    // 1. Assertions on INFY (NSE Indian Stock)
    const infy = transactions.find(t => t.assetName === 'INFY');
    if (!infy) throw new Error('INFY stock was not parsed!');
    if (infy.identifier !== 'INFY.NS') throw new Error(`INFY ticker suffix error: expected INFY.NS, got ${infy.identifier}`);
    if (infy.quantity !== 10) throw new Error(`INFY quantity error: expected 10, got ${infy.quantity}`);
    if (infy.price !== 1450.00) throw new Error(`INFY price error: expected 1450.00, got ${infy.price}`);
    if (infy.category !== 'Equity') throw new Error(`INFY category error: expected Equity, got ${infy.category}`);

    // 2. Assertions on TSLA (US Stock, USD-to-INR Conversion)
    const tsla = transactions.find(t => t.assetName === 'TSLA');
    if (!tsla) throw new Error('TSLA US stock was not parsed!');
    if (tsla.identifier !== 'TSLA') throw new Error(`TSLA US ticker error: expected TSLA without suffix, got ${tsla.identifier}`);
    if (tsla.quantity !== 5) throw new Error(`TSLA quantity error: expected 5, got ${tsla.quantity}`);
    
    // Price expected = 175.50 * 83.50 = 14,654.25
    const expectedTslaPrice = 175.50 * 83.50;
    if (Math.abs(tsla.price - expectedTslaPrice) > 0.01) {
      throw new Error(`TSLA USD price conversion mismatch: expected Rs. ${expectedTslaPrice}, got Rs. ${tsla.price}`);
    }
    if (tsla.category !== 'Equity') throw new Error(`TSLA category error: expected Equity, got ${tsla.category}`);

    // 3. Assertions on SGBJAN29X (Alternative Gold Bond)
    const sgb = transactions.find(t => t.assetName === 'SGBJAN29X');
    if (!sgb) throw new Error('SGB was not parsed!');
    if (sgb.identifier !== 'SGBJAN29X') throw new Error(`SGB ticker notation error: expected SGBJAN29X, got ${sgb.identifier}`);
    if (sgb.quantity !== 20) throw new Error(`SGB quantity error: expected 20, got ${sgb.quantity}`);
    if (sgb.price !== 5800.00) throw new Error(`SGB price error: expected 5800.00, got ${sgb.price}`);
    if (sgb.category !== 'Alternative') throw new Error(`SGB category error: expected Alternative, got ${sgb.category}`);

    console.log('\n✅ All INDMoney holdings mapping and USD currency conversion assertions passed successfully!');

    // Clean up DB test tokens
    db.prepare('DELETE FROM credentials WHERE key = ?').run('indmoney_access_token');
    
  } catch (err: any) {
    console.error('❌ INDMoney holdings mapping test failed:', err.message);
    process.exit(1);
  } finally {
    axios.get = originalGet; // Restore original axios function
  }
}

testIndMoneyIntegration();
