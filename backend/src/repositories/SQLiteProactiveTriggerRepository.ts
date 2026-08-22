import Database from 'better-sqlite3';
import { db } from '../db';
import { ProactiveTrigger, CooldownRecord, ProactiveTriggerStatus, ObserverRuleCode } from '../contracts/familyOfficeContracts';

export interface ProactiveTriggerRow {
  id: number;
  trigger_id: string;
  family_id: number;
  rule_code: string;
  rule_version: string;
  entity_id: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority_score: number;
  confidence_pct: number;
  data_completeness_score: number;
  headline: string;
  rationale: string;
  evidence_payload_json: string;
  explainability_lineage_json: string;
  action_payload_json: string;
  state_hash: string;
  as_of_date: string;
  correlation_id: string;
  status: ProactiveTriggerStatus;
  snoozed_until: string | null;
  resolved_at: string | null;
  resolved_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CooldownRegistryRow {
  id: number;
  family_id: number;
  rule_code: string;
  rule_version: string;
  entity_id: string;
  last_triggered_at: string;
  cooldown_until: string;
  last_state_hash: string;
  last_metric_value: number | null;
  status: 'ACTIVE' | 'COOLDOWN' | 'DISMISSED' | 'SNOOZED';
  snoozed_until: string | null;
  dismissed_at: string | null;
  dismiss_reason: string | null;
  created_at: string;
  updated_at: string;
}

export class SQLiteProactiveTriggerRepository {
  constructor(private database: Database.Database = db) {}

  // ==========================================================================
  // PROACTIVE TRIGGER CRUD
  // ==========================================================================

  public createTrigger(trigger: ProactiveTrigger): ProactiveTriggerRow {
    const stmt = this.database.prepare(`
      INSERT OR REPLACE INTO proactive_triggers (
        trigger_id, family_id, rule_code, rule_version, entity_id,
        urgency, priority_score, confidence_pct, data_completeness_score,
        headline, rationale, evidence_payload_json, explainability_lineage_json,
        action_payload_json, state_hash, as_of_date, correlation_id,
        status, snoozed_until, expires_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    stmt.run(
      trigger.triggerId,
      trigger.familyId,
      trigger.ruleCode,
      trigger.ruleVersion || '2026.1',
      trigger.entityId || 'FAMILY',
      trigger.urgency,
      trigger.priorityScore || 50,
      trigger.confidencePct,
      trigger.dataCompletenessScore,
      trigger.headline,
      trigger.rationale,
      JSON.stringify(trigger.evidencePayload || {}),
      JSON.stringify(trigger.explainabilityLineage || {}),
      JSON.stringify(trigger.actionPayload || {}),
      trigger.stateHash,
      trigger.asOfDate,
      trigger.correlationId,
      trigger.status || 'ACTIVE',
      trigger.snoozedUntil || null,
      trigger.expiresAt || null
    );

    return this.findByTriggerId(trigger.triggerId)!;
  }

  public findByTriggerId(triggerId: string): ProactiveTriggerRow | null {
    const row = this.database.prepare(`
      SELECT * FROM proactive_triggers WHERE trigger_id = ?
    `).get(triggerId) as ProactiveTriggerRow | undefined;
    return row || null;
  }

  public findById(id: number): ProactiveTriggerRow | null {
    const row = this.database.prepare(`
      SELECT * FROM proactive_triggers WHERE id = ?
    `).get(id) as ProactiveTriggerRow | undefined;
    return row || null;
  }

  public getTriggers(familyId: number, statusFilter?: ProactiveTriggerStatus): ProactiveTriggerRow[] {
    if (statusFilter) {
      return this.database.prepare(`
        SELECT * FROM proactive_triggers 
        WHERE family_id = ? AND status = ?
        ORDER BY priority_score DESC, created_at DESC
      `).all(familyId, statusFilter) as ProactiveTriggerRow[];
    }
    return this.database.prepare(`
      SELECT * FROM proactive_triggers 
      WHERE family_id = ?
      ORDER BY priority_score DESC, created_at DESC
    `).all(familyId) as ProactiveTriggerRow[];
  }

  public getActiveTriggers(familyId: number): ProactiveTriggerRow[] {
    const nowIso = new Date().toISOString();
    return this.database.prepare(`
      SELECT * FROM proactive_triggers 
      WHERE family_id = ? 
        AND (status = 'ACTIVE' OR (status = 'SNOOZED' AND snoozed_until IS NOT NULL AND snoozed_until <= ?))
      ORDER BY priority_score DESC, created_at DESC
    `).all(familyId, nowIso) as ProactiveTriggerRow[];
  }

  public getActiveTriggerByRule(familyId: number, ruleCode: string, entityId: string = 'FAMILY'): ProactiveTriggerRow | null {
    const row = this.database.prepare(`
      SELECT * FROM proactive_triggers 
      WHERE family_id = ? AND rule_code = ? AND entity_id = ? AND status IN ('ACTIVE', 'ACKNOWLEDGED', 'SNOOZED')
      ORDER BY id DESC LIMIT 1
    `).get(familyId, ruleCode, entityId) as ProactiveTriggerRow | undefined;
    return row || null;
  }

  public updateTriggerStatus(
    triggerId: string, 
    status: ProactiveTriggerStatus, 
    options?: { snoozedUntil?: string; resolvedReason?: string }
  ): ProactiveTriggerRow | null {
    const resolvedAt = status === 'RESOLVED' ? new Date().toISOString() : null;
    this.database.prepare(`
      UPDATE proactive_triggers 
      SET status = ?, 
          snoozed_until = COALESCE(?, snoozed_until),
          resolved_at = COALESCE(?, resolved_at),
          resolved_reason = COALESCE(?, resolved_reason),
          updated_at = CURRENT_TIMESTAMP
      WHERE trigger_id = ?
    `).run(
      status,
      options?.snoozedUntil || null,
      resolvedAt,
      options?.resolvedReason || null,
      triggerId
    );

    return this.findByTriggerId(triggerId);
  }

  // ==========================================================================
  // COOLDOWN REGISTRY CRUD
  // ==========================================================================

  public getCooldown(familyId: number, ruleCode: string, entityId: string = 'FAMILY'): CooldownRegistryRow | null {
    const row = this.database.prepare(`
      SELECT * FROM proactive_cooldown_registry 
      WHERE family_id = ? AND rule_code = ? AND entity_id = ?
    `).get(familyId, ruleCode, entityId) as CooldownRegistryRow | undefined;
    return row || null;
  }

  public upsertCooldown(data: {
    familyId: number;
    ruleCode: string;
    ruleVersion?: string;
    entityId?: string;
    lastTriggeredAt: string;
    cooldownUntil: string;
    lastStateHash: string;
    lastMetricValue?: number;
    status?: 'ACTIVE' | 'COOLDOWN' | 'DISMISSED' | 'SNOOZED';
    snoozedUntil?: string;
    dismissedAt?: string;
    dismissReason?: string;
  }): void {
    const entityId = data.entityId || 'FAMILY';
    const ruleVersion = data.ruleVersion || '2026.1';
    const status = data.status || 'COOLDOWN';

    this.database.prepare(`
      INSERT INTO proactive_cooldown_registry (
        family_id, rule_code, rule_version, entity_id,
        last_triggered_at, cooldown_until, last_state_hash,
        last_metric_value, status, snoozed_until, dismissed_at, dismiss_reason,
        updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(family_id, rule_code, entity_id) DO UPDATE SET
        rule_version = excluded.rule_version,
        last_triggered_at = excluded.last_triggered_at,
        cooldown_until = excluded.cooldown_until,
        last_state_hash = excluded.last_state_hash,
        last_metric_value = COALESCE(excluded.last_metric_value, proactive_cooldown_registry.last_metric_value),
        status = excluded.status,
        snoozed_until = excluded.snoozed_until,
        dismissed_at = excluded.dismissed_at,
        dismiss_reason = excluded.dismiss_reason,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      data.familyId,
      data.ruleCode,
      ruleVersion,
      entityId,
      data.lastTriggeredAt,
      data.cooldownUntil,
      data.lastStateHash,
      data.lastMetricValue ?? null,
      status,
      data.snoozedUntil || null,
      data.dismissedAt || null,
      data.dismissReason || null
    );
  }

  /**
   * Execute trigger creation and cooldown registry update inside an atomic SQLite transaction
   */
  public executeAtomicTriggerCreation(
    trigger: ProactiveTrigger,
    cooldownData: {
      cooldownUntil: string;
      lastMetricValue?: number;
    }
  ): ProactiveTriggerRow {
    const transaction = this.database.transaction(() => {
      const created = this.createTrigger(trigger);
      this.upsertCooldown({
        familyId: trigger.familyId,
        ruleCode: trigger.ruleCode,
        ruleVersion: trigger.ruleVersion || '2026.1',
        entityId: trigger.entityId || 'FAMILY',
        lastTriggeredAt: trigger.asOfDate,
        cooldownUntil: cooldownData.cooldownUntil,
        lastStateHash: trigger.stateHash,
        lastMetricValue: cooldownData.lastMetricValue,
        status: 'COOLDOWN'
      });
      return created;
    });

    return transaction();
  }
}

export const proactiveTriggerRepository = new SQLiteProactiveTriggerRepository();
