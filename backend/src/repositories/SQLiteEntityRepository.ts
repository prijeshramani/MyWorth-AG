import { db } from '../db';
import { 
  Entity, 
  CreateEntityInput, 
  UpdateEntityInput, 
  IEntityRepository 
} from './IEntityRepository';

export class SQLiteEntityRepository implements IEntityRepository {
  public findAll(familyMemberId?: number): Entity[] {
    if (familyMemberId) {
      return db.prepare('SELECT * FROM entities WHERE family_member_id = ? AND deleted_at IS NULL ORDER BY name ASC').all(familyMemberId) as Entity[];
    }
    return db.prepare('SELECT * FROM entities WHERE deleted_at IS NULL ORDER BY name ASC').all() as Entity[];
  }

  public findById(id: number): Entity | null {
    const row = db.prepare('SELECT * FROM entities WHERE id = ? AND deleted_at IS NULL').get(id) as Entity | undefined;
    return row || null;
  }

  public findByPanNumber(panNumber: string): Entity | null {
    if (!panNumber) return null;
    const cleanPan = panNumber.trim().toUpperCase();
    const row = db.prepare('SELECT * FROM entities WHERE UPPER(pan_number) = ? AND deleted_at IS NULL').get(cleanPan) as Entity | undefined;
    return row || null;
  }

  public create(input: CreateEntityInput): Entity {
    const panNumber = input.pan_number ? input.pan_number.trim().toUpperCase() : null;
    const result = db.prepare(`
      INSERT INTO entities (family_member_id, name, entity_type, pan_number)
      VALUES (?, ?, ?, ?)
    `).run(input.family_member_id, input.name, input.entity_type, panNumber);

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  }

  public update(id: number, input: UpdateEntityInput): Entity | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const name = input.name !== undefined ? input.name : existing.name;
    const entityType = input.entity_type !== undefined ? input.entity_type : existing.entity_type;
    const panNumber = input.pan_number !== undefined 
      ? (input.pan_number ? input.pan_number.trim().toUpperCase() : null)
      : existing.pan_number;

    db.prepare(`
      UPDATE entities 
      SET name = ?, entity_type = ?, pan_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(name, entityType, panNumber, id);

    return this.findById(id);
  }

  public softDelete(id: number): boolean {
    const info = db.prepare(`
      UPDATE entities 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(id);

    return info.changes > 0;
  }

  public restore(id: number): boolean {
    const info = db.prepare(`
      UPDATE entities 
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NOT NULL
    `).run(id);

    return info.changes > 0;
  }
}

export const entityRepository = new SQLiteEntityRepository();
