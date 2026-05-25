import { fetchKiteHoldings } from './services/kiteService';

// Mock holdings response from Zerodha API
const mockHoldingsResponse = {
  status: "success",
  data: [
    {
      tradingsymbol: "INFY",
      exchange: "NSE",
      instrument_token: 408065,
      isin: "INE009A01021",
      product: "CNC",
      quantity: 80,
      average_price: 1434.4694,
      last_price: 1550.0
    },
    {
      tradingsymbol: "ITC",
      exchange: "NSE",
      instrument_token: 408066,
      isin: "INE154A01025",
      product: "CNC",
      quantity: 265,
      average_price: 280.9637,
      last_price: 300.2
    },
    {
      tradingsymbol: "SGBJAN29X-GB",
      exchange: "NSE",
      instrument_token: 408067,
      isin: "IN0020200424",
      product: "CNC",
      quantity: 1,
      average_price: 5054.0,
      last_price: 6100.0
    },
    {
      tradingsymbol: "TATAPOWER",
      exchange: "NSE",
      instrument_token: 408068,
      isin: "INE245A01021",
      product: "CNC",
      quantity: 317,
      average_price: 301.3808,
      last_price: 412.5
    }
  ]
};

// Create a mock fetch test
async function testKiteMapping() {
  console.log('Testing Kite Connect Holdings API mapping logic...');
  
  // Since we want to test parsing logic without hitting real Zerodha servers,
  // we can mock the axios GET function that gets called inside fetchKiteHoldings.
  const axios = require('axios');
  const originalGet = axios.get;
  
  axios.get = async (url: string, config: any) => {
    console.log(`[MOCKED AXIOS GET] URL: ${url}`);
    return {
      data: mockHoldingsResponse
    };
  };
  
  try {
    const transactions = await fetchKiteHoldings('mock_api_key', 'mock_access_token');
    
    console.log('\n--- Parse Ingestion Results ---');
    console.log(`Successfully mapped ${transactions.length} holdings from Zerodha Kite Connect API!`);
    
    transactions.forEach((tx, i) => {
      console.log(`[${i + 1}] Ticker: ${tx.identifier} | Name: ${tx.assetName} | Qty: ${tx.quantity} | Avg Price: Rs. ${tx.price.toFixed(2)} | Category: ${tx.category}`);
    });
    
    // Assertions
    const infy = transactions.find(t => t.assetName === 'INFY');
    if (!infy || infy.identifier !== 'INFY.NS' || infy.category !== 'Equity' || infy.quantity !== 80) {
      throw new Error('INFY mapping failed validation!');
    }
    
    const sgb = transactions.find(t => t.assetName === 'SGBJAN29X-GB');
    if (!sgb || sgb.identifier !== 'SGBJAN29X-GB' || sgb.category !== 'Alternative' || sgb.quantity !== 1) {
      throw new Error('SGB mapping failed validation!');
    }
    
    console.log('\n✅ All Kite Connect holdings mapping assertions passed successfully!');
  } catch (err: any) {
    console.error('❌ Kite mapping test failed:', err.message);
    process.exit(1);
  } finally {
    axios.get = originalGet; // Restore original axios function
  }
}

testKiteMapping();
