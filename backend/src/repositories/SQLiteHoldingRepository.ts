import { db } from '../db';
import { 
  Holding, 
  HoldingWithAssetInfo,
  CreateHoldingInput, 
  UpdateHoldingInput, 
  IHoldingRepository 
} from './IHoldingRepository';

export class SQLiteHoldingRepository implements IHoldingRepository {
  public findAll(accountId?: number, assetId?: number): HoldingWithAssetInfo[] {
    let query = `
      SELECT h.*, a.name as asset_name, a.display_name, a.asset_type, a.symbol, a.isin
      FROM holdings h
      JOIN assets_master a ON h.asset_id = a.id
      WHERE h.deleted_at IS NULL AND a.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (accountId) {
      query += ' AND h.account_id = ?';
      params.push(accountId);
    }
    if (assetId) {
      query += ' AND h.asset_id = ?';
      params.push(assetId);
    }

    query += ' ORDER BY a.name ASC';

    return db.prepare(query).all(...params) as HoldingWithAssetInfo[];
  }

  public findById(id: number): Holding | null {
    const row = db.prepare('SELECT * FROM holdings WHERE id = ? AND deleted_at IS NULL').get(id) as Holding | undefined;
    return row || null;
  }

  public findByAccountAndAsset(accountId: number, assetId: number): Holding | null {
    const row = db.prepare(`
      SELECT * FROM holdings 
      WHERE account_id = ? AND asset_id = ? AND status = 'OPEN' AND deleted_at IS NULL
    `).get(accountId, assetId) as Holding | undefined;

    return row || null;
  }

  public create(input: CreateHoldingInput): Holding {
    const openedAt = input.opened_at || new Date().toISOString().split('T')[0];
    const status = input.status || 'OPEN';

    const result = db.prepare(`
      INSERT INTO holdings (account_id, asset_id, opened_at, closed_at, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(input.account_id, input.asset_id, openedAt, input.closed_at || null, status);

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  }

  public update(id: number, input: UpdateHoldingInput): Holding | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const openedAt = input.opened_at !== undefined ? input.opened_at : existing.opened_at;
    const closedAt = input.closed_at !== undefined ? input.closed_at : existing.closed_at;
    const status = input.status !== undefined ? input.status : existing.status;

    db.prepare(`
      UPDATE holdings 
      SET opened_at = ?, closed_at = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(openedAt, closedAt || null, status, id);

    return this.findById(id);
  }

  public softDelete(id: number): boolean {
    const info = db.prepare(`
      UPDATE holdings 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(id);

    return info.changes > 0;
  }

  public restore(id: number): boolean {
    const info = db.prepare(`
      UPDATE holdings 
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NOT NULL
    `).run(id);

    return info.changes > 0;
  }
}

export const holdingRepository = new SQLiteHoldingRepository();
