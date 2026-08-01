import BetterSqlite3 from 'better-sqlite3';

export function up(db: BetterSqlite3.Database): void {
  // 1. Audit Trail Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_audit_trail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_id TEXT,
      question TEXT,
      skills_used TEXT,
      actions_proposed TEXT,
      user_decision TEXT DEFAULT 'CONFIRMED',
      evidence_used TEXT,
      execution_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Simulation Snapshots Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS simulation_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      template_type TEXT,
      scenario_inputs TEXT NOT NULL,
      assumptions TEXT NOT NULL,
      projection_results TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. AI Decision Journal Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_decision_journal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER DEFAULT 1,
      question TEXT NOT NULL,
      ai_explanation TEXT NOT NULL,
      simulations_executed TEXT,
      decisions_taken TEXT,
      actions_completed TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. AI Action Items Center Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_action_items (
      id TEXT PRIMARY KEY,
      family_id INTEGER DEFAULT 1,
      action_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      impact_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function down(db: BetterSqlite3.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS ai_action_items;
    DROP TABLE IF EXISTS ai_decision_journal;
    DROP TABLE IF EXISTS simulation_snapshots;
    DROP TABLE IF EXISTS ai_audit_trail;
  `);
}
