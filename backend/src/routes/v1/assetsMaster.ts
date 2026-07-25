import { Router, Request, Response } from 'express';
import { assetMasterService } from '../../services/AssetMasterService';
import { CreateAssetMasterSchema, UpdateAssetMasterSchema } from '../../schema/assetMasterSchemas';
import { MasterAssetType } from '../../repositories/IAssetMasterRepository';
import { ValidationError } from '../../errors/AppError';

const router = Router();

// GET /api/v1/assets-master - List/search all master assets
router.get('/', (req: Request, res: Response, next) => {
  try {
    const assetType = req.query.assetType as MasterAssetType | undefined;
    const assets = assetMasterService.getAllAssets(assetType);
    res.json(assets);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/assets-master/:id - Get single master asset by ID
router.get('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Asset Master ID');

    const asset = assetMasterService.getAssetById(id);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/assets-master - Create / get-or-create master asset
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateAssetMasterSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid asset master payload', parseResult.error.errors);
    }

    const { asset, created } = assetMasterService.getOrCreateAsset(parseResult.data as any);
    res.status(created ? 201 : 200).json(asset);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/assets-master/:id - Update master asset
router.put('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Asset Master ID');

    const parseResult = UpdateAssetMasterSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid update asset master payload', parseResult.error.errors);
    }

    const updated = assetMasterService.updateAsset(id, parseResult.data as any);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/assets-master/:id - Soft-delete master asset
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Asset Master ID');

    assetMasterService.softDeleteAsset(id);
    res.json({ success: true, message: `Master Asset ${id} successfully soft-deleted.` });
  } catch (error) {
    next(error);
  }
});

export default router;
