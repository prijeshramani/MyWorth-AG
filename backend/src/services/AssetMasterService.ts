import { assetMasterRepository } from '../repositories/SQLiteAssetMasterRepository';
import { IAssetMasterRepository, CreateAssetMasterInput, UpdateAssetMasterInput, AssetMaster, MasterAssetType } from '../repositories/IAssetMasterRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class AssetMasterService {
  constructor(
    private assetMasterRepo: IAssetMasterRepository = assetMasterRepository
  ) {}

  public getAllAssets(assetType?: MasterAssetType): AssetMaster[] {
    return this.assetMasterRepo.findAll(assetType);
  }

  public getAssetById(id: number): AssetMaster {
    const asset = this.assetMasterRepo.findById(id);
    if (!asset) {
      throw new NotFoundError(`Master Asset with ID ${id} not found.`);
    }
    return asset;
  }

  /**
   * Deduplicates asset creation using 3-tier priority:
   * Priority 1: ISIN
   * Priority 2: Symbol + Asset Type
   * Priority 3: Name + Asset Type
   */
  public getOrCreateAsset(input: CreateAssetMasterInput): { asset: AssetMaster; created: boolean } {
    // Priority 1: ISIN
    if (input.isin && input.isin.trim().length > 0) {
      const matchByIsin = this.assetMasterRepo.findByIsin(input.isin);
      if (matchByIsin) {
        return { asset: matchByIsin, created: false };
      }
    }

    // Priority 2: Symbol + Asset Type
    if (input.symbol && input.symbol.trim().length > 0) {
      const matchBySymbol = this.assetMasterRepo.findBySymbolAndType(input.symbol, input.asset_type);
      if (matchBySymbol) {
        return { asset: matchBySymbol, created: false };
      }
    }

    // Priority 3: Name + Asset Type
    if (input.name && input.name.trim().length > 0) {
      const matchByName = this.assetMasterRepo.findByNameAndType(input.name, input.asset_type);
      if (matchByName) {
        return { asset: matchByName, created: false };
      }
    }

    // Create new master asset
    const created = this.assetMasterRepo.create(input);
    return { asset: created, created: true };
  }

  public createAsset(input: CreateAssetMasterInput): AssetMaster {
    const { asset } = this.getOrCreateAsset(input);
    return asset;
  }

  public updateAsset(id: number, input: UpdateAssetMasterInput): AssetMaster {
    this.getAssetById(id);
    const updated = this.assetMasterRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Master Asset with ID ${id} not found.`);
    }
    return updated;
  }

  public softDeleteAsset(id: number): boolean {
    this.getAssetById(id);
    return this.assetMasterRepo.softDelete(id);
  }
}

export const assetMasterService = new AssetMasterService();
