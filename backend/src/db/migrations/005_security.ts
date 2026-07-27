import Database from 'better-sqlite3';
import { Migration } from '../migrationRunner';

export const migration005: Migration = {
  version: 5,
  name: '005_security',
  up: (db: Database.Database) => {
    // 1. Users Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id REAL NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'LOCKED', 'SUSPENDED')),
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT DEFAULT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT DEFAULT NULL,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      )
    `).run();

    // 2. Roles Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `).run();

    // Insert Default Roles
    db.prepare(`
      INSERT OR IGNORE INTO roles (name, description) VALUES
      ('Owner', 'Primary family account owner with full read/write administrative access'),
      ('Spouse', 'Co-owner with full read/write operational access'),
      ('AdultChild', 'Family member with read-only access to relevant portfolios'),
      ('Parent', 'Senior family member with view-only protection and health access'),
      ('Advisor', 'External financial advisor with view-only analytical access'),
      ('ReadOnly', 'Restricted view-only user access'),
      ('Administrator', 'System level administrator')
    `).run();

    // 3. Permissions Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `).run();

    // Insert Default Permissions
    db.prepare(`
      INSERT OR IGNORE INTO permissions (name, description) VALUES
      ('Investment.Read', 'View investment portfolios, holdings, and valuations'),
      ('Investment.Write', 'Create and modify investment transactions and assets'),
      ('Insurance.Read', 'View insurance policies and protection score'),
      ('Insurance.Write', 'Create and update insurance policy records'),
      ('Family.Read', 'View family members and entities'),
      ('Family.Write', 'Manage family members and entity structures'),
      ('Settings.Manage', 'Manage family settings and security parameters'),
      ('Documents.Read', 'View policy bonds and financial document vault'),
      ('Documents.Write', 'Upload and manage vault documents')
    `).run();

    // 4. User Roles Mapping Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `).run();

    // 5. Role Permissions Mapping Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `).run();

    // Assign all permissions to 'Owner' and 'Administrator'
    const ownerRole = db.prepare("SELECT id FROM roles WHERE name = 'Owner'").get() as { id: number } | undefined;
    if (ownerRole) {
      const allPerms = db.prepare('SELECT id FROM permissions').all() as Array<{ id: number }>;
      for (const perm of allPerms) {
        db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(ownerRole.id, perm.id);
      }
    }

    // 6. Sessions Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        refresh_token TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        expires_at TEXT NOT NULL,
        revoked_at TEXT DEFAULT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // 7. Audit Logs Table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        family_id REAL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        before_state TEXT,
        after_state TEXT,
        ip_address TEXT,
        correlation_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_family 
      ON audit_logs(family_id, created_at)
    `).run();
  },
  down: (db: Database.Database) => {
    db.prepare('DROP INDEX IF EXISTS idx_audit_logs_family').run();
    db.prepare('DROP TABLE IF EXISTS audit_logs').run();
    db.prepare('DROP TABLE IF EXISTS sessions').run();
    db.prepare('DROP TABLE IF EXISTS role_permissions').run();
    db.prepare('DROP TABLE IF EXISTS user_roles').run();
    db.prepare('DROP TABLE IF EXISTS permissions').run();
    db.prepare('DROP TABLE IF EXISTS roles').run();
    db.prepare('DROP TABLE IF EXISTS users').run();
  }
};
