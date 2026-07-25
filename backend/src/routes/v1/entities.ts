import { Router, Request, Response } from 'express';
import { entityService } from '../../services/EntityService';
import { CreateEntitySchema, UpdateEntitySchema } from '../../schema/domainSchemas';
import { ValidationError } from '../../errors/AppError';

const router = Router();

// GET /api/v1/entities - List all entities (optionally filtered by familyMemberId)
router.get('/', (req: Request, res: Response, next) => {
  try {
    const familyMemberId = req.query.familyMemberId ? parseInt(req.query.familyMemberId as string) : undefined;
    if (req.query.familyMemberId && isNaN(familyMemberId!)) {
      throw new ValidationError('Invalid familyMemberId query parameter');
    }

    const entities = entityService.getAllEntities(familyMemberId);
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/entities/:id - Get single entity by ID
router.get('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Entity ID');

    const entity = entityService.getEntityById(id);
    res.json(entity);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/entities - Create new entity
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateEntitySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid entity payload', parseResult.error.errors);
    }

    const created = entityService.createEntity(parseResult.data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/entities/:id - Update existing entity
router.put('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Entity ID');

    const parseResult = UpdateEntitySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid update entity payload', parseResult.error.errors);
    }

    const updated = entityService.updateEntity(id, parseResult.data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/entities/:id - Soft-delete entity
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Entity ID');

    entityService.softDeleteEntity(id);
    res.json({ success: true, message: `Entity ${id} successfully soft-deleted.` });
  } catch (error) {
    next(error);
  }
});

export default router;
