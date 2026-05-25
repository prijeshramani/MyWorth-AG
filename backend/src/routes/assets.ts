import { Router, Request, Response } from 'express';
import { db } from '../db';
import { CreateAssetSchema } from '../schema';

const router = Router();

// GET /api/assets - Retrieve all assets with current valuation metrics
router.get('/', (req: Request, res: Response) => {
  try {
    // 1. Get all assets
    const assets = db.prepare(`SELECT * FROM assets ORDER BY type, name`).all() as any[];

    const result = assets.map(asset => {
      // 2. Compute current units
      // BUY, REINVEST add to quantity; SELL subtracts
      const transactions = db.prepare(`
        SELECT type, quantity, price, amount, date FROM transactions 
        WHERE asset_id = ?
        ORDER BY date ASC
      `).all(asset.id) as Array<{ type: string; quantity: number; price: number; amount: number; date: string }>;

      let currentUnits = 0;
      let totalCost = 0;
      let totalUnitsBought = 0;

      for (const tx of transactions) {
        if (tx.type === 'BUY' || tx.type === 'REINVEST') {
          currentUnits += tx.quantity;
          totalCost += tx.amount;
          totalUnitsBought += tx.quantity;
        } else if (tx.type === 'SELL') {
          // Weighted cost reduction or simple subtraction
          currentUnits -= tx.quantity;
          // Standard cost basis calculation: reduce cost proportionally
          if (totalUnitsBought > 0) {
            const avgCostPerUnit = totalCost / totalUnitsBought;
            totalCost -= tx.quantity * avgCostPerUnit;
            totalUnitsBought -= tx.quantity;
          }
        }
      }

      // Ensure units and cost don't drop below 0 due to rounding
      currentUnits = Math.max(0, currentUnits);
      totalCost = Math.max(0, totalCost);

      const avgBuyPrice = currentUnits > 0 ? (totalCost / currentUnits) : 0;

      // 3. Get latest price from asset_prices
      const latestPriceRow = db.prepare(`
        SELECT price, date FROM asset_prices 
        WHERE asset_id = ? 
        ORDER BY date DESC LIMIT 1
      `).get(asset.id) as { price: number; date: string } | undefined;

      // Fallback: If no price is synced, use the last transaction price, or 0
      let currentPrice = 0;
      let priceDate = '';

      if (latestPriceRow) {
        currentPrice = latestPriceRow.price;
        priceDate = latestPriceRow.date;
      } else if (transactions.length > 0) {
        const lastTx = transactions[transactions.length - 1];
        currentPrice = lastTx.price;
        priceDate = lastTx.date;
      }

      const currentValue = currentUnits * currentPrice;
      const absoluteReturn = currentValue - totalCost;
      const absoluteReturnPercent = totalCost > 0 ? (absoluteReturn / totalCost) * 100 : 0;

      return {
        ...asset,
        currentUnits,
        totalCost,
        avgBuyPrice,
        currentPrice,
        currentValue,
        absoluteReturn,
        absoluteReturnPercent,
        priceDate,
        lastTransactionDate: transactions.length > 0 ? transactions[transactions.length - 1].date : ''
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/assets - Create a new asset (e.g. manual asset, or preset)
router.post('/', (req: Request, res: Response) => {
  try {
    const parseResult = CreateAssetSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.format() });
    }

    const { name, type, category, identifier } = parseResult.data;

    // Check if asset already exists with same identifier (if identifier is specified)
    if (identifier) {
      const existing = db.prepare(`
        SELECT id FROM assets WHERE identifier = ? AND type = ?
      `).get(identifier, type);
      
      if (existing) {
        return res.status(400).json({ error: `Asset with identifier '${identifier}' already exists.` });
      }
    }

    const result = db.prepare(`
      INSERT INTO assets (name, type, category, identifier)
      VALUES (?, ?, ?, ?)
    `).run(name, type, category, identifier || null);

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      name,
      type,
      category,
      identifier: identifier || null
    });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/assets/:id - Remove an asset (cascades transactions and prices)
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const assetId = parseInt(req.params.id);
    if (isNaN(assetId)) {
      return res.status(400).json({ error: 'Invalid Asset ID' });
    }

    const info = db.prepare('DELETE FROM assets WHERE id = ?').run(assetId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset successfully deleted.' });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
