import { accountRepository } from '../repositories/SQLiteAccountRepository';
import { IAccountRepository, CreateAccountInput, UpdateAccountInput, Account } from '../repositories/IAccountRepository';
import { entityRepository } from '../repositories/SQLiteEntityRepository';
import { IEntityRepository } from '../repositories/IEntityRepository';
import { NotFoundError } from '../errors/AppError';

export class AccountService {
  constructor(
    private accountRepo: IAccountRepository = accountRepository,
    private entityRepo: IEntityRepository = entityRepository
  ) {}

  public getAllAccounts(entityId?: number): Account[] {
    if (entityId) {
      const entity = this.entityRepo.findById(entityId);
      if (!entity) {
        throw new NotFoundError(`Entity with ID ${entityId} not found.`);
      }
    }
    return this.accountRepo.findAll(entityId);
  }

  public getAccountById(id: number): Account {
    const account = this.accountRepo.findById(id);
    if (!account) {
      throw new NotFoundError(`Account with ID ${id} not found.`);
    }
    return account;
  }

  public createAccount(input: CreateAccountInput): Account {
    const entity = this.entityRepo.findById(input.entity_id);
    if (!entity) {
      throw new NotFoundError(`Entity with ID ${input.entity_id} not found.`);
    }
    return this.accountRepo.create(input);
  }

  public updateAccount(id: number, input: UpdateAccountInput): Account {
    this.getAccountById(id);
    const updated = this.accountRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Account with ID ${id} not found.`);
    }
    return updated;
  }

  public softDeleteAccount(id: number): boolean {
    this.getAccountById(id);
    return this.accountRepo.softDelete(id);
  }
}

export const accountService = new AccountService();
