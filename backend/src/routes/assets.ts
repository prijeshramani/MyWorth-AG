import { Router, Request, Response } from 'express';
import { db } from '../db';
import { CreateAssetSchema } from '../schema';
import { assetRepository } from '../repositories/SQLiteAssetRepository';
import { transactionRepository } from '../repositories/SQLiteTransactionRepository';
import { priceRepository } from '../repositories/SQLitePriceRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { calculateFixedDepositValuation, extractFdMetadata } from '../utils/fdValuation';

const router = Router();

// GET /api/assets - Retrieve all assets with current valuation metrics
router.get('/', (req: Request, res: Response, next) => {
  try {
    // 0. Auto-clean orphaned zero-unit duplicate assets with identical names
    const hasHoldings = !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='holdings'").get();
    const holdingsClause = hasHoldings ? "AND id NOT IN (SELECT DISTINCT asset_id FROM holdings)" : "";
    db.prepare(`
      DELETE FROM assets 
      WHERE (id NOT IN (SELECT DISTINCT asset_id FROM transactions) ${holdingsClause})
      AND (
        name IN (SELECT name FROM assets GROUP BY name HAVING COUNT(*) > 1)
        OR (type = 'OTHER' AND (name LIKE '%Reliance%' OR name LIKE '%HDFC%'))
      )
    `).run();

    const includeZero = req.query.includeZero === 'true';
    const familyIdParam = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;

    // 1. Get all assets via Repository with family member details (filtering by familyId if provided)
    let assetsQuery = `
      SELECT a.*, fm.name as member_name, fm.relationship as member_relationship, fm.family_id 
      FROM assets a 
      LEFT JOIN family_members fm ON a.family_member_id = fm.id 
    `;
    const queryParams: any[] = [];

    if (familyIdParam && !isNaN(familyIdParam)) {
      assetsQuery += ` WHERE fm.family_id = ? OR a.family_member_id IS NULL `;
      queryParams.push(familyIdParam);
    }
    assetsQuery += ` ORDER BY a.type, a.name `;

    const assets = db.prepare(assetsQuery).all(...queryParams) as any[];

    // Fallback default head member if no member assigned
    const targetFamilyId = familyIdParam && !isNaN(familyIdParam) ? familyIdParam : 1;
    const headMember = db.prepare("SELECT id, name, relationship FROM family_members WHERE family_id = ? AND deleted_at IS NULL ORDER BY id ASC LIMIT 1").get(targetFamilyId) as { id: number; name: string; relationship: string } | undefined
      || db.prepare("SELECT id, name, relationship FROM family_members WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1").get() as { id: number; name: string; relationship: string } | undefined;

    const result = assets.map(asset => {
      // 2. Compute current units via Repository
      const transactions = transactionRepository.findByAssetId(asset.id);

      let currentUnits = 0;
      let totalCost = 0;
      let totalUnitsBought = 0;
      let bankEpfBalance = 0;

      if (asset.type === 'FIXED_DEPOSIT') {
        const latestPriceRow = priceRepository.findLatestPrice(asset.id);
        let txSum = 0;
        let firstTxDate = '';
        for (const tx of transactions) {
          if (tx.type === 'BUY' || tx.type === 'REINVEST') {
            txSum += tx.amount;
            if (!firstTxDate || tx.date < firstTxDate) firstTxDate = tx.date;
          } else if (tx.type === 'SELL') {
            txSum -= tx.amount;
          }
        }
        const meta = extractFdMetadata(asset, firstTxDate);
        const fdVal = calculateFixedDepositValuation({
          costBasis: txSum,
          interestRate: meta.interestRate,
          startDateStr: meta.startDate,
          compoundingFrequency: meta.compoundingFrequency
        });
        if (latestPriceRow && latestPriceRow.price !== txSum && latestPriceRow.price > 0) {
          bankEpfBalance = latestPriceRow.price;
        } else {
          bankEpfBalance = fdVal.marketValue > 0 ? fdVal.marketValue : txSum;
        }
        currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
        totalCost = txSum > 0 ? txSum : bankEpfBalance;
      } else if (asset.type === 'BANK_ACCOUNT') {
        const latestPriceRow = priceRepository.findLatestPrice(asset.id);
        let txSum = 0;
        for (const tx of transactions) {
          if (tx.type === 'BUY' || tx.type === 'REINVEST') txSum += tx.amount;
          else if (tx.type === 'SELL') txSum -= tx.amount;
        }
        bankEpfBalance = latestPriceRow ? latestPriceRow.price : txSum;
        currentUnits = bankEpfBalance > 0 ? 1.0 : 0;
        totalCost = txSum > 0 ? txSum : bankEpfBalance;
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

      if (asset.type === 'BANK_ACCOUNT' || asset.type === 'EPF' || asset.type === 'FIXED_DEPOSIT') {
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
    const { metadata, interestRate, maturityAmount, startDate, maturityDate, compoundingFrequency } = req.body;

    if (identifier) {
      const existing = assetRepository.findByIdentifierAndType(identifier, type);
      if (existing) {
        throw new ValidationError(`Asset with identifier '${identifier}' already exists.`);
      }
    }

    let metaStr: string | null = null;
    if (metadata) {
      metaStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    } else if (type === 'FIXED_DEPOSIT' || interestRate || maturityAmount || startDate || maturityDate) {
      metaStr = JSON.stringify({ interestRate, maturityAmount, startDate, maturityDate, compoundingFrequency });
    }

    const createdAsset = assetRepository.create({ name, type, category, identifier });
    if (metaStr && createdAsset?.id) {
      db.prepare('UPDATE assets SET metadata = ? WHERE id = ?').run(metaStr, createdAsset.id);
    }
    res.status(201).json({ ...createdAsset, metadata: metaStr });
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

// PUT /api/assets/:id - Update an existing asset (name, type, category, identifier, owner, valuation)
router.put('/:id', (req: Request, res: Response, next) => {
  try {
    const assetId = parseInt(req.params.id, 10);
    if (isNaN(assetId)) {
      throw new ValidationError('Invalid Asset ID');
    }

    const { name, type, category, identifier, familyMemberId, currentValue, metadata, interestRate, maturityAmount, startDate, maturityDate, compoundingFrequency } = req.body;
    if (!name || !type || !category) {
      throw new ValidationError('Name, type, and category are required.');
    }

    const result = db.prepare(`
      UPDATE assets 
      SET name = ?, type = ?, category = ?, identifier = ?, family_member_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, type, category, identifier || null, familyMemberId || null, assetId);

    let metaStr: string | null = null;
    if (metadata) {
      metaStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    } else if (type === 'FIXED_DEPOSIT' || interestRate || maturityAmount || startDate || maturityDate) {
      metaStr = JSON.stringify({ interestRate, maturityAmount, startDate, maturityDate, compoundingFrequency });
    }

    if (metaStr) {
      db.prepare('UPDATE assets SET metadata = ? WHERE id = ?').run(metaStr, assetId);
    }

    if (result.changes === 0) {
      throw new NotFoundError('Asset not found');
    }

    // Update value/price entry if currentValue was provided
    if (currentValue !== undefined && currentValue !== null && !isNaN(Number(currentValue))) {
      const val = Math.max(0, Number(currentValue));
      const dateStr = new Date().toISOString().split('T')[0];
      priceRepository.upsertPrice(assetId, dateStr, val);

      // Update BUY transaction amount if present
      const tx = db.prepare("SELECT id FROM transactions WHERE asset_id = ? AND type = 'BUY' ORDER BY id ASC LIMIT 1").get(assetId) as { id: number } | undefined;
      if (tx) {
        db.prepare("UPDATE transactions SET amount = ?, price = ? WHERE id = ?").run(val, val, tx.id);
      }
    }

    // Trigger Knowledge Graph resync
    try {
      const { RelationshipService } = require('../services/RelationshipService');
      const { SQLiteKnowledgeGraphRepository } = require('../repositories/SQLiteKnowledgeGraphRepository');
      const graphRepo = new SQLiteKnowledgeGraphRepository(db);
      const relService = new RelationshipService(db, graphRepo);
      relService.syncKnowledgeGraphFromDomainEntities(1);
    } catch (e) {
      console.error('Failed to resync graph on asset update:', e);
    }

    res.json({ success: true, message: 'Asset updated successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
