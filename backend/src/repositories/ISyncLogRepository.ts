export interface SyncLog {
  id: number;
  sync_type: string;
  status: string;
  message: string | null;
  timestamp: string;
}

export interface ISyncLogRepository {
  getRecentLogs(limit?: number): SyncLog[];
  addLog(syncType: string, status: string, message: string): void;
}
