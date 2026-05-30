import { generateTOTP, syncAngelOneHoldings } from './services/angeloneService';
import { db } from './db';

// Mock holdings response from AngelOne SmartAPI Connect
const mockHoldingsResponse = {
  status: true,
  message: "SUCCESS",
  errorcode: "",
  data: [
    {
      tradingsymbol: "INFY-EQ",
      symboltoken: "1594",
      isin: "INE009A01021",
      exchange: "NSE",
      isinquantity: 50,
      quantity: 50,
      authorisedquantity: 0,
      t1quantity: 0,
      realisedquantity: 50,
      product: "DELIVERY",
      collateralquantity: null,
      collateraltype: null,
      haircut: 0.0,
      averageprice: 1420.5,
      ltp: 1435.2,
      close: 1430.1,
      profitandloss: 735.0,
      pnlpercentage: 1.03
    },
    {
      tradingsymbol: "ITC-EQ",
      symboltoken: "1660",
      isin: "INE154A01025",
      exchange: "NSE",
      isinquantity: 120,
      quantity: 120,
      authorisedquantity: 0,
      t1quantity: 0,
      realisedquantity: 120,
      product: "DELIVERY",
      collateralquantity: null,
      collateraltype: null,
      haircut: 0.0,
      averageprice: 410.25,
      ltp: 430.0,
      close: 428.5,
      profitandloss: 2370.0,
      pnlpercentage: 4.81
    },
    {
      tradingsymbol: "TCS-EQ",
      symboltoken: "11585",
      isin: "INE467B01029",
      exchange: "BSE",
      isinquantity: 15,
      quantity: 15,
      authorisedquantity: 0,
      t1quantity: 0,
      realisedquantity: 15,
      product: "DELIVERY",
      collateralquantity: null,
      collateraltype: null,
      haircut: 0.0,
      averageprice: 3600.0,
      ltp: 3820.0,
      close: 3810.0,
      profitandloss: 3300.0,
      pnlpercentage: 6.11
    }
  ]
};

async function testAngelOneIntegration() {
  console.log('====================================================');
  console.log('🤖 STARTING ANGELONE SMARTAPI INTEGRATION TEST 🤖');
  console.log('====================================================\n');

  // Test 1: Verify 2FA TOTP Generation
  console.log('--- Test 1: Dynamic TOTP 2FA Verification ---');
  // Standard test secret (Base32 representation of a key)
  const testSecret = 'NBSWY3DPEB3W64TBNQ';
  try {
    const totp = generateTOTP(testSecret);
    console.log(`Generated TOTP for NBSWY3DPEB3W64TBNQ: ${totp}`);
    if (!/^\d{6}$/.test(totp)) {
      throw new Error(`Generated TOTP "${totp}" is not a valid 6-digit numeric code.`);
    }
    console.log('✅ TOTP generator produced a valid 6-digit code!');
  } catch (err: any) {
    console.error('❌ TOTP generator failed:', err.message);
    process.exit(1);
  }

  // Test 2: Verify SmartAPI Holdings Mapping
  console.log('\n--- Test 2: SmartAPI Holdings Mapping Validation ---');
  const axios = require('axios');
  const originalGet = axios.get;

  // Mock axios get call
  axios.get = async (url: string, config: any) => {
    console.log(`[MOCKED AXIOS GET] Intercepted URL: ${url}`);
    if (url.includes('/getHolding')) {
      return { data: mockHoldingsResponse };
    }
    throw new Error(`Unexpected axios GET request to: ${url}`);
  };

  try {
    // Setup temporary mock credentials in DB to bypass authenticate call
    db.transaction(() => {
      db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('angelone_session_token', 'mock_jwt_token');
      db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('angelone_session_date', new Date().toISOString().split('T')[0]);
      db.prepare('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)').run('angelone_api_key', 'mock_api_key');
    })();

    const transactions = await syncAngelOneHoldings();

    console.log('\n--- Parse Ingestion Results ---');
    console.log(`Successfully mapped ${transactions.length} holdings from AngelOne SmartAPI!`);
    
    transactions.forEach((tx, i) => {
      console.log(`[${i + 1}] Ticker: ${tx.identifier} | Name: ${tx.assetName} | Qty: ${tx.quantity} | Avg Price: Rs. ${tx.price.toFixed(2)} | Category: ${tx.category}`);
    });

    // Assertions on INFY-EQ (NSE)
    const infy = transactions.find(t => t.assetName === 'INFY');
    if (!infy) throw new Error('INFY stock was not parsed!');
    if (infy.identifier !== 'INFY.NS') throw new Error(`INFY ticker suffix error: expected INFY.NS, got ${infy.identifier}`);
    if (infy.quantity !== 50) throw new Error(`INFY quantity error: expected 50, got ${infy.quantity}`);
    if (infy.price !== 1420.5) throw new Error(`INFY average price error: expected 1420.5, got ${infy.price}`);
    if (infy.category !== 'Equity') throw new Error(`INFY category error: expected Equity, got ${infy.category}`);

    // Assertions on TCS-EQ (BSE)
    const tcs = transactions.find(t => t.assetName === 'TCS');
    if (!tcs) throw new Error('TCS stock was not parsed!');
    if (tcs.identifier !== 'TCS.BO') throw new Error(`TCS ticker suffix error: expected TCS.BO, got ${tcs.identifier}`);
    if (tcs.quantity !== 15) throw new Error(`TCS quantity error: expected 15, got ${tcs.quantity}`);
    if (tcs.price !== 3600.0) throw new Error(`TCS average price error: expected 3600.0, got ${tcs.price}`);
    if (tcs.category !== 'Equity') throw new Error(`TCS category error: expected Equity, got ${tcs.category}`);

    console.log('\n✅ All AngelOne SmartAPI holdings mapping assertions passed successfully!');
    
    // Clean up db mock configs
    db.transaction(() => {
      db.prepare('DELETE FROM credentials WHERE key IN (?, ?, ?)').run('angelone_session_token', 'angelone_session_date', 'angelone_api_key');
    })();

  } catch (err: any) {
    console.error('❌ AngelOne holdings mapping test failed:', err.message);
    process.exit(1);
  } finally {
    axios.get = originalGet; // Restore original axios function
  }
}

testAngelOneIntegration();
