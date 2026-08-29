import Database from 'better-sqlite3';
import { db } from '../db';
import { FamilyHealthSnapshotRow, FamilyHealthSnapshotRowSchema } from '../contracts/familyOfficeContracts';

export interface CreateHealthSnapshotInput {
  family_id: number;
  overall_score: number;
  pillar_scores_json: string;
  life_stage: string;
  weights_json: string;
  completeness_score: number;
  state_hash: string;
  calculation_version: string;
  snapshot_period: string; // YYYY-MM
  as_of_date: string;
}

export class SQLiteFamilyHealthRepository {
  private database: Database.Database;

  constructor(customDb?: Database.Database) {
    this.database = customDb || db;
  }

  public saveSnapshot(snapshot: CreateHealthSnapshotInput): FamilyHealthSnapshotRow {
    const stmt = this.database.prepare(`
      INSERT INTO family_health_history (
        family_id, overall_score, pillar_scores_json, life_stage,
        weights_json, completeness_score, state_hash, calculation_version,
        snapshot_period, as_of_date, created_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(family_id, snapshot_period, state_hash) DO UPDATE SET
        overall_score = excluded.overall_score,
        pillar_scores_json = excluded.pillar_scores_json,
        life_stage = excluded.life_stage,
        weights_json = excluded.weights_json,
        completeness_score = excluded.completeness_score,
        calculation_version = excluded.calculation_version,
        as_of_date = excluded.as_of_date
    `);

    stmt.run(
      snapshot.family_id,
      snapshot.overall_score,
      snapshot.pillar_scores_json,
      snapshot.life_stage,
      snapshot.weights_json,
      snapshot.completeness_score,
      snapshot.state_hash,
      snapshot.calculation_version,
      snapshot.snapshot_period,
      snapshot.as_of_date
    );

    return this.findSnapshotByPeriodAndHash(snapshot.family_id, snapshot.snapshot_period, snapshot.state_hash)!;
  }

  public getLatestSnapshot(familyId: number): FamilyHealthSnapshotRow | null {
    const row = this.database.prepare(`
      SELECT * FROM family_health_history 
      WHERE family_id = ? 
      ORDER BY as_of_date DESC, id DESC 
      LIMIT 1
    `).get(familyId) as FamilyHealthSnapshotRow | undefined;

    return row || null;
  }

  public getSnapshotHistory(familyId: number, limit: number = 24): FamilyHealthSnapshotRow[] {
    return this.database.prepare(`
      SELECT * FROM family_health_history 
      WHERE family_id = ? 
      ORDER BY as_of_date DESC, id DESC 
      LIMIT ?
    `).all(familyId, limit) as FamilyHealthSnapshotRow[];
  }

  public findSnapshotByMonth(familyId: number, snapshotPeriod: string): FamilyHealthSnapshotRow | null {
    const row = this.database.prepare(`
      SELECT * FROM family_health_history 
      WHERE family_id = ? AND snapshot_period = ?
      ORDER BY as_of_date DESC, id DESC
      LIMIT 1
    `).get(familyId, snapshotPeriod) as FamilyHealthSnapshotRow | undefined;

    return row || null;
  }

  public findSnapshotByPeriodAndHash(familyId: number, snapshotPeriod: string, stateHash: string): FamilyHealthSnapshotRow | null {
    const row = this.database.prepare(`
      SELECT * FROM family_health_history 
      WHERE family_id = ? AND snapshot_period = ? AND state_hash = ?
      LIMIT 1
    `).get(familyId, snapshotPeriod, stateHash) as FamilyHealthSnapshotRow | undefined;

    return row || null;
  }

  public deleteSnapshotsByFamily(familyId: number): void {
    this.database.prepare(`
      DELETE FROM family_health_history WHERE family_id = ?
    `).run(familyId);
  }
}

export const familyHealthRepository = new SQLiteFamilyHealthRepository();
