import { db } from '../db';
import { 
  FamilyMember, 
  CreateFamilyMemberInput, 
  UpdateFamilyMemberInput, 
  IFamilyMemberRepository 
} from './IFamilyMemberRepository';

export class SQLiteFamilyMemberRepository implements IFamilyMemberRepository {
  public findAll(familyId?: number): FamilyMember[] {
    if (familyId) {
      return db.prepare('SELECT * FROM family_members WHERE family_id = ? AND deleted_at IS NULL ORDER BY name ASC').all(familyId) as FamilyMember[];
    }
    return db.prepare('SELECT * FROM family_members WHERE deleted_at IS NULL ORDER BY name ASC').all() as FamilyMember[];
  }

  public findById(id: number): FamilyMember | null {
    const row = db.prepare('SELECT * FROM family_members WHERE id = ? AND deleted_at IS NULL').get(id) as FamilyMember | undefined;
    return row || null;
  }

  public create(input: CreateFamilyMemberInput): FamilyMember {
    const result = db.prepare(`
      INSERT INTO family_members (family_id, name, relationship, date_of_birth)
      VALUES (?, ?, ?, ?)
    `).run(input.family_id, input.name, input.relationship, input.date_of_birth || null);

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  }

  public update(id: number, input: UpdateFamilyMemberInput): FamilyMember | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const name = input.name !== undefined ? input.name : existing.name;
    const relationship = input.relationship !== undefined ? input.relationship : existing.relationship;
    const dateOfBirth = input.date_of_birth !== undefined ? input.date_of_birth : existing.date_of_birth;

    db.prepare(`
      UPDATE family_members 
      SET name = ?, relationship = ?, date_of_birth = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(name, relationship, dateOfBirth || null, id);

    return this.findById(id);
  }

  public softDelete(id: number): boolean {
    const info = db.prepare(`
      UPDATE family_members 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(id);

    return info.changes > 0;
  }

  public restore(id: number): boolean {
    const info = db.prepare(`
      UPDATE family_members 
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NOT NULL
    `).run(id);

    return info.changes > 0;
  }
}

export const familyMemberRepository = new SQLiteFamilyMemberRepository();
