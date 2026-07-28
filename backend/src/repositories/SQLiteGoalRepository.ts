import Database from 'better-sqlite3';

export interface ProjectionAssumptionsRecord {
  id: number;
  family_id: number;
  default_inflation_pct: number;
  equity_return_pct: number;
  debt_return_pct: number;
  education_inflation_pct: number;
  medical_inflation_pct: number;
  safe_withdrawal_rate_pct: number;
  sip_step_up_pct: number;
  retirement_age: number;
  life_expectancy: number;
  created_at: string;
}

export interface FinancialGoalRecord {
  id: number;
  family_id: number;
  goal_type: 'RETIREMENT' | 'EDUCATION' | 'HOUSE' | 'VEHICLE' | 'VACATION' | 'EMERGENCY';
  title: string;
  target_amount: number;
  target_year: number;
  current_allocated_amount: number;
  monthly_sip_amount: number;
  expected_return_pct: number;
  inflation_pct: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'IN_PROGRESS' | 'ACHIEVED' | 'DELAYED' | 'ON_TRACK';
  created_at: string;
}

export interface RetirementProfileRecord {
  id: number;
  family_id: number;
  current_age: number;
  retirement_age: number;
  life_expectancy: number;
  monthly_expenses_current: number;
  expected_post_retirement_expense_ratio: number;
  corpus_required: number;
  corpus_projected: number;
  readiness_pct: number;
  created_at: string;
}

export interface CashflowProfileRecord {
  id: number;
  family_id: number;
  monthly_inflow: number;
  monthly_outflow: number;
  monthly_surplus: number;
  annual_growth_pct: number;
  created_at: string;
}

export interface GoalRecommendationRecord {
  id: number;
  family_id: number;
  goal_id?: number;
  recommendation_type: string;
  title: string;
  description: string;
  action_impact_json?: string;
  priority: string;
  confidence_pct: number;
  time_horizon: string;
  status: string;
  created_at: string;
}

export class SQLiteGoalRepository {
  constructor(private db: Database.Database) {}

  public getOrCreateAssumptions(familyId: number): ProjectionAssumptionsRecord {
    let row = this.db
      .prepare('SELECT * FROM projection_assumptions WHERE family_id = ?')
      .get(familyId) as ProjectionAssumptionsRecord | undefined;

    if (!row) {
      const stmt = this.db.prepare(`
        INSERT INTO projection_assumptions (family_id, default_inflation_pct, equity_return_pct, debt_return_pct, education_inflation_pct, medical_inflation_pct, safe_withdrawal_rate_pct, sip_step_up_pct, retirement_age, life_expectancy)
        VALUES (?, 6.0, 12.0, 7.0, 10.0, 10.0, 4.0, 10.0, 60, 85)
      `);
      const res = stmt.run(familyId);
      row = {
        id: Number(res.lastInsertRowid),
        family_id: familyId,
        default_inflation_pct: 6.0,
        equity_return_pct: 12.0,
        debt_return_pct: 7.0,
        education_inflation_pct: 10.0,
        medical_inflation_pct: 10.0,
        safe_withdrawal_rate_pct: 4.0,
        sip_step_up_pct: 10.0,
        retirement_age: 60,
        life_expectancy: 85,
        created_at: new Date().toISOString()
      };
    }

    return row;
  }

  public getGoals(familyId: number): FinancialGoalRecord[] {
    return this.db.prepare('SELECT * FROM financial_goals WHERE family_id = ? ORDER BY target_year ASC').all(familyId) as FinancialGoalRecord[];
  }

  public createGoal(goal: Omit<FinancialGoalRecord, 'id' | 'created_at'>): FinancialGoalRecord {
    const stmt = this.db.prepare(`
      INSERT INTO financial_goals (family_id, goal_type, title, target_amount, target_year, current_allocated_amount, monthly_sip_amount, expected_return_pct, inflation_pct, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      goal.family_id,
      goal.goal_type,
      goal.title,
      goal.target_amount,
      goal.target_year,
      goal.current_allocated_amount || 0,
      goal.monthly_sip_amount || 0,
      goal.expected_return_pct || 12.0,
      goal.inflation_pct || 6.0,
      goal.priority || 'HIGH',
      goal.status || 'ON_TRACK'
    );

    const newGoal = { id: Number(res.lastInsertRowid), created_at: new Date().toISOString(), ...goal };
    this.logTimeline(goal.family_id, 'GOAL_CREATED', `Goal Added: ${goal.title}`, `Target: ₹${goal.target_amount.toLocaleString('en-IN')} by ${goal.target_year}`);
    return newGoal;
  }

  public getOrCreateRetirementProfile(familyId: number): RetirementProfileRecord {
    let row = this.db
      .prepare('SELECT * FROM retirement_profiles WHERE family_id = ?')
      .get(familyId) as RetirementProfileRecord | undefined;

    if (!row) {
      const stmt = this.db.prepare(`
        INSERT INTO retirement_profiles (family_id, current_age, retirement_age, life_expectancy, monthly_expenses_current, expected_post_retirement_expense_ratio, corpus_required, corpus_projected, readiness_pct)
        VALUES (?, 35, 60, 85, 75000.0, 0.8, 45000000.0, 38000000.0, 84.4)
      `);
      const res = stmt.run(familyId);
      row = {
        id: Number(res.lastInsertRowid),
        family_id: familyId,
        current_age: 35,
        retirement_age: 60,
        life_expectancy: 85,
        monthly_expenses_current: 75000.0,
        expected_post_retirement_expense_ratio: 0.8,
        corpus_required: 45000000.0,
        corpus_projected: 38000000.0,
        readiness_pct: 84.4,
        created_at: new Date().toISOString()
      };
    }

    return row;
  }

  public getOrCreateCashflowProfile(familyId: number): CashflowProfileRecord {
    let row = this.db
      .prepare('SELECT * FROM cashflow_profiles WHERE family_id = ?')
      .get(familyId) as CashflowProfileRecord | undefined;

    if (!row) {
      const stmt = this.db.prepare(`
        INSERT INTO cashflow_profiles (family_id, monthly_inflow, monthly_outflow, monthly_surplus, annual_growth_pct)
        VALUES (?, 250000.0, 120000.0, 130000.0, 8.0)
      `);
      const res = stmt.run(familyId);
      row = {
        id: Number(res.lastInsertRowid),
        family_id: familyId,
        monthly_inflow: 250000.0,
        monthly_outflow: 120000.0,
        monthly_surplus: 130000.0,
        annual_growth_pct: 8.0,
        created_at: new Date().toISOString()
      };
    }

    return row;
  }

  public getRecommendations(familyId: number): GoalRecommendationRecord[] {
    return this.db.prepare('SELECT * FROM goal_recommendations WHERE family_id = ? ORDER BY id DESC').all(familyId) as GoalRecommendationRecord[];
  }

  public addRecommendation(rec: Omit<GoalRecommendationRecord, 'id' | 'created_at'>): GoalRecommendationRecord {
    const stmt = this.db.prepare(`
      INSERT INTO goal_recommendations (family_id, goal_id, recommendation_type, title, description, action_impact_json, priority, confidence_pct, time_horizon, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      rec.family_id,
      rec.goal_id || null,
      rec.recommendation_type,
      rec.title,
      rec.description,
      rec.action_impact_json || null,
      rec.priority || 'HIGH',
      rec.confidence_pct || 90.0,
      rec.time_horizon || 'SHORT_TERM',
      rec.status || 'ACTIVE'
    );

    return { id: Number(res.lastInsertRowid), created_at: new Date().toISOString(), ...rec };
  }

  public getTimeline(familyId: number): Array<{ id: number; event_type: string; title: string; description: string; created_at: string }> {
    return this.db.prepare('SELECT * FROM planning_timeline WHERE family_id = ? ORDER BY created_at DESC').all(familyId) as any[];
  }

  public logTimeline(familyId: number, eventType: string, title: string, description: string): void {
    this.db.prepare(`
      INSERT INTO planning_timeline (family_id, event_type, title, description)
      VALUES (?, ?, ?, ?)
    `).run(familyId, eventType, title, description);
  }
}
