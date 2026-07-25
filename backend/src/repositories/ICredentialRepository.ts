export interface CredentialEntry {
  key: string;
  value: string;
  updated_at?: string;
}

export interface ICredentialRepository {
  getCredential(key: string): string | null;
  saveCredential(key: string, value: string): void;
}
