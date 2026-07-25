import { entityRepository } from '../repositories/SQLiteEntityRepository';
import { IEntityRepository, CreateEntityInput, UpdateEntityInput, Entity } from '../repositories/IEntityRepository';
import { familyMemberRepository } from '../repositories/SQLiteFamilyMemberRepository';
import { IFamilyMemberRepository } from '../repositories/IFamilyMemberRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class EntityService {
  constructor(
    private entityRepo: IEntityRepository = entityRepository,
    private memberRepo: IFamilyMemberRepository = familyMemberRepository
  ) {}

  public getAllEntities(familyMemberId?: number): Entity[] {
    if (familyMemberId) {
      const member = this.memberRepo.findById(familyMemberId);
      if (!member) {
        throw new NotFoundError(`Family Member with ID ${familyMemberId} not found.`);
      }
    }
    return this.entityRepo.findAll(familyMemberId);
  }

  public getEntityById(id: number): Entity {
    const entity = this.entityRepo.findById(id);
    if (!entity) {
      throw new NotFoundError(`Entity with ID ${id} not found.`);
    }
    return entity;
  }

  public createEntity(input: CreateEntityInput): Entity {
    // 1. Verify parent family member exists
    const member = this.memberRepo.findById(input.family_member_id);
    if (!member) {
      throw new NotFoundError(`Family Member with ID ${input.family_member_id} not found.`);
    }

    // 2. Validate UNIQUE PAN constraint
    if (input.pan_number && input.pan_number.trim().length > 0) {
      const existingPan = this.entityRepo.findByPanNumber(input.pan_number);
      if (existingPan) {
        throw new ValidationError(`An active entity with PAN '${input.pan_number.trim().toUpperCase()}' already exists.`);
      }
    }

    return this.entityRepo.create(input);
  }

  public updateEntity(id: number, input: UpdateEntityInput): Entity {
    const existing = this.getEntityById(id);

    // Validate UNIQUE PAN constraint if changing PAN
    if (input.pan_number && input.pan_number.trim().toUpperCase() !== (existing.pan_number || '')) {
      const existingPan = this.entityRepo.findByPanNumber(input.pan_number);
      if (existingPan && existingPan.id !== id) {
        throw new ValidationError(`An active entity with PAN '${input.pan_number.trim().toUpperCase()}' already exists.`);
      }
    }

    const updated = this.entityRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Entity with ID ${id} not found.`);
    }
    return updated;
  }

  public softDeleteEntity(id: number): boolean {
    this.getEntityById(id);
    return this.entityRepo.softDelete(id);
  }
}

export const entityService = new EntityService();
