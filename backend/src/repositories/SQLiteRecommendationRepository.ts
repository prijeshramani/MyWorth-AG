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

  public getRecommendations(familyId: number, statusFilter?: string): RecommendationRecord[] {
    if (statusFilter) {
      return this.db.prepare('SELECT * FROM recommendations WHERE family_id = ? AND status = ? ORDER BY financial_impact_amount DESC').all(familyId, statusFilter) as RecommendationRecord[];
    }
    return this.db.prepare('SELECT * FROM recommendations WHERE family_id = ? ORDER BY financial_impact_amount DESC').all(familyId) as RecommendationRecord[];
  }

  public getRecommendationById(id: number): RecommendationRecord | undefined {
    return this.db.prepare('SELECT * FROM recommendations WHERE id = ?').get(id) as RecommendationRecord | undefined;
  }

  public saveRecommendation(rec: Omit<RecommendationRecord, 'id' | 'created_at'>): RecommendationRecord {
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

  public logHistory(recommendationId: number, familyId: number, statusFrom: string, statusTo: string, changedBy: string, reason?: string): void {
    this.db.prepare(`
      INSERT INTO recommendation_history (recommendation_id, family_id, status_from, status_to, changed_by, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(recommendationId, familyId, statusFrom, statusTo, changedBy, reason || null);
  }

  public getHistory(familyId: number): Array<{ id: number; recommendation_id: number; status_from: string; status_to: string; changed_by: string; reason: string; created_at: string }> {
    return this.db.prepare('SELECT * FROM recommendation_history WHERE family_id = ? ORDER BY created_at DESC').all(familyId) as any[];
  }
}
