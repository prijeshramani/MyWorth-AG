import { familyRepository } from '../repositories/SQLiteFamilyRepository';
import { IFamilyRepository, CreateFamilyInput, UpdateFamilyInput, Family } from '../repositories/IFamilyRepository';
import { familyMemberRepository } from '../repositories/SQLiteFamilyMemberRepository';
import { IFamilyMemberRepository, CreateFamilyMemberInput, UpdateFamilyMemberInput, FamilyMember } from '../repositories/IFamilyMemberRepository';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class FamilyService {
  constructor(
    private familyRepo: IFamilyRepository = familyRepository,
    private memberRepo: IFamilyMemberRepository = familyMemberRepository
  ) {}

  public getAllFamilies(): Family[] {
    return this.familyRepo.findAll();
  }

  public getFamilyById(id: number): Family {
    const family = this.familyRepo.findById(id);
    if (!family) {
      throw new NotFoundError(`Family with ID ${id} not found.`);
    }
    return family;
  }

  public createFamily(input: CreateFamilyInput): Family {
    return this.familyRepo.create(input);
  }

  public updateFamily(id: number, input: UpdateFamilyInput): Family {
    const updated = this.familyRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Family with ID ${id} not found.`);
    }
    return updated;
  }

  public softDeleteFamily(id: number): boolean {
    this.getFamilyById(id); // Throws NotFoundError if missing
    return this.familyRepo.softDelete(id);
  }

  // Member management within family
  public getFamilyMembers(familyId: number): FamilyMember[] {
    this.getFamilyById(familyId); // Validate family exists
    return this.memberRepo.findAll(familyId);
  }

  public createFamilyMember(input: CreateFamilyMemberInput): FamilyMember {
    this.getFamilyById(input.family_id); // Validate parent family exists
    return this.memberRepo.create(input);
  }

  public updateFamilyMember(id: number, input: UpdateFamilyMemberInput): FamilyMember {
    const updated = this.memberRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Family Member with ID ${id} not found.`);
    }
    return updated;
  }

  public softDeleteFamilyMember(id: number): boolean {
    const member = this.memberRepo.findById(id);
    if (!member) {
      throw new NotFoundError(`Family Member with ID ${id} not found.`);
    }
    return this.memberRepo.softDelete(id);
  }
}

export const familyService = new FamilyService();
