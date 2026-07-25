export type MasterAssetType = 
  | 'STOCK' 
  | 'MUTUAL_FUND' 
  | 'ETF' 
  | 'BOND' 
  | 'FD' 
  | 'PPF' 
  | 'EPF' 
  | 'NPS' 
  | 'SSA' 
  | 'BANK' 
  | 'GOLD' 
  | 'REAL_ESTATE' 
  | 'CRYPTO' 
  | 'OTHER';

export type MasterAssetStatus = 'ACTIVE' | 'INACTIVE' | 'DELISTED' | 'MATURED';

export interface AssetMaster {
  id: number;
  asset_type: MasterAssetType;
  name: string;
  display_name: string;
  symbol?: string | null;
  isin?: string | null;
  currency: string;
  status: MasterAssetStatus;
  metadata?: string | null; // JSON text
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateAssetMasterInput {
  asset_type: MasterAssetType;
  name: string;
  display_name?: string;
  symbol?: string | null;
  isin?: string | null;
  currency?: string;
  status?: MasterAssetStatus;
  metadata?: string | Record<string, any> | null;
}

export interface UpdateAssetMasterInput {
  asset_type?: MasterAssetType;
  name?: string;
  display_name?: string;
  symbol?: string | null;
  isin?: string | null;
  currency?: string;
  status?: MasterAssetStatus;
  metadata?: string | Record<string, any> | null;
}

export interface IAssetMasterRepository {
  findAll(assetType?: MasterAssetType): AssetMaster[];
  findById(id: number): AssetMaster | null;
  findByIsin(isin: string): AssetMaster | null;
  findBySymbolAndType(symbol: string, assetType: MasterAssetType): AssetMaster | null;
  findByNameAndType(name: string, assetType: MasterAssetType): AssetMaster | null;
  create(input: CreateAssetMasterInput): AssetMaster;
  update(id: number, input: UpdateAssetMasterInput): AssetMaster | null;
  softDelete(id: number): boolean;
  restore(id: number): boolean;
}
