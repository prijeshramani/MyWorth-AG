import { db } from '../db';
import { 
  Transaction, 
  TransactionWithAssetInfo, 
  CreateTransactionInput, 
  TransactionFilters, 
  ITransactionRepository 
} from './ITransactionRepository';
import { CreateAssetInput } from './IAssetRepository';

export class SQLiteTransactionRepository implements ITransactionRepository {
  public findAll(filters?: TransactionFilters): TransactionWithAssetInfo[] {
    let query = `
      SELECT t.*, a.name as asset_name, a.type as asset_type, a.category as asset_category,
             h.account_id
      FROM transactions t
      LEFT JOIN assets a ON t.asset_id = a.id
      LEFT JOIN holdings h ON t.holding_id = h.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters?.holdingId && !isNaN(filters.holdingId)) {
      conditions.push('t.holding_id = ?');
      params.push(filters.holdingId);
    }

    if (filters?.accountId && !isNaN(filters.accountId)) {
      conditions.push('h.account_id = ?');
      params.push(filters.accountId);
    }

    if (filters?.assetId && !isNaN(filters.assetId)) {
      conditions.push('t.asset_id = ?');
      params.push(filters.assetId);
    }

    if (filters?.type) {
      conditions.push('t.type = ?');
      params.push(filters.type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.date DESC, t.id DESC LIMIT ?';
    params.push(filters?.limit || 1000);

    return db.prepare(query).all(...params) as TransactionWithAssetInfo[];
  }

  public findById(id: number): Transaction | null {
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | undefined;
    return row || null;
  }

  public findByAssetId(assetId: number): Transaction[] {
    return db.prepare(`
      SELECT * FROM transactions 
      WHERE asset_id = ?
      ORDER BY date ASC, id ASC
    `).all(assetId) as Transaction[];
  }

  public findByHoldingId(holdingId: number): Transaction[] {
    return db.prepare(`
      SELECT * FROM transactions 
      WHERE holding_id = ?
      ORDER BY date ASC, id ASC
    `).all(holdingId) as Transaction[];
  }

  public findByAccount(accountId: number): Transaction[] {
    return db.prepare(`
      SELECT t.* FROM transactions t
      JOIN holdings h ON t.holding_id = h.id
      WHERE h.account_id = ? AND h.deleted_at IS NULL
      ORDER BY t.date ASC, t.id ASC
    `).all(accountId) as Transaction[];
  }

  public findByEntity(entityId: number): Transaction[] {
    return db.prepare(`
      SELECT t.* FROM transactions t
      JOIN holdings h ON t.holding_id = h.id
      JOIN accounts acc ON h.account_id = acc.id
      WHERE acc.entity_id = ? AND acc.deleted_at IS NULL AND h.deleted_at IS NULL
      ORDER BY t.date ASC, t.id ASC
    `).all(entityId) as Transaction[];
  }

  public findByFamilyMember(familyMemberId: number): Transaction[] {
    return db.prepare(`
      SELECT t.* FROM transactions t
      JOIN holdings h ON t.holding_id = h.id
      JOIN accounts acc ON h.account_id = acc.id
      JOIN entities ent ON acc.entity_id = ent.id
      WHERE ent.family_member_id = ? AND ent.deleted_at IS NULL AND acc.deleted_at IS NULL AND h.deleted_at IS NULL
      ORDER BY t.date ASC, t.id ASC
    `).all(familyMemberId) as Transaction[];
  }

  public findDuplicate(
    assetId: number, 
    type: string, 
    date: string, 
    quantity: number, 
    price: number, 
    amount: number
  ): Transaction | null {
    // 1. Exact match (same date)
    const exactMatch = db.prepare(`
      SELECT * FROM transactions 
      WHERE asset_id = ? AND type = ? AND date = ? AND quantity = ? AND price = ? AND amount = ?
    `).get(assetId, type, date, quantity, price, amount) as Transaction | undefined;
    
    if (exactMatch) return exactMatch;

    // 2. Holdings snapshot duplicate match: same asset, type BUY, identical quantity & price regardless of sync date
    if (type === 'BUY') {
      const holdingsMatch = db.prepare(`
        SELECT * FROM transactions 
        WHERE asset_id = ? AND type = 'BUY' AND quantity = ? AND price = ?
      `).get(assetId, quantity, price) as Transaction | undefined;
      
      if (holdingsMatch) return holdingsMatch;
    }

    return null;
  }

  public create(input: CreateTransactionInput): Transaction {
    if (input.asset_id) {
      const legacyCheck = db.prepare('SELECT id FROM assets WHERE id = ?').get(input.asset_id);
      if (!legacyCheck) {
        const masterAsset = db.prepare('SELECT * FROM assets_master WHERE id = ?').get(input.asset_id) as any;
        if (masterAsset) {
          db.prepare(`
            INSERT OR IGNORE INTO assets (id, name, type, category, identifier)
            VALUES (?, ?, 'OTHER', 'Other', ?)
          `).run(masterAsset.id, masterAsset.name, masterAsset.symbol || null);
        }
      }
    }

    const result = db.prepare(`
      INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source, narration, tx_category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.holding_id || null,
      input.asset_id, 
      input.type, 
      input.date, 
      input.quantity, 
      input.price, 
      input.amount, 
      input.source, 
      input.narration || null, 
      input.tx_category || null
    );

    const createdId = Number(result.lastInsertRowid);
    return {
      id: createdId,
      ...input
    };
  }

  public createManualWithAsset(
    assetInput: CreateAssetInput, 
    transactionInput?: Omit<CreateTransactionInput, 'asset_id' | 'source'>
  ): number {
    let assetId: number;

    const runInTransaction = db.transaction(() => {
      // 1. Create asset (or fetch if identifier already exists)
      if (assetInput.identifier) {
        const existing = db.prepare('SELECT id FROM assets WHERE identifier = ? AND type = ?')
          .get(assetInput.identifier, assetInput.type) as { id: number } | undefined;
        if (existing) {
          assetId = existing.id;
        } else {
          const res = db.prepare(`
            INSERT INTO assets (name, type, category, identifier)
            VALUES (?, ?, ?, ?)
          `).run(assetInput.name, assetInput.type, assetInput.category, assetInput.identifier);
          assetId = Number(res.lastInsertRowid);
        }
      } else {
        const res = db.prepare(`
          INSERT INTO assets (name, type, category, identifier)
          VALUES (?, ?, ?, ?)
        `).run(assetInput.name, assetInput.type, assetInput.category, null);
        assetId = Number(res.lastInsertRowid);
      }

      // 2. Add transaction if provided
      if (transactionInput) {
        db.prepare(`
          INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'MANUAL')
        `).run(
          transactionInput.holding_id || null,
          assetId, 
          transactionInput.type, 
          transactionInput.date, 
          transactionInput.quantity, 
          transactionInput.price, 
          transactionInput.amount
        );

        // Populate asset price
        db.prepare(`
          INSERT OR REPLACE INTO asset_prices (asset_id, date, price)
          VALUES (?, ?, ?)
        `).run(assetId, transactionInput.date, transactionInput.price);
      }

      return assetId;
    });

    return runInTransaction();
  }

  public delete(id: number): boolean {
    const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return info.changes > 0;
  }
}

export const transactionRepository = new SQLiteTransactionRepository();
