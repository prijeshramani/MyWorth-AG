import { Router, Request, Response } from 'express';
import { familyService } from '../../services/FamilyService';
import { CreateFamilyMemberSchema, UpdateFamilyMemberSchema } from '../../schema/domainSchemas';
import { ValidationError } from '../../errors/AppError';

const router = Router();

// GET /api/v1/family-members - List all family members (optionally filtered by familyId)
router.get('/', (req: Request, res: Response, next) => {
  try {
    const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;
    if (req.query.familyId && isNaN(familyId!)) {
      throw new ValidationError('Invalid familyId query parameter');
    }

    const members = familyService.getFamilyMembers(familyId || 0);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/family-members/:id - Get single family member by ID
router.get('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Family Member ID');

    const member = familyService.getFamilyMembers(0).find(m => m.id === id);
    if (!member) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Family Member ${id} not found` } });
    }
    res.json(member);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/family-members - Create family member
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateFamilyMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid family member payload', parseResult.error.errors);
    }

    const created = familyService.createFamilyMember(parseResult.data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/family-members/:id - Update family member
router.put('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Family Member ID');

    const parseResult = UpdateFamilyMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid update family member payload', parseResult.error.errors);
    }

    const updated = familyService.updateFamilyMember(id, parseResult.data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/family-members/:id - Soft-delete family member
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Family Member ID');

    familyService.softDeleteFamilyMember(id);
    res.json({ success: true, message: `Family Member ${id} successfully soft-deleted.` });
  } catch (error) {
    next(error);
  }
});

export default router;
