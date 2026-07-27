import Database from 'better-sqlite3';

export interface AuditLogRecord {
  id: number;
  user_id?: number;
  family_id?: number;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_state?: string;
  after_state?: string;
  ip_address?: string;
  correlation_id?: string;
  created_at: string;
}

export class SQLiteAuditRepository {
  constructor(private db: Database.Database) {}

  public log(entry: Omit<AuditLogRecord, 'id' | 'created_at'>): AuditLogRecord {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (
        user_id, family_id, action, entity_type, entity_id, before_state, after_state, ip_address, correlation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      entry.user_id || null,
      entry.family_id || null,
      entry.action,
      entry.entity_type,
      entry.entity_id || null,
      entry.before_state || null,
      entry.after_state || null,
      entry.ip_address || null,
      entry.correlation_id || null
    );

    return {
      id: Number(result.lastInsertRowid),
      ...entry,
      created_at: new Date().toISOString()
    };
  }
}
