import { Router, Request, Response } from 'express';
import { accountService } from '../../services/AccountService';
import { ownershipService } from '../../services/OwnershipService';
import { CreateAccountSchema, UpdateAccountSchema } from '../../schema/domainSchemas';
import { ValidationError } from '../../errors/AppError';
import { db } from '../../db';

const router = Router();

// GET /api/v1/accounts - List all financial accounts (optionally filtered by entityId or familyId)
router.get('/', (req: Request, res: Response, next) => {
  try {
    const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
    const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;

    if (familyId && !isNaN(familyId)) {
      // Query accounts from 3-tier accounts table for this family
      const accs = db.prepare(`
        SELECT acc.*, fm.name as holderName 
        FROM accounts acc 
        LEFT JOIN entities e ON acc.entity_id = e.id 
        LEFT JOIN family_members fm ON e.family_member_id = fm.id 
        WHERE fm.family_id = ? AND acc.deleted_at IS NULL
      `).all(familyId) as any[];

      // Query bank & demat assets from assets table for this family
      const bankAssets = db.prepare(`
        SELECT a.id, a.name as institutionName, a.identifier as accountNumber, a.type as accountType, fm.name as holderName,
               COALESCE((SELECT price FROM asset_prices WHERE asset_id = a.id ORDER BY date DESC LIMIT 1), 0) as balance
        FROM assets a
        LEFT JOIN family_members fm ON a.family_member_id = fm.id
        WHERE (fm.family_id = ? OR a.family_member_id IS NULL)
        AND a.type IN ('BANK_ACCOUNT', 'DEMAT', 'EPF', 'FIXED_DEPOSIT', 'BANK')
      `).all(familyId) as any[];

      const formattedAccs = [
        ...accs.map(a => ({
          id: a.id,
          institutionName: a.institution_name || a.account_name || 'Bank/Broker',
          accountNumber: a.account_number || a.masked_account_number || 'N/A',
          accountType: (a.account_type === 'BANK' ? 'SAVINGS' : a.account_type) || 'SAVINGS',
          holderName: a.holderName || 'Unassigned',
          balance: a.balance || 0,
          syncStatus: 'CONNECTED'
        })),
        ...bankAssets.map(a => ({
          id: a.id,
          institutionName: a.institutionName,
          accountNumber: a.accountNumber || 'N/A',
          accountType: a.accountType === 'BANK_ACCOUNT' ? 'SAVINGS' : a.accountType,
          holderName: a.holderName || 'Unassigned',
          balance: a.balance || 0,
          syncStatus: 'CONNECTED'
        }))
      ];
      return res.json(formattedAccs);
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

// DELETE /api/v1/accounts/:id - Delete account (from accounts or assets table)
router.delete('/:id', (req: Request, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new ValidationError('Invalid Account ID');

    // 1. Delete from 3-tier accounts table
    try { accountService.softDeleteAccount(id); } catch (e) {}

    // 2. Delete from assets table if it exists as asset ID
    db.prepare('DELETE FROM transactions WHERE asset_id = ?').run(id);
    db.prepare('DELETE FROM asset_prices WHERE asset_id = ?').run(id);
    db.prepare('DELETE FROM assets WHERE id = ?').run(id);

    res.json({ success: true, message: `Account ${id} successfully deleted.` });
  } catch (error) {
    next(error);
  }
});

export default router;
