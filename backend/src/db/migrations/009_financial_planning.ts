import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration009: Migration = {
  version: 9,
  name: '009_financial_planning',
  up: (db: Database.Database) => {
    // 1. Projection Assumptions Table (Central Registry)
    db.prepare(`
      CREATE TABLE IF NOT EXISTS projection_assumptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL UNIQUE,
        default_inflation_pct REAL NOT NULL DEFAULT 6.0,
        equity_return_pct REAL NOT NULL DEFAULT 12.0,
        debt_return_pct REAL NOT NULL DEFAULT 7.0,
        education_inflation_pct REAL NOT NULL DEFAULT 10.0,
        medical_inflation_pct REAL NOT NULL DEFAULT 10.0,
        safe_withdrawal_rate_pct REAL NOT NULL DEFAULT 4.0,
        sip_step_up_pct REAL NOT NULL DEFAULT 10.0,
        retirement_age INTEGER NOT NULL DEFAULT 60,
        life_expectancy INTEGER NOT NULL DEFAULT 85,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 2. Financial Goals Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS financial_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        goal_type TEXT NOT NULL CHECK(goal_type IN ('RETIREMENT', 'EDUCATION', 'HOUSE', 'VEHICLE', 'VACATION', 'EMERGENCY')),
        title TEXT NOT NULL,
        target_amount REAL NOT NULL DEFAULT 0.0,
        target_year INTEGER NOT NULL,
        current_allocated_amount REAL NOT NULL DEFAULT 0.0,
        monthly_sip_amount REAL NOT NULL DEFAULT 0.0,
        expected_return_pct REAL NOT NULL DEFAULT 12.0,
        inflation_pct REAL NOT NULL DEFAULT 6.0,
        priority TEXT NOT NULL DEFAULT 'HIGH' CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')),
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK(status IN ('IN_PROGRESS', 'ACHIEVED', 'DELAYED', 'ON_TRACK')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 3. Goal Allocations Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS goal_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER NOT NULL,
        holding_id INTEGER NOT NULL,
        allocated_pct REAL NOT NULL DEFAULT 100.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES financial_goals(id) ON DELETE CASCADE
      )
    `).run();

    // 4. Projection Scenarios Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS projection_scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        scenario_name TEXT NOT NULL,
        inflation_override_pct REAL,
        return_override_pct REAL,
        step_up_override_pct REAL,
        is_baseline INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 5. Retirement Profiles Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS retirement_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL UNIQUE,
        current_age INTEGER NOT NULL DEFAULT 35,
        retirement_age INTEGER NOT NULL DEFAULT 60,
        life_expectancy INTEGER NOT NULL DEFAULT 85,
        monthly_expenses_current REAL NOT NULL DEFAULT 75000.0,
        expected_post_retirement_expense_ratio REAL NOT NULL DEFAULT 0.8,
        corpus_required REAL NOT NULL DEFAULT 0.0,
        corpus_projected REAL NOT NULL DEFAULT 0.0,
        readiness_pct REAL NOT NULL DEFAULT 0.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 6. Cashflow Profiles Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS cashflow_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL UNIQUE,
        monthly_inflow REAL NOT NULL DEFAULT 250000.0,
        monthly_outflow REAL NOT NULL DEFAULT 120000.0,
        monthly_surplus REAL NOT NULL DEFAULT 130000.0,
        annual_growth_pct REAL NOT NULL DEFAULT 8.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 7. Goal Recommendations Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS goal_recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        goal_id INTEGER,
        recommendation_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        action_impact_json TEXT,
        priority TEXT NOT NULL DEFAULT 'HIGH',
        confidence_pct REAL NOT NULL DEFAULT 90.0,
        time_horizon TEXT NOT NULL DEFAULT 'SHORT_TERM',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 8. Planning Timeline Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS planning_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    db.prepare(`CREATE INDEX IF NOT EXISTS idx_goals_family ON financial_goals(family_id)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_recs_family ON goal_recommendations(family_id)`).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_recs_family').run();
    db.prepare('DROP INDEX IF EXISTS idx_goals_family').run();
    db.prepare('DROP TABLE IF EXISTS planning_timeline').run();
    db.prepare('DROP TABLE IF EXISTS goal_recommendations').run();
    db.prepare('DROP TABLE IF EXISTS cashflow_profiles').run();
    db.prepare('DROP TABLE IF EXISTS retirement_profiles').run();
    db.prepare('DROP TABLE IF EXISTS projection_scenarios').run();
    db.prepare('DROP TABLE IF EXISTS goal_allocations').run();
    db.prepare('DROP TABLE IF EXISTS financial_goals').run();
    db.prepare('DROP TABLE IF EXISTS projection_assumptions').run();
  }
};
