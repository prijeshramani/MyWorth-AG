import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

interface AssetHolding {
  id: number;
  name: string;
  type: string;
  category: string;
  identifier: string | null;
}

interface PricePoint {
  asset_id: number;
  date: string;
  price: number;
}

interface Transaction {
  asset_id: number;
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST' | 'BONUS';
  date: string;
  quantity: number;
  price: number;
  amount: number;
}

// GET /api/dashboard - Aggregated stats for the local dashboard
router.get('/', (req: Request, res: Response) => {
  try {
    // 1. Fetch all assets
    const assets = db.prepare(`SELECT * FROM assets`).all() as AssetHolding[];

    // 2. Fetch all transactions chronologically
    const transactions = db.prepare(`
      SELECT asset_id, type, date, quantity, price, amount FROM transactions
      ORDER BY date ASC, id ASC
    `).all() as Transaction[];

    // 3. Fetch all historical prices
    const prices = db.prepare(`
      SELECT asset_id, date, price FROM asset_prices
      ORDER BY date ASC
    `).all() as PricePoint[];

    // Map to group prices by asset_id and date for O(1) lookups
    const priceMap = new Map<string, number>();
    const latestPriceMap = new Map<number, { price: number; date: string }>();

    for (const p of prices) {
      priceMap.set(`${p.asset_id}_${p.date}`, p.price);
      
      const currentLatest = latestPriceMap.get(p.asset_id);
      if (!currentLatest || p.date >= currentLatest.date) {
        latestPriceMap.set(p.asset_id, { price: p.price, date: p.date });
      }
    }

    // 4. Calculate current values for all assets
    const currentAssetHoldings = new Map<number, { units: number; cost: number; lastTxPrice: number }>();
    
    // Initialize map
    for (const asset of assets) {
      currentAssetHoldings.set(asset.id, { units: 0, cost: 0, lastTxPrice: 0 });
    }

    for (const tx of transactions) {
      const holding = currentAssetHoldings.get(tx.asset_id);
      if (!holding) continue;

      if (tx.type === 'BUY' || tx.type === 'REINVEST') {
        holding.units += tx.quantity;
        holding.cost += tx.amount;
      } else if (tx.type === 'SELL') {
        // Reduce units
        const unitsBefore = holding.units;
        holding.units = Math.max(0, holding.units - tx.quantity);
        // Reduce cost proportionally based on average cost per unit
        if (unitsBefore > 0) {
          const avgCost = holding.cost / unitsBefore;
          holding.cost = Math.max(0, holding.cost - (tx.quantity * avgCost));
        }
      }
      holding.lastTxPrice = tx.price;
    }

    // 5. Compute summary KPIs
    let totalWorth = 0;
    let totalCost = 0;
    const typeBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};

    for (const asset of assets) {
      const holding = currentAssetHoldings.get(asset.id);
      if (!holding || holding.units === 0) continue;

      // Get latest price
      const latestPriceInfo = latestPriceMap.get(asset.id);
      const currentPrice = latestPriceInfo ? latestPriceInfo.price : holding.lastTxPrice;
      const currentValue = holding.units * currentPrice;

      totalWorth += currentValue;
      totalCost += holding.cost;

      // Class breakdowns
      typeBreakdown[asset.type] = (typeBreakdown[asset.type] || 0) + currentValue;
      categoryBreakdown[asset.category] = (categoryBreakdown[asset.category] || 0) + currentValue;
    }

    const totalProfit = totalWorth - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // 6. Fetch recent activity (5 items)
    const recentActivity = db.prepare(`
      SELECT t.*, a.name as asset_name, a.type as asset_type 
      FROM transactions t
      JOIN assets a ON t.asset_id = a.id
      ORDER BY t.date DESC, t.id DESC
      LIMIT 5
    `).all() as any[];

    // 7. Calculate historical timeline growth (e.g. last 30 days)
    // We generate data points for the timeline
    const timelineData: Array<{ date: string; value: number }> = [];
    const today = new Date();
    const daysToSync = 30; // Last 30 days of net worth trend

    // Generate date keys
    const dates: string[] = [];
    for (let i = daysToSync; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // For each date, calculate valuation
    for (const dStr of dates) {
      let dateWorth = 0;
      
      // Calculate units of each asset on this date D
      const assetUnitsOnDate = new Map<number, number>();
      const assetLastPriceOnDate = new Map<number, number>();

      // Filter transactions up to date D
      for (const tx of transactions) {
        if (tx.date > dStr) continue;

        const currentUnits = assetUnitsOnDate.get(tx.asset_id) || 0;
        if (tx.type === 'BUY' || tx.type === 'REINVEST') {
          assetUnitsOnDate.set(tx.asset_id, currentUnits + tx.quantity);
        } else if (tx.type === 'SELL') {
          assetUnitsOnDate.set(tx.asset_id, Math.max(0, currentUnits - tx.quantity));
        }
        // Remember last transaction price before or on D
        assetLastPriceOnDate.set(tx.asset_id, tx.price);
      }

      // Value each asset on date D
      for (const asset of assets) {
        const units = assetUnitsOnDate.get(asset.id) || 0;
        if (units === 0) continue;

        // Try to get price on date D or preceding dates
        let assetPrice = 0;
        
        // Scan backwards from date D to find a price in priceMap
        let foundPrice = false;
        let scanDate = new Date(dStr);
        for (let s = 0; s < 15; s++) { // check up to 15 days in past for price points
          const scanDateStr = scanDate.toISOString().split('T')[0];
          const priceKey = `${asset.id}_${scanDateStr}`;
          const cachedPrice = priceMap.get(priceKey);
          
          if (cachedPrice !== undefined) {
            assetPrice = cachedPrice;
            foundPrice = true;
            break;
          }
          scanDate.setDate(scanDate.getDate() - 1);
        }

        // If no historical price point, fallback to last transaction price before/on D
        if (!foundPrice) {
          assetPrice = assetLastPriceOnDate.get(asset.id) || 0;
        }

        dateWorth += units * assetPrice;
      }

      // Only push dates that actually have wealth (skip initial empty days for better chart look)
      if (dateWorth > 0 || timelineData.length > 0) {
        timelineData.push({
          date: dStr,
          value: Math.round(dateWorth * 100) / 100
        });
      }
    }

    // Default to at least one data point if empty
    if (timelineData.length === 0) {
      timelineData.push({ date: today.toISOString().split('T')[0], value: totalWorth });
    }

    res.json({
      summary: {
        totalWorth: Math.round(totalWorth * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        profitPercent: Math.round(profitPercent * 100) / 100
      },
      typeBreakdown,
      categoryBreakdown,
      recentActivity,
      timelineData
    });
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
