export type RelationshipType = 
  | 'SELF' 
  | 'SPOUSE' 
  | 'CHILD' 
  | 'PARENT' 
  | 'SIBLING' 
  | 'GRANDPARENT' 
  | 'GRANDCHILD' 
  | 'IN_LAW' 
  | 'OTHER';

export interface FamilyMember {
  id: number;
  family_id: number;
  name: string;
  relationship: RelationshipType;
  date_of_birth?: string | null;
  pan?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateFamilyMemberInput {
  family_id: number;
  name: string;
  relationship: RelationshipType;
  date_of_birth?: string | null;
  pan?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateFamilyMemberInput {
  name?: string;
  relationship?: RelationshipType;
  date_of_birth?: string | null;
  pan?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface IFamilyMemberRepository {
  findAll(familyId?: number): FamilyMember[];
  findById(id: number): FamilyMember | null;
  create(input: CreateFamilyMemberInput): FamilyMember;
  update(id: number, input: UpdateFamilyMemberInput): FamilyMember | null;
  softDelete(id: number): boolean;
  restore(id: number): boolean;
}
