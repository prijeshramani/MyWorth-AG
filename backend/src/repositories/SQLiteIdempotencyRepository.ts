import { db } from '../db';

export interface IdempotencyRecord {
  idempotencyKey: string;
  familyId: number;
  endpoint: string;
  requestHash: string;
  responseStatus: number | null;
  responseBody: any | null;
  createdAt: string;
  expiresAt: string;
}

export class SQLiteIdempotencyRepository {
  public findKey(key: string): IdempotencyRecord | null {
    const row = db.prepare(`
      SELECT * FROM idempotency_keys 
      WHERE idempotency_key = ? AND datetime(expires_at) > datetime('now')
    `).get(key) as any;

    if (!row) return null;

    return {
      idempotencyKey: row.idempotency_key,
      familyId: row.family_id,
      endpoint: row.endpoint,
      requestHash: row.request_hash,
      responseStatus: row.response_status,
      responseBody: row.response_body ? JSON.parse(row.response_body) : null,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    };
  }

  public reserveKey(
    key: string,
    familyId: number,
    endpoint: string,
    requestHash: string,
    ttlSeconds: number = 86400 // default 24h
  ): boolean {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    try {
      const stmt = db.prepare(`
        INSERT INTO idempotency_keys (idempotency_key, family_id, endpoint, request_hash, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(key, familyId, endpoint, requestHash, expiresAt);
      return true;
    } catch (err: any) {
      // Key already exists
      return false;
    }
  }

  public saveResponse(key: string, status: number, body: any): void {
    db.prepare(`
      UPDATE idempotency_keys
      SET response_status = ?, response_body = ?
      WHERE idempotency_key = ?
    `).run(status, JSON.stringify(body), key);
  }

  public purgeExpiredKeys(): number {
    const res = db.prepare(`
      DELETE FROM idempotency_keys 
      WHERE datetime(expires_at) <= datetime('now')
    `).run();
    return res.changes;
  }
}

export const idempotencyRepository = new SQLiteIdempotencyRepository();
