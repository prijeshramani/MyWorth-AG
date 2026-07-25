import { Router, Request, Response } from 'express';
import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';
import { priceRepository } from '../repositories/SQLitePriceRepository';

const router = Router();

// GET /api/dashboard - Aggregated stats for the local dashboard
router.get('/', (req: Request, res: Response, next) => {
  try {
    // 1. Fetch all assets via Repository
    const assets = assetRepository.findAll();

    // 2. Fetch all transactions chronologically via Repository
    const transactions = transactionRepository.findAll({ limit: 100000 });

    // 3. Fetch all historical prices via Repository
    const prices = priceRepository.findAllPrices();

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
      if (asset.type === 'BANK_ACCOUNT') {
        const latestPriceInfo = latestPriceMap.get(asset.id);
        const balance = latestPriceInfo ? latestPriceInfo.price : 0;
        currentAssetHoldings.set(asset.id, { units: balance > 0 ? 1.0 : 0, cost: 0, lastTxPrice: balance });
      } else if (asset.type === 'EPF') {
        const latestPriceInfo = priceRepository.findLatestPriceAbove(asset.id, 1.0);

        // Sum transactions
        const assetTxs = transactions.filter(t => t.asset_id === asset.id);
        let txSum = 0;
        let lastTxDate = '';
        for (const tx of assetTxs) {
          if (tx.type === 'BUY' || tx.type === 'REINVEST') {
            txSum += tx.amount;
          } else if (tx.type === 'SELL') {
            txSum -= tx.amount;
          }
          if (tx.date > lastTxDate) {
            lastTxDate = tx.date;
          }
        }

        let balance = 0;
        if (latestPriceInfo && (!lastTxDate || latestPriceInfo.date >= lastTxDate)) {
          balance = latestPriceInfo.price;
        } else {
          balance = txSum;
        }

        currentAssetHoldings.set(asset.id, { units: balance > 0 ? 1.0 : 0, cost: 0, lastTxPrice: balance });
      } else {
        currentAssetHoldings.set(asset.id, { units: 0, cost: 0, lastTxPrice: 0 });
      }
    }

    for (const tx of transactions) {
      const asset = assets.find(a => a.id === tx.asset_id);
      if (!asset || asset.type === 'BANK_ACCOUNT' || asset.type === 'EPF') continue;

      const holding = currentAssetHoldings.get(tx.asset_id);
      if (!holding) continue;

      if (tx.type === 'BUY' || tx.type === 'REINVEST') {
        holding.units += tx.quantity;
        holding.cost += tx.amount;
      } else if (tx.type === 'SELL') {
        const unitsBefore = holding.units;
        holding.units = Math.max(0, holding.units - tx.quantity);
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

      const latestPriceInfo = latestPriceMap.get(asset.id);
      const currentPrice = latestPriceInfo ? latestPriceInfo.price : holding.lastTxPrice;
      const currentValue = holding.units * currentPrice;

      totalWorth += currentValue;
      totalCost += holding.cost;

      typeBreakdown[asset.type] = (typeBreakdown[asset.type] || 0) + currentValue;
      categoryBreakdown[asset.category] = (categoryBreakdown[asset.category] || 0) + currentValue;
    }

    const totalProfit = totalWorth - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // 6. Fetch recent activity (5 items)
    const recentActivity = transactionRepository.findAll({ limit: 5 });

    // 7. Calculate historical timeline growth
    const timelineData: Array<{ date: string; value: number }> = [];
    const today = new Date();
    const daysToSync = 30;

    const dates: string[] = [];
    for (let i = daysToSync; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    for (const dStr of dates) {
      let dateWorth = 0;
      
      const assetUnitsOnDate = new Map<number, number>();
      const assetLastPriceOnDate = new Map<number, number>();

      for (const tx of transactions) {
        if (tx.date > dStr) continue;

        const currentUnits = assetUnitsOnDate.get(tx.asset_id) || 0;
        if (tx.type === 'BUY' || tx.type === 'REINVEST') {
          assetUnitsOnDate.set(tx.asset_id, currentUnits + tx.quantity);
        } else if (tx.type === 'SELL') {
          assetUnitsOnDate.set(tx.asset_id, Math.max(0, currentUnits - tx.quantity));
        }
        assetLastPriceOnDate.set(tx.asset_id, tx.price);
      }

      for (const asset of assets) {
        let units = 0;
        let assetPrice = 0;

        if (asset.type === 'BANK_ACCOUNT') {
          let foundPrice = false;
          let scanDate = new Date(dStr);
          for (let s = 0; s < 30; s++) {
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

          if (foundPrice) {
            units = 1.0;
          }
        } else if (asset.type === 'EPF') {
          let manualBalance = 0;
          let manualBalanceDate = '';
          let scanDate = new Date(dStr);
          for (let s = 0; s < 60; s++) {
            const scanDateStr = scanDate.toISOString().split('T')[0];
            const priceKey = `${asset.id}_${scanDateStr}`;
            const cachedPrice = priceMap.get(priceKey);
            if (cachedPrice !== undefined && cachedPrice > 1.0) {
              manualBalance = cachedPrice;
              manualBalanceDate = scanDateStr;
              break;
            }
            scanDate.setDate(scanDate.getDate() - 1);
          }

          let txSum = 0;
          let lastTxDate = '';
          for (const tx of transactions) {
            if (tx.asset_id === asset.id && tx.date <= dStr) {
              if (tx.type === 'BUY' || tx.type === 'REINVEST') {
                txSum += tx.amount;
              } else if (tx.type === 'SELL') {
                txSum -= tx.amount;
              }
              if (tx.date > lastTxDate) {
                lastTxDate = tx.date;
              }
            }
          }

          let balance = 0;
          if (manualBalance > 0 && (!lastTxDate || manualBalanceDate >= lastTxDate)) {
            balance = manualBalance;
          } else {
            balance = txSum;
          }

          if (balance > 0) {
            units = 1.0;
            assetPrice = balance;
          }
        } else {
          units = assetUnitsOnDate.get(asset.id) || 0;
          if (units === 0) continue;

          let foundPrice = false;
          let scanDate = new Date(dStr);
          for (let s = 0; s < 15; s++) {
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

          if (!foundPrice) {
            assetPrice = assetLastPriceOnDate.get(asset.id) || 0;
          }
        }

        dateWorth += units * assetPrice;
      }

      if (dateWorth > 0 || timelineData.length > 0) {
        timelineData.push({
          date: dStr,
          value: Math.round(dateWorth * 100) / 100
        });
      }
    }

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
  } catch (error) {
    next(error);
  }
});

export default router;
