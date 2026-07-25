export type EntityType = 
  | 'INDIVIDUAL' 
  | 'HUF' 
  | 'MINOR' 
  | 'COMPANY' 
  | 'TRUST' 
  | 'PARTNERSHIP' 
  | 'LLP' 
  | 'OTHER';

export interface Entity {
  id: number;
  family_member_id: number;
  name: string;
  entity_type: EntityType;
  pan_number?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateEntityInput {
  family_member_id: number;
  name: string;
  entity_type: EntityType;
  pan_number?: string | null;
}

export interface UpdateEntityInput {
  name?: string;
  entity_type?: EntityType;
  pan_number?: string | null;
}

export interface IEntityRepository {
  findAll(familyMemberId?: number): Entity[];
  findById(id: number): Entity | null;
  findByPanNumber(panNumber: string): Entity | null;
  create(input: CreateEntityInput): Entity;
  update(id: number, input: UpdateEntityInput): Entity | null;
  softDelete(id: number): boolean;
  restore(id: number): boolean;
}
