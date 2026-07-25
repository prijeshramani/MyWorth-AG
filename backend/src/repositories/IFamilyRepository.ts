export interface Family {
  id: number;
  name: string;
  currency: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateFamilyInput {
  name: string;
  currency?: string;
}

export interface UpdateFamilyInput {
  name?: string;
  currency?: string;
}

export interface IFamilyRepository {
  findAll(): Family[];
  findById(id: number): Family | null;
  create(input: CreateFamilyInput): Family;
  update(id: number, input: UpdateFamilyInput): Family | null;
  softDelete(id: number): boolean;
  restore(id: number): boolean;
}
