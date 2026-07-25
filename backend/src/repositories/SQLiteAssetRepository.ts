import { db } from '../db';
import { Asset, CreateAssetInput, IAssetRepository } from './IAssetRepository';

export class SQLiteAssetRepository implements IAssetRepository {
  public findAll(): Asset[] {
    return db.prepare('SELECT * FROM assets ORDER BY type, name').all() as Asset[];
  }

  public findById(id: number): Asset | null {
    const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as Asset | undefined;
    return row || null;
  }

  public findByIdentifierAndType(identifier: string, type: string): Asset | null {
    const row = db.prepare('SELECT * FROM assets WHERE identifier = ? AND type = ?').get(identifier, type) as Asset | undefined;
    return row || null;
  }

  public findByNameAndType(name: string, type: string): Asset | null {
    const row = db.prepare('SELECT * FROM assets WHERE name = ? AND type = ?').get(name, type) as Asset | undefined;
    return row || null;
  }

  public findByNameIdentifierType(name: string, identifier: string, type: string): Asset | null {
    const row = db.prepare('SELECT * FROM assets WHERE name = ? AND identifier = ? AND type = ?').get(name, identifier, type) as Asset | undefined;
    return row || null;
  }

  public create(input: CreateAssetInput): Asset {
    const result = db.prepare(`
      INSERT INTO assets (name, type, category, identifier)
      VALUES (?, ?, ?, ?)
    `).run(input.name, input.type, input.category, input.identifier || null);

    const createdId = Number(result.lastInsertRowid);
    return {
      id: createdId,
      name: input.name,
      type: input.type,
      category: input.category,
      identifier: input.identifier || null
    };
  }

  public delete(id: number): boolean {
    const info = db.prepare('DELETE FROM assets WHERE id = ?').run(id);
    return info.changes > 0;
  }
}

export const assetRepository = new SQLiteAssetRepository();
