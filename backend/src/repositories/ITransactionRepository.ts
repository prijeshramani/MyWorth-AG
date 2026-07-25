import { CreateAssetInput } from './IAssetRepository';

export interface Transaction {
  id: number;
  holding_id?: number | null;
  asset_id: number;
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST' | 'BONUS' | 'CREDIT' | 'DEBIT';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  source: 'PDF_IMPORT' | 'MANUAL' | 'BANK_INSIGHTS';
  narration?: string | null;
  tx_category?: string | null;
  created_at?: string;
}

export interface TransactionWithAssetInfo extends Transaction {
  asset_name: string;
  asset_type: string;
  asset_category: string;
  holding_id?: number | null;
  account_id?: number | null;
}

export interface CreateTransactionInput {
  holding_id?: number | null;
  asset_id: number;
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST' | 'BONUS' | 'CREDIT' | 'DEBIT';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  source: 'PDF_IMPORT' | 'MANUAL' | 'BANK_INSIGHTS';
  narration?: string | null;
  tx_category?: string | null;
}

export interface TransactionFilters {
  assetId?: number | null;
  holdingId?: number | null;
  accountId?: number | null;
  type?: string;
  limit?: number;
}

export interface ITransactionRepository {
  findAll(filters?: TransactionFilters): TransactionWithAssetInfo[];
  findById(id: number): Transaction | null;
  findByAssetId(assetId: number): Transaction[];
  findByHoldingId(holdingId: number): Transaction[];
  findByAccount(accountId: number): Transaction[];
  findByEntity(entityId: number): Transaction[];
  findByFamilyMember(familyMemberId: number): Transaction[];
  findDuplicate(assetId: number, type: string, date: string, quantity: number, price: number, amount: number): Transaction | null;
  create(transaction: CreateTransactionInput): Transaction;
  createManualWithAsset(assetInput: CreateAssetInput, transactionInput?: Omit<CreateTransactionInput, 'asset_id' | 'source'>): number;
  delete(id: number): boolean;
}
