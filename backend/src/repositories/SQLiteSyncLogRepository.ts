import { db } from '../db';
import { SyncLog, ISyncLogRepository } from './ISyncLogRepository';

export class SQLiteSyncLogRepository implements ISyncLogRepository {
  public getRecentLogs(limit: number = 20): SyncLog[] {
    return db.prepare(`
      SELECT * FROM sync_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit) as SyncLog[];
  }

  public addLog(syncType: string, status: string, message: string): void {
    db.prepare(`
      INSERT INTO sync_logs (sync_type, status, message)
      VALUES (?, ?, ?)
    `).run(syncType, status, message);
  }
}

export const syncLogRepository = new SQLiteSyncLogRepository();
