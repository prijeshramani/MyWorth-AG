export interface Asset {
  id: number;
  name: string;
  type: string;
  category: string;
  identifier: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAssetInput {
  name: string;
  type: string;
  category: string;
  identifier?: string | null;
}

export interface IAssetRepository {
  findAll(): Asset[];
  findById(id: number): Asset | null;
  findByIdentifierAndType(identifier: string, type: string): Asset | null;
  findByNameAndType(name: string, type: string): Asset | null;
  findByNameIdentifierType(name: string, identifier: string, type: string): Asset | null;
  create(asset: CreateAssetInput): Asset;
  delete(id: number): boolean;
}
