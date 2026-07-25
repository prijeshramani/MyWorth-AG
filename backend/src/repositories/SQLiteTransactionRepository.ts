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
      SELECT t.*, a.name as asset_name, a.type as asset_type, a.category as asset_category 
      FROM transactions t
      JOIN assets a ON t.asset_id = a.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

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
      SELECT type, quantity, price, amount, date, narration, tx_category FROM transactions 
      WHERE asset_id = ?
      ORDER BY date ASC, id ASC
    `).all(assetId) as Transaction[];
  }

  public findDuplicate(
    assetId: number, 
    type: string, 
    date: string, 
    quantity: number, 
    price: number, 
    amount: number
  ): Transaction | null {
    const row = db.prepare(`
      SELECT id FROM transactions 
      WHERE asset_id = ? AND type = ? AND date = ? AND quantity = ? AND price = ? AND amount = ?
    `).get(assetId, type, date, quantity, price, amount) as Transaction | undefined;
    
    return row || null;
  }

  public create(input: CreateTransactionInput): Transaction {
    const result = db.prepare(`
      INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source, narration, tx_category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
          INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source)
          VALUES (?, ?, ?, ?, ?, ?, 'MANUAL')
        `).run(
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
