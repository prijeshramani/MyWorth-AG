import { holdingRepository } from '../repositories/SQLiteHoldingRepository';
import { IHoldingRepository, CreateHoldingInput, UpdateHoldingInput, Holding, HoldingWithAssetInfo } from '../repositories/IHoldingRepository';
import { accountRepository } from '../repositories/SQLiteAccountRepository';
import { IAccountRepository } from '../repositories/IAccountRepository';
import { assetMasterRepository } from '../repositories/SQLiteAssetMasterRepository';
import { IAssetMasterRepository } from '../repositories/IAssetMasterRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class HoldingService {
  constructor(
    private holdingRepo: IHoldingRepository = holdingRepository,
    private accountRepo: IAccountRepository = accountRepository,
    private assetMasterRepo: IAssetMasterRepository = assetMasterRepository
  ) {}

  public getAllHoldings(accountId?: number, assetId?: number): HoldingWithAssetInfo[] {
    if (accountId) {
      const account = this.accountRepo.findById(accountId);
      if (!account) {
        throw new NotFoundError(`Account with ID ${accountId} not found.`);
      }
    }
    if (assetId) {
      const asset = this.assetMasterRepo.findById(assetId);
      if (!asset) {
        throw new NotFoundError(`Master Asset with ID ${assetId} not found.`);
      }
    }
    return this.holdingRepo.findAll(accountId, assetId);
  }

  public getHoldingById(id: number): Holding {
    const holding = this.holdingRepo.findById(id);
    if (!holding) {
      throw new NotFoundError(`Holding link with ID ${id} not found.`);
    }
    return holding;
  }

  public createHolding(input: CreateHoldingInput): Holding {
    // 1. Verify parent Account exists
    const account = this.accountRepo.findById(input.account_id);
    if (!account) {
      throw new NotFoundError(`Account with ID ${input.account_id} not found.`);
    }

    // 2. Verify Master Asset exists
    const asset = this.assetMasterRepo.findById(input.asset_id);
    if (!asset) {
      throw new NotFoundError(`Master Asset with ID ${input.asset_id} not found.`);
    }

    // 3. Check duplicate OPEN holding link in same account
    const existingHolding = this.holdingRepo.findByAccountAndAsset(input.account_id, input.asset_id);
    if (existingHolding && (input.status || 'OPEN') === 'OPEN') {
      return existingHolding;
    }

    return this.holdingRepo.create(input);
  }

  public updateHolding(id: number, input: UpdateHoldingInput): Holding {
    this.getHoldingById(id);
    const updated = this.holdingRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Holding link with ID ${id} not found.`);
    }
    return updated;
  }

  public softDeleteHolding(id: number): boolean {
    this.getHoldingById(id);
    return this.holdingRepo.softDelete(id);
  }
}

export const holdingService = new HoldingService();
