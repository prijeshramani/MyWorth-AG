export type AccountType = 
  | 'DEMAT' 
  | 'BANK' 
  | 'EPF' 
  | 'PPF' 
  | 'NPS' 
  | 'FD' 
  | 'MUTUAL_FUND_FOLIO' 
  | 'CREDIT_CARD' 
  | 'OTHER';

export interface Account {
  id: number;
  entity_id: number;
  account_name: string;
  account_type: AccountType;
  provider?: string | null;
  institution_name?: string | null;
  account_number?: string | null;
  masked_account_number?: string | null;
  nickname?: string | null;
  is_active: number; // 1 or 0
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateAccountInput {
  entity_id: number;
  account_name: string;
  account_type: AccountType;
  provider?: string | null;
  institution_name?: string | null;
  account_number?: string | null;
  masked_account_number?: string | null;
  nickname?: string | null;
  is_active?: number;
}

export interface UpdateAccountInput {
  account_name?: string;
  account_type?: AccountType;
  provider?: string | null;
  institution_name?: string | null;
  account_number?: string | null;
  masked_account_number?: string | null;
  nickname?: string | null;
  is_active?: number;
}

export interface IAccountRepository {
  findAll(entityId?: number): Account[];
  findById(id: number): Account | null;
  create(input: CreateAccountInput): Account;
  update(id: number, input: UpdateAccountInput): Account | null;
  softDelete(id: number): boolean;
  restore(id: number): boolean;
}
