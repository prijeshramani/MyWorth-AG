import { Router, Request, Response } from 'express';
import { CreateTransactionSchema, ManualAssetWithTransactionSchema } from '../schema';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';
import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { priceRepository } from '../repositories/SQLitePriceRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';

const router = Router();

// GET /api/transactions - Get full transaction ledger with filters
router.get('/', (req: Request, res: Response, next) => {
  try {
    const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : null;
    const type = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;

    const txs = transactionRepository.findAll({
      assetId: assetId && !isNaN(assetId) ? assetId : null,
      type,
      limit
    });

    res.json(txs);
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions - Add a manual transaction
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid transaction payload', parseResult.error.errors);
    }

    const { asset_id, type, date, quantity, price, amount, source } = parseResult.data;

    // Check if asset exists via Repository
    const asset = assetRepository.findById(asset_id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const createdTx = transactionRepository.create({
      asset_id,
      type,
      date,
      quantity,
      price,
      amount,
      source
    });

    // Update asset_prices with this price if it's the latest date
    const latestPrice = priceRepository.findLatestPrice(asset_id);
    if (!latestPrice || date >= latestPrice.date) {
      priceRepository.upsertPrice(asset_id, date, price);
    }

    res.status(201).json(createdTx);
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions/manual - Create asset + transaction in one go
router.post('/manual', (req: Request, res: Response, next) => {
  try {
    const parseResult = ManualAssetWithTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid manual asset/transaction payload', parseResult.error.errors);
    }

    const { asset, transaction } = parseResult.data;

    const createdAssetId = transactionRepository.createManualWithAsset(asset, transaction);
    res.status(201).json({ success: true, assetId: createdAssetId });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const txId = parseInt(req.params.id);
    if (isNaN(txId)) {
      throw new ValidationError('Invalid Transaction ID');
    }

    const deleted = transactionRepository.delete(txId);
    if (!deleted) {
      throw new NotFoundError('Transaction not found');
    }

    res.json({ message: 'Transaction successfully deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
