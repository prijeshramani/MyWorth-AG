import { familyRepository } from '../repositories/SQLiteFamilyRepository';
import { IFamilyRepository } from '../repositories/IFamilyRepository';
import { familyMemberRepository } from '../repositories/SQLiteFamilyMemberRepository';
import { IFamilyMemberRepository } from '../repositories/IFamilyMemberRepository';
import { entityRepository } from '../repositories/SQLiteEntityRepository';
import { IEntityRepository } from '../repositories/IEntityRepository';
import { accountRepository } from '../repositories/SQLiteAccountRepository';
import { IAccountRepository } from '../repositories/IAccountRepository';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface OwnershipChain {
  family: { id: number; name: string };
  familyMember: { id: number; name: string; relationship: string };
  entity: { id: number; name: string; entity_type: string };
  account: { id: number; account_name: string; account_type: string };
}

export class OwnershipService {
  constructor(
    private familyRepo: IFamilyRepository = familyRepository,
    private memberRepo: IFamilyMemberRepository = familyMemberRepository,
    private entityRepo: IEntityRepository = entityRepository,
    private accountRepo: IAccountRepository = accountRepository
  ) {}

  /**
   * Trace and validate full 4-tier ownership chain for an account ID
   */
  public resolveAccountOwnershipChain(accountId: number): OwnershipChain {
    const account = this.accountRepo.findById(accountId);
    if (!account) {
      throw new NotFoundError(`Account with ID ${accountId} not found.`);
    }

    const entity = this.entityRepo.findById(account.entity_id);
    if (!entity) {
      throw new NotFoundError(`Parent Entity with ID ${account.entity_id} not found for Account ${accountId}.`);
    }

    const member = this.memberRepo.findById(entity.family_member_id);
    if (!member) {
      throw new NotFoundError(`Parent Family Member with ID ${entity.family_member_id} not found for Entity ${entity.id}.`);
    }

    const family = this.familyRepo.findById(member.family_id);
    if (!family) {
      throw new NotFoundError(`Parent Family with ID ${member.family_id} not found for Member ${member.id}.`);
    }

    return {
      family: { id: family.id, name: family.name },
      familyMember: { id: member.id, name: member.name, relationship: member.relationship },
      entity: { id: entity.id, name: entity.name, entity_type: entity.entity_type },
      account: { id: account.id, account_name: account.account_name, account_type: account.account_type }
    };
  }

  /**
   * Validate that an Entity belongs to a specific Family
   */
  public validateEntityInFamily(entityId: number, familyId: number): boolean {
    const entity = this.entityRepo.findById(entityId);
    if (!entity) return false;

    const member = this.memberRepo.findById(entity.family_member_id);
    if (!member) return false;

    return member.family_id === familyId;
  }
}

export const ownershipService = new OwnershipService();
