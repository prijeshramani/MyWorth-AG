import Database from 'better-sqlite3';

export interface UserRecord {
  id: number;
  family_id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: string;
  failed_login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SessionRecord {
  id: string;
  user_id: number;
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
}

export class SQLiteUserRepository {
  constructor(private db: Database.Database) {}

  public findByEmail(email: string): UserRecord | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL')
      .get(email.toLowerCase()) as UserRecord | undefined;
    return row || null;
  }

  public findById(id: number): UserRecord | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
      .get(id) as UserRecord | undefined;
    return row || null;
  }

  public create(user: Omit<UserRecord, 'id' | 'failed_login_attempts' | 'created_at' | 'updated_at'>): UserRecord {
    const stmt = this.db.prepare(`
      INSERT INTO users (family_id, email, password_hash, first_name, last_name, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      user.family_id,
      user.email.toLowerCase(),
      user.password_hash,
      user.first_name,
      user.last_name,
      user.status || 'ACTIVE'
    );

    return {
      id: Number(result.lastInsertRowid),
      ...user,
      failed_login_attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  public getUserRoles(userId: number): string[] {
    const rows = this.db
      .prepare(
        `SELECT r.name FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = ?`
      )
      .all(userId) as Array<{ name: string }>;
    return rows.map((r) => r.name);
  }

  public getUserPermissions(userId: number): string[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT p.name FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN user_roles ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = ?`
      )
      .all(userId) as Array<{ name: string }>;
    return rows.map((p) => p.name);
  }

  public assignRole(userId: number, roleName: string): void {
    const role = this.db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: number } | undefined;
    if (role) {
      this.db
        .prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)')
        .run(userId, role.id);
    }
  }

  public createSession(session: Omit<SessionRecord, 'created_at'>): SessionRecord {
    this.db
      .prepare(
        `INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        session.id,
        session.user_id,
        session.refresh_token,
        session.ip_address || null,
        session.user_agent || null,
        session.expires_at
      );

    return {
      ...session,
      created_at: new Date().toISOString()
    };
  }

  public findSessionByRefreshToken(refreshToken: string): SessionRecord | null {
    const row = this.db
      .prepare('SELECT * FROM sessions WHERE refresh_token = ? AND revoked_at IS NULL')
      .get(refreshToken) as SessionRecord | undefined;
    return row || null;
  }

  public revokeSession(sessionId: string): void {
    this.db
      .prepare("UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(sessionId);
  }
}
