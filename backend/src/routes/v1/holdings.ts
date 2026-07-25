import { Router, Request, Response } from 'express';
import { holdingService } from '../../services/HoldingService';
import { CreateHoldingSchema, UpdateHoldingSchema } from '../../schema/assetMasterSchemas';
import { ValidationError } from '../../errors/AppError';

const router = Router();

// GET /api/v1/holdings - List holdings (optionally filtered by accountId or assetId)
router.get('/', (req: Request, res: Response, next) => {
  try {
    const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
    const assetId = req.query.assetId ? parseInt(req.query.assetId as string) : undefined;

    if (req.query.accountId && isNaN(accountId!)) {
      throw new ValidationError('Invalid accountId query parameter');
    }
    if (req.query.assetId && isNaN(assetId!)) {
      throw new ValidationError('Invalid assetId query parameter');
    }

    const holdings = holdingService.getAllHoldings(accountId, assetId);
    res.json(holdings);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/holdings/:id - Get single holding link by ID
router.get('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Holding ID');

    const holding = holdingService.getHoldingById(id);
    res.json(holding);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/holdings - Create holding link (Account -> Asset Master)
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateHoldingSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid holding payload', parseResult.error.errors);
    }

    const created = holdingService.createHolding(parseResult.data as any);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/holdings/:id - Update holding link
router.put('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Holding ID');

    const parseResult = UpdateHoldingSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid update holding payload', parseResult.error.errors);
    }

    const updated = holdingService.updateHolding(id, parseResult.data as any);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/holdings/:id - Soft-delete holding link
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Holding ID');

    holdingService.softDeleteHolding(id);
    res.json({ success: true, message: `Holding ${id} successfully soft-deleted.` });
  } catch (error) {
    next(error);
  }
});

export default router;
