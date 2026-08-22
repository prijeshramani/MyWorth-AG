import { db } from '../db';

export interface AuditTrailRecord {
  id: number;
  actionId: string;
  question?: string;
  skillsUsed?: string[];
  actionsProposed?: any[];
  userDecision: 'CONFIRMED' | 'REJECTED' | 'DISMISSED' | 'EXECUTED' | 'UNDONE';
  evidenceUsed?: any[];
  executionResult?: any;
  createdAt: string;
}

export interface DecisionJournalRecord {
  id: number;
  familyId: number;
  question: string;
  aiExplanation: string;
  simulationsExecuted?: any[];
  decisionsTaken?: any[];
  actionsCompleted?: any[];
  createdAt: string;
}

export interface AIActionItemRecord {
  id: string;
  familyId: number;
  actionId: string;
  status: 'PENDING' | 'DRAFT' | 'RECOMMENDED' | 'COMPLETED' | 'SCHEDULED' | 'DISMISSED';
  title: string;
  description: string;
  impactSummary?: any;
  createdAt: string;
  updatedAt: string;
}

export class SQLiteAIAuditTrailRepository {
  // 1. Audit Trail Operations
  public logAuditEntry(entry: {
    actionId: string;
    question?: string;
    skillsUsed?: string[];
    actionsProposed?: any[];
    userDecision?: 'CONFIRMED' | 'REJECTED' | 'DISMISSED' | 'EXECUTED' | 'UNDONE';
    evidenceUsed?: any[];
    executionResult?: any;
  }): AuditTrailRecord {
    const result = db.prepare(`
      INSERT INTO ai_audit_trail (action_id, question, skills_used, actions_proposed, user_decision, evidence_used, execution_result)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.actionId,
      entry.question || null,
      JSON.stringify(entry.skillsUsed || []),
      JSON.stringify(entry.actionsProposed || []),
      entry.userDecision || 'CONFIRMED',
      JSON.stringify(entry.evidenceUsed || []),
      JSON.stringify(entry.executionResult || {})
    );

    const createdId = Number(result.lastInsertRowid);
    const row = db.prepare('SELECT * FROM ai_audit_trail WHERE id = ?').get(createdId) as any;

    return {
      id: row.id,
      actionId: row.action_id,
      question: row.question,
      skillsUsed: JSON.parse(row.skills_used || '[]'),
      actionsProposed: JSON.parse(row.actions_proposed || '[]'),
      userDecision: row.user_decision,
      evidenceUsed: JSON.parse(row.evidence_used || '[]'),
      executionResult: JSON.parse(row.execution_result || '{}'),
      createdAt: row.created_at
    };
  }

  public getAuditTrail(limit: number = 50): AuditTrailRecord[] {
    const rows = db.prepare('SELECT * FROM ai_audit_trail ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      actionId: r.action_id,
      question: r.question,
      skillsUsed: JSON.parse(r.skills_used || '[]'),
      actionsProposed: JSON.parse(r.actions_proposed || '[]'),
      userDecision: r.user_decision,
      evidenceUsed: JSON.parse(r.evidence_used || '[]'),
      executionResult: JSON.parse(r.execution_result || '{}'),
      createdAt: r.created_at
    }));
  }

  // 2. Decision Journal Operations
  public logDecisionJournal(entry: {
    familyId?: number;
    question: string;
    aiExplanation: string;
    simulationsExecuted?: any[];
    decisionsTaken?: any[];
    actionsCompleted?: any[];
  }): DecisionJournalRecord {
    const familyId = entry.familyId || 1;
    const result = db.prepare(`
      INSERT INTO ai_decision_journal (family_id, question, ai_explanation, simulations_executed, decisions_taken, actions_completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      familyId,
      entry.question,
      entry.aiExplanation,
      JSON.stringify(entry.simulationsExecuted || []),
      JSON.stringify(entry.decisionsTaken || []),
      JSON.stringify(entry.actionsCompleted || [])
    );

    const createdId = Number(result.lastInsertRowid);
    const row = db.prepare('SELECT * FROM ai_decision_journal WHERE id = ?').get(createdId) as any;

    return {
      id: row.id,
      familyId: row.family_id,
      question: row.question,
      aiExplanation: row.ai_explanation,
      simulationsExecuted: JSON.parse(row.simulations_executed || '[]'),
      decisionsTaken: JSON.parse(row.decisions_taken || '[]'),
      actionsCompleted: JSON.parse(row.actions_completed || '[]'),
      createdAt: row.created_at
    };
  }

  public getDecisionJournal(familyId: number): DecisionJournalRecord[] {
    const rows = db.prepare('SELECT * FROM ai_decision_journal WHERE family_id = ? ORDER BY created_at DESC').all(familyId) as any[];
    return rows.map(r => ({
      id: r.id,
      familyId: r.family_id,
      question: r.question,
      aiExplanation: r.ai_explanation,
      simulationsExecuted: JSON.parse(r.simulations_executed || '[]'),
      decisionsTaken: JSON.parse(r.decisions_taken || '[]'),
      actionsCompleted: JSON.parse(r.actions_completed || '[]'),
      createdAt: r.created_at
    }));
  }

  // 3. Action Center Items Operations
  public upsertActionItem(item: {
    id: string;
    familyId: number;
    actionId: string;
    status: 'PENDING' | 'DRAFT' | 'RECOMMENDED' | 'COMPLETED' | 'SCHEDULED' | 'DISMISSED';
    title: string;
    description: string;
    impactSummary?: any;
  }): AIActionItemRecord {
    const familyId = item.familyId;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ai_action_items (id, family_id, action_id, status, title, description, impact_summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        title = excluded.title,
        description = excluded.description,
        impact_summary = excluded.impact_summary,
        updated_at = excluded.updated_at
    `).run(
      item.id,
      familyId,
      item.actionId,
      item.status,
      item.title,
      item.description,
      JSON.stringify(item.impactSummary || {}),
      now,
      now
    );

    const row = db.prepare('SELECT * FROM ai_action_items WHERE id = ?').get(item.id) as any;
    return {
      id: row.id,
      familyId: row.family_id,
      actionId: row.action_id,
      status: row.status,
      title: row.title,
      description: row.description,
      impactSummary: JSON.parse(row.impact_summary || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  public getActionItemsByStatus(familyId: number, status?: string): AIActionItemRecord[] {
    const rows = status
      ? db.prepare('SELECT * FROM ai_action_items WHERE family_id = ? AND status = ? ORDER BY updated_at DESC').all(familyId, status) as any[]
      : db.prepare('SELECT * FROM ai_action_items WHERE family_id = ? ORDER BY updated_at DESC').all(familyId) as any[];

    return rows.map(r => ({
      id: r.id,
      familyId: r.family_id,
      actionId: r.action_id,
      status: r.status,
      title: r.title,
      description: r.description,
      impactSummary: JSON.parse(r.impact_summary || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  public updateActionStatus(id: string, status: 'PENDING' | 'DRAFT' | 'RECOMMENDED' | 'COMPLETED' | 'SCHEDULED' | 'DISMISSED'): boolean {
    const info = db.prepare('UPDATE ai_action_items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return info.changes > 0;
  }
}

export const sqliteAIAuditTrailRepository = new SQLiteAIAuditTrailRepository();
