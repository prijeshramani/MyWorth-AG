import { db } from '../db';

export interface SimulationSnapshotRecord {
  id: number;
  familyId: number;
  title: string;
  templateType: string;
  scenarioInputs: any;
  assumptions: any;
  projectionResults: any;
  createdAt: string;
}

export class SQLiteSimulationSnapshotRepository {
  public saveSnapshot(
    familyId: number = 1,
    title: string,
    templateType: string,
    scenarioInputs: any,
    assumptions: any,
    projectionResults: any
  ): SimulationSnapshotRecord {
    const result = db.prepare(`
      INSERT INTO simulation_snapshots (family_id, title, template_type, scenario_inputs, assumptions, projection_results)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      familyId,
      title,
      templateType,
      JSON.stringify(scenarioInputs),
      JSON.stringify(assumptions),
      JSON.stringify(projectionResults)
    );

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  }

  public findById(id: number): SimulationSnapshotRecord | null {
    const row = db.prepare('SELECT * FROM simulation_snapshots WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      familyId: row.family_id,
      title: row.title,
      templateType: row.template_type,
      scenarioInputs: JSON.parse(row.scenario_inputs || '{}'),
      assumptions: JSON.parse(row.assumptions || '{}'),
      projectionResults: JSON.parse(row.projection_results || '{}'),
      createdAt: row.created_at
    };
  }

  public findAllForFamily(familyId: number = 1): SimulationSnapshotRecord[] {
    const rows = db.prepare('SELECT * FROM simulation_snapshots WHERE family_id = ? ORDER BY created_at DESC').all(familyId) as any[];
    return rows.map(row => ({
      id: row.id,
      familyId: row.family_id,
      title: row.title,
      templateType: row.template_type,
      scenarioInputs: JSON.parse(row.scenario_inputs || '{}'),
      assumptions: JSON.parse(row.assumptions || '{}'),
      projectionResults: JSON.parse(row.projection_results || '{}'),
      createdAt: row.created_at
    }));
  }

  public deleteSnapshot(id: number): boolean {
    const info = db.prepare('DELETE FROM simulation_snapshots WHERE id = ?').run(id);
    return info.changes > 0;
  }
}

export const sqliteSimulationSnapshotRepository = new SQLiteSimulationSnapshotRepository();
