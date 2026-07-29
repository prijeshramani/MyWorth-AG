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
    let family = this.familyRepo.findById(id);
    if (!family) {
      const allFamilies = this.familyRepo.findAll();
      if (allFamilies.length > 0) {
        return allFamilies[0];
      }
      // Auto-provision baseline family for clean databases
      family = this.familyRepo.create({ name: 'My Family Office', currency: 'INR' });
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
    const family = this.getFamilyById(id);
    return this.familyRepo.softDelete(family.id);
  }

  // Member management within family
  public getFamilyMembers(familyId: number): FamilyMember[] {
    const family = this.getFamilyById(familyId || 1);
    const members = this.memberRepo.findAll(family.id);
    if (members.length === 0 && familyId !== family.id) {
      return this.memberRepo.findAll();
    }
    return members;
  }

  public createFamilyMember(input: CreateFamilyMemberInput): FamilyMember {
    const family = this.getFamilyById(input.family_id || 1);
    return this.memberRepo.create({
      ...input,
      family_id: family.id
    });
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
