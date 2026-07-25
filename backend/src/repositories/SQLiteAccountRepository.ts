import { db } from '../db';
import { 
  Account, 
  CreateAccountInput, 
  UpdateAccountInput, 
  IAccountRepository 
} from './IAccountRepository';

function generateMaskedAccountNumber(accNum?: string | null): string | null {
  if (!accNum || accNum.trim().length === 0) return null;
  const clean = accNum.trim();
  if (clean.length <= 4) return clean;
  return `••••${clean.slice(-4)}`;
}

export class SQLiteAccountRepository implements IAccountRepository {
  public findAll(entityId?: number): Account[] {
    if (entityId) {
      return db.prepare('SELECT * FROM accounts WHERE entity_id = ? AND deleted_at IS NULL ORDER BY account_name ASC').all(entityId) as Account[];
    }
    return db.prepare('SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY account_name ASC').all() as Account[];
  }

  public findById(id: number): Account | null {
    const row = db.prepare('SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL').get(id) as Account | undefined;
    return row || null;
  }

  public create(input: CreateAccountInput): Account {
    const masked = input.masked_account_number || generateMaskedAccountNumber(input.account_number);
    const isActive = input.is_active !== undefined ? input.is_active : 1;

    const result = db.prepare(`
      INSERT INTO accounts (
        entity_id, account_name, account_type, provider, institution_name, 
        account_number, masked_account_number, nickname, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.entity_id,
      input.account_name,
      input.account_type,
      input.provider || null,
      input.institution_name || null,
      input.account_number || null,
      masked,
      input.nickname || null,
      isActive
    );

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  }

  public update(id: number, input: UpdateAccountInput): Account | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const accountName = input.account_name !== undefined ? input.account_name : existing.account_name;
    const accountType = input.account_type !== undefined ? input.account_type : existing.account_type;
    const provider = input.provider !== undefined ? input.provider : existing.provider;
    const institutionName = input.institution_name !== undefined ? input.institution_name : existing.institution_name;
    const accountNumber = input.account_number !== undefined ? input.account_number : existing.account_number;
    const maskedAccountNumber = input.masked_account_number !== undefined 
      ? input.masked_account_number 
      : (input.account_number !== undefined ? generateMaskedAccountNumber(input.account_number) : existing.masked_account_number);
    const nickname = input.nickname !== undefined ? input.nickname : existing.nickname;
    const isActive = input.is_active !== undefined ? input.is_active : existing.is_active;

    db.prepare(`
      UPDATE accounts 
      SET account_name = ?, account_type = ?, provider = ?, institution_name = ?,
          account_number = ?, masked_account_number = ?, nickname = ?, is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(
      accountName,
      accountType,
      provider || null,
      institutionName || null,
      accountNumber || null,
      maskedAccountNumber || null,
      nickname || null,
      isActive,
      id
    );

    return this.findById(id);
  }

  public softDelete(id: number): boolean {
    const info = db.prepare(`
      UPDATE accounts 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(id);

    return info.changes > 0;
  }

  public restore(id: number): boolean {
    const info = db.prepare(`
      UPDATE accounts 
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NOT NULL
    `).run(id);

    return info.changes > 0;
  }
}

export const accountRepository = new SQLiteAccountRepository();
