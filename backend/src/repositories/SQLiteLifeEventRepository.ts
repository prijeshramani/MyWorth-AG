import Database from 'better-sqlite3';
import { db } from '../db';
import { LifeEventType } from '../contracts/familyOfficeContracts';

export interface LifeEventRecord {
  id: number;
  family_id: number;
  event_type: LifeEventType;
  event_title: string;
  status: 'DETECTED' | 'VERIFIED' | 'PROCESSED' | 'DISMISSED';
  event_version: number;
  declared_at: string;
  effective_date: string;
  declared_by_member_id?: number | null;
  confidence_pct: number;
  evidence_completeness_pct: number;
  event_payload_json: string;
  evidence_payload_json: string;
  impact_summary_json: string;
  baseline_state_hash?: string | null;
  baseline_as_of?: string | null;
  rule_version: string;
  calculation_version: string;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  dismissed_at?: string | null;
  dismiss_reason?: string | null;
}

export interface CreateLifeEventDTO {
  family_id: number;
  event_type: LifeEventType;
  event_title: string;
  status?: 'DETECTED' | 'VERIFIED' | 'PROCESSED' | 'DISMISSED';
  declared_at?: string;
  effective_date: string;
  declared_by_member_id?: number | null;
  confidence_pct?: number;
  evidence_completeness_pct?: number;
  event_payload?: Record<string, any>;
  evidence_payload?: Record<string, any>;
  impact_summary?: Record<string, any>;
  baseline_state_hash?: string | null;
  baseline_as_of?: string | null;
  rule_version?: string;
  calculation_version?: string;
}

export class SQLiteLifeEventRepository {
  constructor(private database: Database.Database = db) {}

  public create(dto: CreateLifeEventDTO): LifeEventRecord {
    const declaredAt = dto.declared_at || new Date().toISOString();
    const status = dto.status || 'DETECTED';
    const confidencePct = dto.confidence_pct ?? 100.0;
    const evidenceCompletenessPct = dto.evidence_completeness_pct ?? 100.0;
    const eventPayloadJson = JSON.stringify(dto.event_payload || {});
    const evidencePayloadJson = JSON.stringify(dto.evidence_payload || {});
    const impactSummaryJson = JSON.stringify(dto.impact_summary || {});
    const ruleVersion = dto.rule_version || '2026.1';
    const calculationVersion = dto.calculation_version || '1.0.0';

    const stmt = this.database.prepare(`
      INSERT INTO life_events (
        family_id, event_type, event_title, status, event_version,
        declared_at, effective_date, declared_by_member_id, confidence_pct,
        evidence_completeness_pct, event_payload_json, evidence_payload_json,
        impact_summary_json, baseline_state_hash, baseline_as_of,
        rule_version, calculation_version
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      dto.family_id,
      dto.event_type,
      dto.event_title,
      status,
      declaredAt,
      dto.effective_date,
      dto.declared_by_member_id || null,
      confidencePct,
      evidenceCompletenessPct,
      eventPayloadJson,
      evidencePayloadJson,
      impactSummaryJson,
      dto.baseline_state_hash || null,
      dto.baseline_as_of || null,
      ruleVersion,
      calculationVersion
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  public findById(id: number): LifeEventRecord | null {
    const row = this.database.prepare('SELECT * FROM life_events WHERE id = ?').get(id) as LifeEventRecord | undefined;
    return row || null;
  }

  public findByFamilyId(familyId: number, statusFilter?: string): LifeEventRecord[] {
    if (statusFilter) {
      return this.database.prepare(
        'SELECT * FROM life_events WHERE family_id = ? AND status = ? ORDER BY effective_date DESC'
      ).all(familyId, statusFilter) as LifeEventRecord[];
    }
    return this.database.prepare(
      'SELECT * FROM life_events WHERE family_id = ? ORDER BY effective_date DESC'
    ).all(familyId) as LifeEventRecord[];
  }

  public updateImpactSummary(id: number, impactSummary: Record<string, any>, baselineHash?: string, baselineAsOf?: string): boolean {
    const stmt = this.database.prepare(`
      UPDATE life_events 
      SET impact_summary_json = ?, baseline_state_hash = COALESCE(?, baseline_state_hash),
          baseline_as_of = COALESCE(?, baseline_as_of), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const res = stmt.run(JSON.stringify(impactSummary), baselineHash || null, baselineAsOf || null, id);
    return res.changes > 0;
  }

  public updateStatus(
    id: number,
    status: 'DETECTED' | 'VERIFIED' | 'PROCESSED' | 'DISMISSED',
    meta?: { processedAt?: string; dismissedAt?: string; dismissReason?: string }
  ): boolean {
    const stmt = this.database.prepare(`
      UPDATE life_events 
      SET status = ?, 
          processed_at = COALESCE(?, processed_at),
          dismissed_at = COALESCE(?, dismissed_at),
          dismiss_reason = COALESCE(?, dismiss_reason),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const res = stmt.run(
      status,
      meta?.processedAt || (status === 'PROCESSED' ? new Date().toISOString() : null),
      meta?.dismissedAt || (status === 'DISMISSED' ? new Date().toISOString() : null),
      meta?.dismissReason || null,
      id
    );
    return res.changes > 0;
  }

  public delete(id: number): boolean {
    const res = this.database.prepare('DELETE FROM life_events WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

export const lifeEventRepository = new SQLiteLifeEventRepository();
