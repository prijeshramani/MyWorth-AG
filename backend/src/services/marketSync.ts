import axios from 'axios';
import { db } from '../db';

// Helper to convert AMFI Date (e.g., "24-May-2026" or "24-05-2026") to YYYY-MM-DD
function parseAmfiDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Format is often DD-MMM-YYYY like "24-May-2026" or DD-MM-YYYY like "24-05-2026"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];
    
    // Ensure day is 2 digits
    if (day.length === 1) day = '0' + day;
    
    // Check if month is word or number
    if (isNaN(Number(month))) {
      // Month is word
      const monthIdx = months.findIndex(m => m.toLowerCase() === month.toLowerCase().slice(0, 3));
      if (monthIdx !== -1) {
        month = String(monthIdx + 1).padStart(2, '0');
      } else {
        month = '01';
      }
    } else if (month.length === 1) {
      month = '0' + month;
    }
    
    return `${year}-${month}-${day}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

// 1. Sync Mutual Funds from AMFI
export async function syncMutualFunds(): Promise<{ success: boolean; updated: number; message: string }> {
  try {
    // Get all mutual funds from DB that have an identifier (ISIN)
    const mfs = db.prepare(`
      SELECT id, identifier, name FROM assets 
      WHERE type = 'MUTUAL_FUND' AND identifier IS NOT NULL AND identifier != ''
    `).all() as Array<{ id: number; identifier: string; name: string }>;

    if (mfs.length === 0) {
      return { success: true, updated: 0, message: 'No Mutual Funds with ISIN to update' };
    }

    console.log(`Syncing ${mfs.length} mutual funds via AMFI...`);

    // Fetch daily AMFI NAV text file
    const response = await axios.get('https://www.amfiindia.com/spages/NAVAll.txt', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const fileContent = response.data as string;
    const lines = fileContent.split('\n');

    // Create a map of ISIN -> { NAV, Date }
    const navMap = new Map<string, { nav: number; date: string }>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Fields format: Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
      const parts = trimmed.split(';');
      if (parts.length >= 5) {
        const isinGrowth = parts[1]?.trim();
        const isinReinvest = parts[2]?.trim();
        const navStr = parts[4]?.trim();
        const dateStr = parts[5]?.trim();
        
        const nav = parseFloat(navStr);
        if (isNaN(nav)) continue;

        const formattedDate = parseAmfiDate(dateStr);

        if (isinGrowth && isinGrowth !== '-') {
          navMap.set(isinGrowth, { nav, date: formattedDate });
        }
        if (isinReinvest && isinReinvest !== '-') {
          navMap.set(isinReinvest, { nav, date: formattedDate });
        }
      }
    }

    let updatedCount = 0;
    const insertPrice = db.prepare(`
      INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
      VALUES (?, ?, ?)
    `);

    // Run in database transaction for maximum atomicity and speed
    const transaction = db.transaction(() => {
      for (const mf of mfs) {
        // CAMS/Karvy statements sometimes list ISIN or multiple ISINs separated by commas. We'll search by exact match
        const isin = mf.identifier.trim();
        const latestData = navMap.get(isin);
        
        if (latestData) {
          insertPrice.run(mf.id, latestData.date, latestData.nav);
          updatedCount++;
        } else {
          console.log(`Could not find NAV in AMFI feed for ISIN: ${isin} (${mf.name})`);
        }
      }
    });

    transaction();

    // Log the sync activity
    db.prepare(`
      INSERT INTO sync_logs (sync_type, status, message)
      VALUES ('AMFI', 'SUCCESS', ?)
    `).run(`Successfully updated ${updatedCount}/${mfs.length} Mutual Fund prices.`);

    return {
      success: true,
      updated: updatedCount,
      message: `Updated ${updatedCount}/${mfs.length} Mutual Fund NAVs.`
    };
  } catch (error: any) {
    console.error('AMFI MF Sync Error:', error);
    db.prepare(`
      INSERT INTO sync_logs (sync_type, status, message)
      VALUES ('AMFI', 'FAILED', ?)
    `).run(`Error: ${error.message || 'Unknown error'}`);

    return {
      success: false,
      updated: 0,
      message: error.message || 'AMFI request failed'
    };
  }
}

// Helper to get live exchange rate for stocks sync
async function getUsdInrRateForSync(): Promise<number> {
  try {
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1d&range=1d', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const price = response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price && typeof price === 'number') {
      return price;
    }
  } catch (err: any) {
    console.error('Failed to fetch dynamic exchange rate for stock sync:', err.message);
  }
  return 83.5;
}

// 2. Sync Stock Prices from Yahoo Finance
export async function syncStocks(): Promise<{ success: boolean; updated: number; message: string }> {
  try {
    // Get all stocks from DB with an identifier (e.g. RELIANCE.NS, TCS.NS, AAPL)
    const stocks = db.prepare(`
      SELECT id, identifier, name FROM assets 
      WHERE type = 'STOCK' AND identifier IS NOT NULL AND identifier != ''
    `).all() as Array<{ id: number; identifier: string; name: string }>;

    if (stocks.length === 0) {
      return { success: true, updated: 0, message: 'No Stocks with tickers to update' };
    }

    console.log(`Syncing ${stocks.length} stocks via Yahoo Finance...`);
    let updatedCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // We fetch the USDINR rate once per sync cycle if needed
    let usdInrRate: number | null = null;

    const insertPrice = db.prepare(`
      INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
      VALUES (?, ?, ?)
    `);

    for (const stock of stocks) {
      try {
        let ticker = stock.identifier.trim();
        let price = 0;
        let currency = 'INR';
        let dateVal = todayStr;
        let fetched = false;

        // Try direct ticker fetch first (ideal for US stocks like AAPL, TSLA or tickers with existing suffixes)
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
          const response = await axios.get(url, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });
          
          const meta = response.data?.chart?.result?.[0]?.meta;
          if (meta && typeof meta.regularMarketPrice === 'number') {
            price = meta.regularMarketPrice;
            currency = meta.currency || 'INR';
            if (meta.regularMarketTime) {
              dateVal = new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0];
            }
            fetched = true;
            console.log(`Yahoo direct lookup success for: ${ticker} | Price: ${price} | Currency: ${currency}`);
          }
        } catch (e) {
          // Direct fetch failed (expected for Indian stocks without a suffix like INFY, TCS)
        }

        // If direct fetch failed, try standard Indian stock ticker format with .NS suffix
        if (!fetched) {
          try {
            let nsTicker = ticker;
            if (!nsTicker.includes('.') && !/^\d+$/.test(nsTicker)) {
              nsTicker = `${nsTicker}.NS`;
            }
            
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${nsTicker}?interval=1d&range=1d`;
            const response = await axios.get(url, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0'
              }
            });
            
            const meta = response.data?.chart?.result?.[0]?.meta;
            if (meta && typeof meta.regularMarketPrice === 'number') {
              price = meta.regularMarketPrice;
              currency = meta.currency || 'INR';
              if (meta.regularMarketTime) {
                dateVal = new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0];
              }
              fetched = true;
              console.log(`Yahoo .NS suffix lookup success for: ${nsTicker} | Price: ${price} | Currency: ${currency}`);
            }
          } catch (innerError: any) {
            console.error(`Failed to fetch Yahoo price for stock ticker after fallback: ${stock.identifier}`, innerError.message);
          }
        }

        if (fetched) {
          // Dynamic conversion: if stock is traded in USD, multiply by exchange rate
          if (currency === 'USD') {
            if (usdInrRate === null) {
              usdInrRate = await getUsdInrRateForSync();
            }
            price = price * usdInrRate;
            console.log(`Dynamic conversion: ${stock.identifier} is denominated in USD. Converted to INR ${price} (rate: ${usdInrRate})`);
          }
          
          insertPrice.run(stock.id, dateVal, price);
          updatedCount++;
        }
      } catch (err: any) {
        console.error(`Unexpected error syncing stock ${stock.identifier}:`, err.message);
      }
    }

    db.prepare(`
      INSERT INTO sync_logs (sync_type, status, message)
      VALUES ('YAHOO', 'SUCCESS', ?)
    `).run(`Successfully updated ${updatedCount}/${stocks.length} Stock prices.`);

    return {
      success: true,
      updated: updatedCount,
      message: `Updated ${updatedCount}/${stocks.length} Stock prices.`
    };
  } catch (error: any) {
    console.error('Yahoo Stock Sync Error:', error);
    db.prepare(`
      INSERT INTO sync_logs (sync_type, status, message)
      VALUES ('YAHOO', 'FAILED', ?)
    `).run(`Error: ${error.message || 'Unknown error'}`);

    return {
      success: false,
      updated: 0,
      message: error.message || 'Yahoo Finance sync failed'
    };
  }
}

// Coordinator Sync
export async function syncAllAssets(): Promise<{ mf: any; stocks: any }> {
  console.log('Initiating sync process for all assets...');
  const mfResult = await syncMutualFunds();
  const stockResult = await syncStocks();
  return { mf: mfResult, stocks: stockResult };
}
