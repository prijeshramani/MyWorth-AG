import { db } from '../db';
import { 
  AssetMaster, 
  CreateAssetMasterInput, 
  UpdateAssetMasterInput, 
  MasterAssetType,
  IAssetMasterRepository 
} from './IAssetMasterRepository';

export class SQLiteAssetMasterRepository implements IAssetMasterRepository {
  public findAll(assetType?: MasterAssetType): AssetMaster[] {
    if (assetType) {
      return db.prepare('SELECT * FROM assets_master WHERE asset_type = ? AND deleted_at IS NULL ORDER BY name ASC').all(assetType) as AssetMaster[];
    }
    return db.prepare('SELECT * FROM assets_master WHERE deleted_at IS NULL ORDER BY name ASC').all() as AssetMaster[];
  }

  public findById(id: number): AssetMaster | null {
    const row = db.prepare('SELECT * FROM assets_master WHERE id = ? AND deleted_at IS NULL').get(id) as AssetMaster | undefined;
    return row || null;
  }

  public findByIsin(isin: string): AssetMaster | null {
    if (!isin) return null;
    const cleanIsin = isin.trim().toUpperCase();
    const row = db.prepare('SELECT * FROM assets_master WHERE UPPER(isin) = ? AND deleted_at IS NULL').get(cleanIsin) as AssetMaster | undefined;
    return row || null;
  }

  public findBySymbolAndType(symbol: string, assetType: MasterAssetType): AssetMaster | null {
    if (!symbol) return null;
    const cleanSymbol = symbol.trim().toUpperCase();
    const row = db.prepare('SELECT * FROM assets_master WHERE UPPER(symbol) = ? AND asset_type = ? AND deleted_at IS NULL').get(cleanSymbol, assetType) as AssetMaster | undefined;
    return row || null;
  }

  public findByNameAndType(name: string, assetType: MasterAssetType): AssetMaster | null {
    if (!name) return null;
    const cleanName = name.trim().toLowerCase();
    const row = db.prepare('SELECT * FROM assets_master WHERE LOWER(name) = ? AND asset_type = ? AND deleted_at IS NULL').get(cleanName, assetType) as AssetMaster | undefined;
    return row || null;
  }

  public create(input: CreateAssetMasterInput): AssetMaster {
    const displayName = input.display_name || input.name;
    const currency = input.currency || 'INR';
    const status = input.status || 'ACTIVE';
    const symbol = input.symbol ? input.symbol.trim().toUpperCase() : null;
    const isin = input.isin ? input.isin.trim().toUpperCase() : null;
    const metadataStr = typeof input.metadata === 'object' && input.metadata !== null 
      ? JSON.stringify(input.metadata) 
      : (typeof input.metadata === 'string' ? input.metadata : null);

    const result = db.prepare(`
      INSERT INTO assets_master (
        asset_type, name, display_name, symbol, isin, currency, status, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.asset_type,
      input.name,
      displayName,
      symbol,
      isin,
      currency,
      status,
      metadataStr
    );

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  }

  public update(id: number, input: UpdateAssetMasterInput): AssetMaster | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const assetType = input.asset_type !== undefined ? input.asset_type : existing.asset_type;
    const name = input.name !== undefined ? input.name : existing.name;
    const displayName = input.display_name !== undefined ? input.display_name : existing.display_name;
    const symbol = input.symbol !== undefined ? (input.symbol ? input.symbol.trim().toUpperCase() : null) : existing.symbol;
    const isin = input.isin !== undefined ? (input.isin ? input.isin.trim().toUpperCase() : null) : existing.isin;
    const currency = input.currency !== undefined ? input.currency : existing.currency;
    const status = input.status !== undefined ? input.status : existing.status;
    const metadataStr = input.metadata !== undefined
      ? (typeof input.metadata === 'object' && input.metadata !== null ? JSON.stringify(input.metadata) : input.metadata)
      : existing.metadata;

    db.prepare(`
      UPDATE assets_master 
      SET asset_type = ?, name = ?, display_name = ?, symbol = ?, isin = ?,
          currency = ?, status = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(
      assetType,
      name,
      displayName,
      symbol,
      isin,
      currency,
      status,
      metadataStr || null,
      id
    );

    return this.findById(id);
  }

  public softDelete(id: number): boolean {
    const info = db.prepare(`
      UPDATE assets_master 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(id);

    return info.changes > 0;
  }

  public restore(id: number): boolean {
    const info = db.prepare(`
      UPDATE assets_master 
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NOT NULL
    `).run(id);

    return info.changes > 0;
  }
}

export const assetMasterRepository = new SQLiteAssetMasterRepository();
