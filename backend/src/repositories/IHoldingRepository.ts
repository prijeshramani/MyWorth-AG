export type HoldingStatus = 'OPEN' | 'CLOSED';

export interface Holding {
  id: number;
  account_id: number;
  asset_id: number;
  opened_at: string;
  closed_at?: string | null;
  status: HoldingStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface HoldingWithAssetInfo extends Holding {
  asset_name: string;
  display_name: string;
  asset_type: string;
  symbol?: string | null;
  isin?: string | null;
}

export interface CreateHoldingInput {
  account_id: number;
  asset_id: number;
  opened_at?: string;
  closed_at?: string | null;
  status?: HoldingStatus;
}

export interface UpdateHoldingInput {
  opened_at?: string;
  closed_at?: string | null;
  status?: HoldingStatus;
}

export interface IHoldingRepository {
  findAll(accountId?: number, assetId?: number): HoldingWithAssetInfo[];
  findById(id: number): Holding | null;
  findByAccountAndAsset(accountId: number, assetId: number): Holding | null;
  create(input: CreateHoldingInput): Holding;
  update(id: number, input: UpdateHoldingInput): Holding | null;
  softDelete(id: number): boolean;
  restore(id: number): boolean;
}
