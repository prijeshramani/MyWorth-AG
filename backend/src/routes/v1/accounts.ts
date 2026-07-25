import { Router, Request, Response } from 'express';
import { accountService } from '../../services/AccountService';
import { ownershipService } from '../../services/OwnershipService';
import { CreateAccountSchema, UpdateAccountSchema } from '../../schema/domainSchemas';
import { ValidationError } from '../../errors/AppError';

const router = Router();

// GET /api/v1/accounts - List all financial accounts (optionally filtered by entityId)
router.get('/', (req: Request, res: Response, next) => {
  try {
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
    if (req.query.entityId && isNaN(entityId!)) {
      throw new ValidationError('Invalid entityId query parameter');
    }

    const accounts = accountService.getAllAccounts(entityId);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/accounts/:id - Get single account by ID
router.get('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Account ID');

    const account = accountService.getAccountById(id);
    res.json(account);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/accounts/:id/ownership-chain - Resolve full 4-tier ownership hierarchy
router.get('/:id/ownership-chain', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Account ID');

    const chain = ownershipService.resolveAccountOwnershipChain(id);
    res.json(chain);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/accounts - Create new account
router.post('/', (req: Request, res: Response, next) => {
  try {
    const parseResult = CreateAccountSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid account payload', parseResult.error.errors);
    }

    const created = accountService.createAccount(parseResult.data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/accounts/:id - Update existing account
router.put('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Account ID');

    const parseResult = UpdateAccountSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid update account payload', parseResult.error.errors);
    }

    const updated = accountService.updateAccount(id, parseResult.data);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/accounts/:id - Soft-delete account
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Account ID');

    accountService.softDeleteAccount(id);
    res.json({ success: true, message: `Account ${id} successfully soft-deleted.` });
  } catch (error) {
    next(error);
  }
});

export default router;
