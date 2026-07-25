import { Router, Request, Response } from 'express';
import { familyService } from '../../services/FamilyService';
import { CreateFamilySchema, UpdateFamilySchema } from '../../schema/domainSchemas';
import { ValidationError } from '../../errors/AppError';

const router = Router();

// GET /api/v1/families - List all families
router.get('/', (req: Request, res: Response, next) => {
  try {
    const families = familyService.getAllFamilies();
    res.json(families);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/families/:id - Get single family by ID
router.get('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Family ID');

    const family = familyService.getFamilyById(id);
    res.json(family);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/families - Create new family
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateFamilySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid family payload', parseResult.error.errors);
    }

    const created = familyService.createFamily(parseResult.data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/families/:id - Update existing family
router.put('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Family ID');

    const parseResult = UpdateFamilySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid update family payload', parseResult.error.errors);
    }

    const updated = familyService.updateFamily(id, parseResult.data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/families/:id - Soft-delete family
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Family ID');

    familyService.softDeleteFamily(id);
    res.json({ success: true, message: `Family ${id} successfully soft-deleted.` });
  } catch (error) {
    next(error);
  }
});

export default router;
