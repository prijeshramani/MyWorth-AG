import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { db, dbPath } from '../db';

export const backupRouter = Router();

// Configure multer memory storage for file uploads (up to 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Helper: Get user-defined database tables
function getUserTables(database: any = db): string[] {
  const rows = database.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_old' AND name NOT LIKE '%_legacy%'"
  ).all() as Array<{ name: string }>;
  return rows.map(r => r.name);
}

/**
 * 1. Export JSON Backup
 * GET /api/v1/platform/backup/export/json
 */
backupRouter.get('/export/json', (req: Request, res: Response) => {
  try {
    const tables = getUserTables();
    const dump: Record<string, any[]> = {};
    let totalRows = 0;

    for (const table of tables) {
      const rows = db.prepare(`SELECT * FROM "${table}"`).all();
      dump[table] = rows;
      totalRows += rows.length;
    }

    const payload = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      platform: 'MyWorth FamilyWealthOS',
      tableCount: tables.length,
      totalRecordCount: totalRows,
      tables: dump
    };

    const filename = `myworth_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error: any) {
    console.error('[BackupAPI] JSON export failed:', error);
    res.status(500).json({ error: `JSON export failed: ${error.message}` });
  }
});

/**
 * 2. Export SQLite Database File
 * GET /api/v1/platform/backup/export/sqlite
 */
backupRouter.get('/export/sqlite', async (req: Request, res: Response) => {
  const tempBackupPath = path.join(path.dirname(dbPath), `temp_export_${Date.now()}.db`);
  try {
    // Perform clean online backup using better-sqlite3
    await db.backup(tempBackupPath);

    const filename = `myworth_database_${new Date().toISOString().slice(0, 10)}.sqlite`;
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(tempBackupPath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      if (fs.existsSync(tempBackupPath)) {
        try { fs.unlinkSync(tempBackupPath); } catch {}
      }
    });

    fileStream.on('error', (err) => {
      console.error('[BackupAPI] SQLite stream error:', err);
      if (fs.existsSync(tempBackupPath)) {
        try { fs.unlinkSync(tempBackupPath); } catch {}
      }
    });
  } catch (error: any) {
    console.error('[BackupAPI] SQLite export failed:', error);
    if (fs.existsSync(tempBackupPath)) {
      try { fs.unlinkSync(tempBackupPath); } catch {}
    }
    res.status(500).json({ error: `SQLite database export failed: ${error.message}` });
  }
});

/**
 * 3. Restore JSON Backup
 * POST /api/v1/platform/backup/restore/json
 */
backupRouter.post('/restore/json', upload.single('file'), (req: Request, res: Response) => {
  try {
    let backupData: any = null;

    if (req.file) {
      const content = req.file.buffer.toString('utf-8');
      backupData = JSON.parse(content);
    } else if (req.body && req.body.tables) {
      backupData = req.body;
    } else if (req.body && typeof req.body === 'string') {
      backupData = JSON.parse(req.body);
    }

    if (!backupData || !backupData.tables || typeof backupData.tables !== 'object') {
      return res.status(400).json({
        error: 'Invalid JSON backup format. Payload must contain a top-level "tables" dictionary object.'
      });
    }

    const restoredTables: string[] = [];
    let totalRestoredRecords = 0;

    db.pragma('foreign_keys = OFF');
    try {
      db.transaction(() => {
        for (const [tableName, rows] of Object.entries(backupData.tables)) {
          // Check if table exists in current database
          const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
          if (!tableCheck) continue;

          // Clear existing rows
          db.prepare(`DELETE FROM "${tableName}"`).run();

          if (Array.isArray(rows) && rows.length > 0) {
            const cols = Object.keys(rows[0]);
            const colNames = cols.map(c => `"${c}"`).join(', ');
            const placeholders = cols.map(() => '?').join(', ');
            const insertStmt = db.prepare(`INSERT OR REPLACE INTO "${tableName}" (${colNames}) VALUES (${placeholders})`);

            for (const row of rows as Record<string, any>[]) {
              const values = cols.map(c => row[c]);
              insertStmt.run(...values);
            }
            totalRestoredRecords += rows.length;
          }
          restoredTables.push(tableName);
        }
      })();
    } finally {
      db.pragma('foreign_keys = ON');
    }

    res.json({
      success: true,
      message: `Successfully restored ${totalRestoredRecords} records across ${restoredTables.length} tables from JSON backup.`,
      restoredTablesCount: restoredTables.length,
      restoredRecordCount: totalRestoredRecords,
      tables: restoredTables
    });
  } catch (error: any) {
    console.error('[BackupAPI] JSON restore failed:', error);
    res.status(500).json({ error: `JSON restore failed: ${error.message}` });
  }
});

/**
 * 4. Restore SQLite Database Backup
 * POST /api/v1/platform/backup/restore/sqlite
 */
backupRouter.post('/restore/sqlite', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No SQLite database file (.db or .sqlite) uploaded.' });
  }

  const tempRestorePath = path.join(path.dirname(dbPath), `temp_restore_${Date.now()}.db`);

  try {
    // Write uploaded buffer to temporary file
    fs.writeFileSync(tempRestorePath, req.file.buffer);

    // Open uploaded SQLite DB
    const uploadedDb = new Database(tempRestorePath, { readonly: true });
    const uploadedTables = getUserTables(uploadedDb);

    if (uploadedTables.length === 0) {
      uploadedDb.close();
      if (fs.existsSync(tempRestorePath)) fs.unlinkSync(tempRestorePath);
      return res.status(400).json({ error: 'Uploaded SQLite database file contains no readable user tables.' });
    }

    const restoredTables: string[] = [];
    let totalRestoredRecords = 0;

    db.pragma('foreign_keys = OFF');
    try {
      db.transaction(() => {
        for (const tableName of uploadedTables) {
          // Check if target table exists in active DB
          const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
          if (!tableCheck) continue;

          // Clear active table
          db.prepare(`DELETE FROM "${tableName}"`).run();

          // Fetch rows from uploaded DB
          const rows = uploadedDb.prepare(`SELECT * FROM "${tableName}"`).all() as Record<string, any>[];

          if (rows.length > 0) {
            const cols = Object.keys(rows[0]);
            const colNames = cols.map(c => `"${c}"`).join(', ');
            const placeholders = cols.map(() => '?').join(', ');
            const insertStmt = db.prepare(`INSERT OR REPLACE INTO "${tableName}" (${colNames}) VALUES (${placeholders})`);

            for (const row of rows) {
              const values = cols.map(c => row[c]);
              insertStmt.run(...values);
            }
            totalRestoredRecords += rows.length;
          }
          restoredTables.push(tableName);
        }
      })();
    } finally {
      db.pragma('foreign_keys = ON');
      uploadedDb.close();
      if (fs.existsSync(tempRestorePath)) {
        try { fs.unlinkSync(tempRestorePath); } catch {}
      }
    }

    res.json({
      success: true,
      message: `Successfully restored ${totalRestoredRecords} records across ${restoredTables.length} tables from SQLite database file.`,
      restoredTablesCount: restoredTables.length,
      restoredRecordCount: totalRestoredRecords,
      tables: restoredTables
    });
  } catch (error: any) {
    console.error('[BackupAPI] SQLite restore failed:', error);
    if (fs.existsSync(tempRestorePath)) {
      try { fs.unlinkSync(tempRestorePath); } catch {}
    }
    res.status(500).json({ error: `SQLite restore failed: ${error.message}` });
  }
});
