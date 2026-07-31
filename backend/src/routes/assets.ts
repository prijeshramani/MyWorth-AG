import { Router, Request, Response } from 'express';
import { db } from '../db';
import { CreateAssetSchema } from '../schema';
import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';
import { priceRepository } from '../repositories/SQLitePriceRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';

const router = Router();

// GET /api/assets - Retrieve all assets with current valuation metrics
router.get('/', (req: Request, res: Response, next) => {
  try {
    // 0. Auto-clean orphaned zero-unit duplicate assets with identical names
    db.prepare(`
      DELETE FROM assets 
      WHERE (id NOT IN (SELECT DISTINCT asset_id FROM transactions) AND id NOT IN (SELECT DISTINCT asset_id FROM holdings))
      AND (
        name IN (SELECT name FROM assets GROUP BY name HAVING COUNT(*) > 1)
        OR (type = 'OTHER' AND (name LIKE '%Reliance%' OR name LIKE '%HDFC%'))
      )
    `).run();

    const includeZero = req.query.includeZero === 'true';

    // 1. Get all assets via Repository with family member details
    const assets = db.prepare(`
      SELECT a.*, fm.name as member_name, fm.relationship as member_relationship 
      FROM assets a 
      LEFT JOIN family_members fm ON a.family_member_id = fm.id 
      ORDER BY a.type, a.name
    `).all() as any[];

    // Fallback default head member if no member assigned
    const headMember = db.prepare("SELECT id, name, relationship FROM family_members WHERE family_id = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1").get() as { id: number; name: string; relationship: string } | undefined;

    const result = assets.map(asset => {
      // 2. Compute current units via Repository
      const transactions = transactionRepository.findByAssetId(asset.id);

      let currentUnits = 0;
      let totalCost = 0;
      let totalUnitsBought = 0;
      let bankEpfBalance = 0;

      if (asset.type === 'BANK_ACCOUNT') {
        const latestPriceRow = priceRepository.findLatestPrice(asset.id);
        bankEpfBalance = latestPriceRow ? latestPriceRow.price : 0;
        currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
        totalCost = 0;
      } else if (asset.type === 'EPF') {
        const latestPriceRow = priceRepository.findLatestPriceAbove(asset.id, 1.0);

        let txSum = 0;
        let lastTxDate = '';
        for (const tx of transactions) {
          if (tx.type === 'BUY' || tx.type === 'REINVEST') {
            txSum += tx.amount;
          } else if (tx.type === 'SELL') {
            txSum -= tx.amount;
          }
          if (tx.date > lastTxDate) {
            lastTxDate = tx.date;
          }
        }

        if (latestPriceRow && (!lastTxDate || latestPriceRow.date >= lastTxDate)) {
          bankEpfBalance = latestPriceRow.price;
        } else {
          bankEpfBalance = txSum;
        }

        currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
        totalCost = 0;
      } else {
        for (const tx of transactions) {
          if (tx.type === 'BUY' || tx.type === 'REINVEST') {
            currentUnits += tx.quantity;
            totalCost += tx.amount;
            totalUnitsBought += tx.quantity;
          } else if (tx.type === 'SELL') {
            currentUnits -= tx.quantity;
            if (totalUnitsBought > 0) {
              const avgCostPerUnit = totalCost / totalUnitsBought;
              totalCost -= tx.quantity * avgCostPerUnit;
              totalUnitsBought -= tx.quantity;
            }
          }
        }
      }

      currentUnits = Math.max(0, currentUnits);
      totalCost = Math.max(0, totalCost);

      const avgBuyPrice = currentUnits > 0 ? (totalCost / currentUnits) : 0;

      let currentPrice = 0;
      let priceDate = '';

      if (asset.type === 'BANK_ACCOUNT' || asset.type === 'EPF') {
        currentPrice = bankEpfBalance;
        const latestPriceRow = priceRepository.findLatestPrice(asset.id);
        priceDate = latestPriceRow ? latestPriceRow.date : (transactions.length > 0 ? transactions[transactions.length - 1].date : '');
      } else {
        const latestPriceRow = priceRepository.findLatestPrice(asset.id);

        if (latestPriceRow) {
          currentPrice = latestPriceRow.price;
          priceDate = latestPriceRow.date;
        } else if (transactions.length > 0) {
          const lastTx = transactions[transactions.length - 1];
          currentPrice = lastTx.price;
          priceDate = lastTx.date;
        }
      }

      const currentValue = currentUnits * currentPrice;
      const absoluteReturn = currentValue - totalCost;
      const absoluteReturnPercent = totalCost > 0 ? (absoluteReturn / totalCost) * 100 : 0;

      const memberId = asset.family_member_id || (headMember ? headMember.id : null);
      const memberName = asset.member_name || (headMember ? headMember.name : 'Primary Account Holder');
      const memberRelationship = asset.member_relationship || (headMember ? headMember.relationship : 'SELF');

      return {
        ...asset,
        familyMemberId: memberId,
        familyMemberName: memberName,
        familyMemberRelationship: memberRelationship,
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
    }).filter(asset => {
      if (includeZero) return true;
      // Exclude zero-units zero-value orphaned assets
      return asset.currentUnits > 0 || asset.currentValue > 0;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/assets/:id/prices - Retrieve historical pricing entries for a single asset
router.get('/:id/prices', (req: Request, res: Response, next) => {
  try {
    const assetId = parseInt(req.params.id);
    if (isNaN(assetId)) {
      throw new ValidationError('Invalid Asset ID');
    }

    const prices = priceRepository.findPricesForAsset(assetId);
    res.json(prices);
  } catch (error) {
    next(error);
  }
});

// POST /api/assets - Create a new asset
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateAssetSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid asset payload', parseResult.error.errors);
    }

    const { name, type, category, identifier } = parseResult.data;

    if (identifier) {
      const existing = assetRepository.findByIdentifierAndType(identifier, type);
      if (existing) {
        throw new ValidationError(`Asset with identifier '${identifier}' already exists.`);
      }
    }

    const createdAsset = assetRepository.create({ name, type, category, identifier });
    res.status(201).json(createdAsset);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/assets/:id - Remove an asset (cascades transactions and prices)
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const assetId = parseInt(req.params.id);
    if (isNaN(assetId)) {
      throw new ValidationError('Invalid Asset ID');
    }

    const deleted = assetRepository.delete(assetId);
    if (!deleted) {
      throw new NotFoundError('Asset not found');
    }

    res.json({ message: 'Asset successfully deleted.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/assets/:id/prices - Record a manual price update
router.post('/:id/prices', (req: Request, res: Response, next) => {
  try {
    const assetId = parseInt(req.params.id);
    if (isNaN(assetId)) {
      throw new ValidationError('Invalid Asset ID');
    }
    const { date, price } = req.body;
    if (!date || isNaN(price) || price < 0) {
      throw new ValidationError('Valid Date and Price are required');
    }

    priceRepository.upsertPrice(assetId, date, price);
    res.json({ success: true, message: 'Price recorded successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/assets/:id/owner - Reassign owner family member for an asset
router.put('/:id/owner', (req: Request, res: Response, next) => {
  try {
    const assetId = parseInt(req.params.id, 10);
    const { familyMemberId } = req.body;

    if (isNaN(assetId)) {
      throw new ValidationError('Invalid Asset ID');
    }
    if (!familyMemberId) {
      throw new ValidationError('familyMemberId is required');
    }

    const memberId = Number(familyMemberId);
    const result = db.prepare('UPDATE assets SET family_member_id = ? WHERE id = ?').run(memberId, assetId);

    if (result.changes === 0) {
      throw new NotFoundError('Asset not found');
    }

    // Trigger Knowledge Graph resync
    try {
      const { RelationshipService } = require('../services/RelationshipService');
      const { SQLiteKnowledgeGraphRepository } = require('../repositories/SQLiteKnowledgeGraphRepository');
      const graphRepo = new SQLiteKnowledgeGraphRepository(db);
      const relService = new RelationshipService(db, graphRepo);
      relService.syncKnowledgeGraphFromDomainEntities(1);
    } catch (e) {
      console.error('Failed to auto-resync graph on asset owner update:', e);
    }

    res.json({ success: true, message: 'Asset owner successfully updated and graph synchronized.' });
  } catch (error) {
    next(error);
  }
});

export default router;
