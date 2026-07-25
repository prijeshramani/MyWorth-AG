import { db } from '../db';
import { ICredentialRepository } from './ICredentialRepository';
import { encryptText, decryptText } from '../services/encryptionService';

export class SQLiteCredentialRepository implements ICredentialRepository {
  public getCredential(key: string): string | null {
    const row = db.prepare('SELECT value FROM credentials WHERE key = ?').get(key) as { value: string } | undefined;
    if (!row) return null;
    
    // Decrypt on retrieval (handles legacy plain-text transparently)
    return decryptText(row.value);
  }

  public saveCredential(key: string, value: string): void {
    // Encrypt sensitive credential before writing to SQLite
    const encryptedValue = encryptText(value);
    
    db.prepare(`
      INSERT OR REPLACE INTO credentials (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(key, encryptedValue);
  }
}

export const credentialRepository = new SQLiteCredentialRepository();
