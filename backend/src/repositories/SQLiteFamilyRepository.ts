import { db } from '../db';
import { Family, CreateFamilyInput, UpdateFamilyInput, IFamilyRepository } from './IFamilyRepository';

export class SQLiteFamilyRepository implements IFamilyRepository {
  public findAll(): Family[] {
    return db.prepare('SELECT * FROM families WHERE deleted_at IS NULL ORDER BY name ASC').all() as Family[];
  }

  public findById(id: number): Family | null {
    const row = db.prepare('SELECT * FROM families WHERE id = ? AND deleted_at IS NULL').get(id) as Family | undefined;
    return row || null;
  }

  public create(input: CreateFamilyInput): Family {
    const currency = input.currency || 'INR';
    const result = db.prepare(`
      INSERT INTO families (name, currency)
      VALUES (?, ?)
    `).run(input.name, currency);

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  }

  public update(id: number, input: UpdateFamilyInput): Family | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const name = input.name !== undefined ? input.name : existing.name;
    const currency = input.currency !== undefined ? input.currency : existing.currency;

    db.prepare(`
      UPDATE families 
      SET name = ?, currency = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(name, currency, id);

    return this.findById(id);
  }

  public softDelete(id: number): boolean {
    const info = db.prepare(`
      UPDATE families 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(id);

    return info.changes > 0;
  }

  public restore(id: number): boolean {
    const info = db.prepare(`
      UPDATE families 
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NOT NULL
    `).run(id);

    return info.changes > 0;
  }
}

export const familyRepository = new SQLiteFamilyRepository();
