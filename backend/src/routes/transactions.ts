import { Router, Request, Response } from 'express';
import { db } from '../db';
import { CreateTransactionSchema, ManualAssetWithTransactionSchema } from '../schema';

const router = Router();

// GET /api/transactions - Get full transaction ledger with filters
router.get('/', (req: Request, res: Response) => {
  try {
    const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : null;
    const type = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;

    let query = `
      SELECT t.*, a.name as asset_name, a.type as asset_type, a.category as asset_category 
      FROM transactions t
      JOIN assets a ON t.asset_id = a.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (assetId && !isNaN(assetId)) {
      conditions.push('t.asset_id = ?');
      params.push(assetId);
    }

    if (type) {
      conditions.push('t.type = ?');
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.date DESC, t.id DESC LIMIT ?';
    params.push(limit);

    const txs = db.prepare(query).all(...params);
    res.json(txs);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/transactions - Add a manual transaction
router.post('/', (req: Request, res: Response) => {
  try {
    const parseResult = CreateTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.format() });
    }

    const { asset_id, type, date, quantity, price, amount, source } = parseResult.data;

    // Check if asset exists
    const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(asset_id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const result = db.prepare(`
      INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(asset_id, type, date, quantity, price, amount, source);

    // Also update asset_prices with this price if it's the latest date to keep valuations fresh!
    const latestPrice = db.prepare(`
      SELECT date FROM asset_prices WHERE asset_id = ? ORDER BY date DESC LIMIT 1
    `).get(asset_id) as { date: string } | undefined;

    if (!latestPrice || date >= latestPrice.date) {
      db.prepare(`
        INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
        VALUES (?, ?, ?)
      `).run(asset_id, date, price);
    }

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      asset_id,
      type,
      date,
      quantity,
      price,
      amount,
      source
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/transactions/manual - Create asset + transaction in one go (convenience helper)
router.post('/manual', (req: Request, res: Response) => {
  try {
    const parseResult = ManualAssetWithTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.format() });
    }

    const { asset, transaction } = parseResult.data;

    let assetId: number;

    // Run in a single DB transaction to guarantee consistency
    const runInTransaction = db.transaction(() => {
      // 1. Create asset (or fetch if identifier already exists)
      if (asset.identifier) {
        const existing = db.prepare('SELECT id FROM assets WHERE identifier = ? AND type = ?').get(asset.identifier, asset.type) as { id: number } | undefined;
        if (existing) {
          assetId = existing.id;
        } else {
          const res = db.prepare(`
            INSERT INTO assets (name, type, category, identifier)
            VALUES (?, ?, ?, ?)
          `).run(asset.name, asset.type, asset.category, asset.identifier);
          assetId = Number(res.lastInsertRowid);
        }
      } else {
        const res = db.prepare(`
          INSERT INTO assets (name, type, category, identifier)
          VALUES (?, ?, ?, ?)
        `).run(asset.name, asset.type, asset.category, null);
        assetId = Number(res.lastInsertRowid);
      }

      // 2. Add transaction if provided
      if (transaction) {
        db.prepare(`
          INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source)
          VALUES (?, ?, ?, ?, ?, ?, 'MANUAL')
        `).run(assetId, transaction.type, transaction.date, transaction.quantity, transaction.price, transaction.amount);

        // Populate asset price
        db.prepare(`
          INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
          VALUES (?, ?, ?)
        `).run(assetId, transaction.date, transaction.price);
      }

      return assetId;
    });

    const createdAssetId = runInTransaction();
    res.status(201).json({ success: true, assetId: createdAssetId });
  } catch (error: any) {
    console.error('Error creating manual asset/transaction:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const txId = parseInt(req.params.id);
    if (isNaN(txId)) {
      return res.status(400).json({ error: 'Invalid Transaction ID' });
    }

    const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(txId);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction successfully deleted.' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
