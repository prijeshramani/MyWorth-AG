import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

export interface BackupMetadataDTO {
  filename: string;
  recoveryPointName: string;
  createdAt: string;
  sizeBytes: number;
  migrationVersion: number;
}

export interface RestoreVerificationResult {
  isValid: boolean;
  migrationVersion: number;
  foreignKeyCheck: boolean;
  errors: string[];
}

export class BackupService {
  private dataDir = path.resolve(__dirname, '../../../data');
  private dbPath = path.join(this.dataDir, 'familywealth.db');
  private backupDir = path.join(this.dataDir, 'backups');

  constructor() {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });
  }

  public createBackup(recoveryPointName = 'Manual Backup'): BackupMetadataDTO {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recovery_${recoveryPointName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.db`;
    const destPath = path.join(this.backupDir, filename);

    if (fs.existsSync(this.dbPath)) {
      fs.copyFileSync(this.dbPath, destPath);
    } else {
      const db = new Database(this.dbPath);
      db.close();
      fs.copyFileSync(this.dbPath, destPath);
    }

    const stats = fs.statSync(destPath);
    return {
      filename,
      recoveryPointName,
      createdAt: new Date().toISOString(),
      sizeBytes: stats.size,
      migrationVersion: 11
    };
  }

  public listBackups(): BackupMetadataDTO[] {
    if (!fs.existsSync(this.backupDir)) return [];
    const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.db'));

    return files.map(f => {
      const stats = fs.statSync(path.join(this.backupDir, f));
      return {
        filename: f,
        recoveryPointName: f.startsWith('recovery_') ? f.split('_')[1].toUpperCase() : 'BACKUP',
        createdAt: stats.mtime.toISOString(),
        sizeBytes: stats.size,
        migrationVersion: 11
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public restoreBackup(filename?: string): RestoreVerificationResult {
    const backups = this.listBackups();
    if (backups.length === 0) {
      return { isValid: false, migrationVersion: 0, foreignKeyCheck: false, errors: ['No backup files available.'] };
    }

    const targetFile = filename || backups[0].filename;
    const sourcePath = path.join(this.backupDir, targetFile);

    if (!fs.existsSync(sourcePath)) {
      return { isValid: false, migrationVersion: 0, foreignKeyCheck: false, errors: [`Backup file ${targetFile} not found.`] };
    }

    // Safety backup before restore
    this.createBackup('Before Restore');

    fs.copyFileSync(sourcePath, this.dbPath);

    // Data integrity verification
    return this.verifyIntegrity();
  }

  public verifyIntegrity(dbInstance?: Database.Database | string): RestoreVerificationResult {
    const errors: string[] = [];
    let migrationVersion = 0;
    let foreignKeyCheck = true;

    try {
      const db = (typeof dbInstance === 'object' && dbInstance !== null)
        ? dbInstance
        : new Database(typeof dbInstance === 'string' ? dbInstance : this.dbPath);

      const row = db.prepare('SELECT MAX(version) as ver FROM schema_migrations').get() as { ver: number };
      migrationVersion = row && row.ver ? row.ver : 11;

      const fkRows = db.prepare('PRAGMA foreign_key_check').all();
      if (fkRows.length > 0) {
        foreignKeyCheck = false;
        errors.push(`Foreign key violations found: ${fkRows.length} issues.`);
      }

      if (typeof dbInstance !== 'object') {
        db.close();
      }
    } catch (err: any) {
      errors.push(`Database integrity check failed: ${err.message}`);
    }

    return {
      isValid: errors.length === 0 && migrationVersion >= 11,
      migrationVersion,
      foreignKeyCheck,
      errors
    };
  }
}
