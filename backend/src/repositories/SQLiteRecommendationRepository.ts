import Database from 'better-sqlite3';

export interface RecommendationRecord {
  id: number;
  family_id: number;
  rule_id?: number;
  rule_code: string;
  category: 'INVESTMENT' | 'TAX' | 'ESTATE' | 'PROTECTION' | 'PLANNING';
  journey_id?: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_pct: number;
  financial_impact_amount: number;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'ACCEPTED' | 'DISMISSED' | 'SNOOZED' | 'COMPLETED' | 'EXPIRED';
  snoozed_until?: string;
  source_engines_json: string;
  supporting_evidence_json?: string;
  next_action_json?: string;
  ai_context_json?: string;
  created_at: string;
}

export interface RecommendationJourneyRecord {
  id: number;
  family_id: number;
  journey_code: string;
  title: string;
  description: string;
  total_steps: number;
  completed_steps: number;
  status: string;
  created_at: string;
}

export class SQLiteRecommendationRepository {
  constructor(private db: Database.Database) {}

  public purgeDuplicateActiveRecommendations(familyId: number): void {
    try {
      this.db.prepare(`
        DELETE FROM recommendations 
        WHERE status = 'ACTIVE' AND family_id = ? AND id NOT IN (
          SELECT MAX(id) FROM recommendations WHERE status = 'ACTIVE' AND family_id = ? GROUP BY rule_code
        )
      `).run(familyId, familyId);
    } catch (err) {
      console.warn('Warning purging duplicate recommendations:', err);
    }
  }

  public getRecommendations(familyId: number, statusFilter?: string): RecommendationRecord[] {
    this.purgeDuplicateActiveRecommendations(familyId);
    if (statusFilter) {
      return this.db.prepare('SELECT * FROM recommendations WHERE family_id = ? AND status = ? ORDER BY financial_impact_amount DESC').all(familyId, statusFilter) as RecommendationRecord[];
    }
    return this.db.prepare('SELECT * FROM recommendations WHERE family_id = ? ORDER BY financial_impact_amount DESC').all(familyId) as RecommendationRecord[];
  }

  public getRecommendationById(id: number): RecommendationRecord | undefined {
    return this.db.prepare('SELECT * FROM recommendations WHERE id = ?').get(id) as RecommendationRecord | undefined;
  }

  public saveRecommendation(rec: Omit<RecommendationRecord, 'id' | 'created_at'>): RecommendationRecord {
    const existing = this.db.prepare(
      "SELECT * FROM recommendations WHERE family_id = ? AND rule_code = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1"
    ).get(rec.family_id, rec.rule_code) as RecommendationRecord | undefined;

    if (existing) {
      this.db.prepare(`
        UPDATE recommendations SET
          rule_id = ?,
          category = ?,
          journey_id = ?,
          title = ?,
          description = ?,
          priority = ?,
          confidence_pct = ?,
          financial_impact_amount = ?,
          urgency = ?,
          source_engines_json = ?,
          supporting_evidence_json = ?,
          next_action_json = ?,
          ai_context_json = ?
        WHERE id = ?
      `).run(
        rec.rule_id || null,
        rec.category,
        rec.journey_id || null,
        rec.title,
        rec.description,
        rec.priority || 'HIGH',
        rec.confidence_pct || 90.0,
        rec.financial_impact_amount || 0.0,
        rec.urgency || 'MEDIUM',
        rec.source_engines_json,
        rec.supporting_evidence_json || null,
        rec.next_action_json || null,
        rec.ai_context_json || null,
        existing.id
      );

      this.purgeDuplicateActiveRecommendations(rec.family_id);
      return { ...existing, ...rec };
    }

    const stmt = this.db.prepare(`
      INSERT INTO recommendations (family_id, rule_id, rule_code, category, journey_id, title, description, priority, confidence_pct, financial_impact_amount, urgency, status, snoozed_until, source_engines_json, supporting_evidence_json, next_action_json, ai_context_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
      rec.family_id,
      rec.rule_id || null,
      rec.rule_code,
      rec.category,
      rec.journey_id || null,
      rec.title,
      rec.description,
      rec.priority || 'HIGH',
      rec.confidence_pct || 90.0,
      rec.financial_impact_amount || 0.0,
      rec.urgency || 'MEDIUM',
      rec.status || 'ACTIVE',
      rec.snoozed_until || null,
      rec.source_engines_json,
      rec.supporting_evidence_json || null,
      rec.next_action_json || null,
      rec.ai_context_json || null
    );

    const savedRec = { id: Number(res.lastInsertRowid), created_at: new Date().toISOString(), ...rec };
    this.logHistory(savedRec.id, rec.family_id, 'NONE', rec.status || 'ACTIVE', 'SYSTEM', 'Initial Recommendation Generation');
    return savedRec;
  }

  public updateStatus(id: number, familyId: number, newStatus: RecommendationRecord['status'], reason?: string): void {
    const current = this.getRecommendationById(id);
    if (!current) return;

    this.db.prepare('UPDATE recommendations SET status = ? WHERE id = ? AND family_id = ?').run(newStatus, id, familyId);
    this.logHistory(id, familyId, current.status, newStatus, 'USER', reason || `Status updated to ${newStatus}`);
  }

  public getJourneys(familyId: number): RecommendationJourneyRecord[] {
    return this.db.prepare('SELECT * FROM recommendation_journeys WHERE family_id = ?').all(familyId) as RecommendationJourneyRecord[];
  }

  public saveJourney(journey: Omit<RecommendationJourneyRecord, 'id' | 'created_at'>): RecommendationJourneyRecord {
    const stmt = this.db.prepare(`
      INSERT INTO recommendation_journeys (family_id, journey_code, title, description, total_steps, completed_steps, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(journey.family_id, journey.journey_code, journey.title, journey.description, journey.total_steps, journey.completed_steps, journey.status);
    return { id: Number(res.lastInsertRowid), created_at: new Date().toISOString(), ...journey };
  }

  public getHistory(familyId: number): any[] {
    return this.db.prepare('SELECT * FROM recommendation_history WHERE family_id = ? ORDER BY created_at DESC').all(familyId);
  }

  private logHistory(recommendationId: number, familyId: number, statusFrom: string, statusTo: string, changedBy: string, reason: string): void {
    this.db.prepare(`
      INSERT INTO recommendation_history (recommendation_id, family_id, status_from, status_to, changed_by, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(recommendationId, familyId, statusFrom, statusTo, changedBy, reason);
  }
}
