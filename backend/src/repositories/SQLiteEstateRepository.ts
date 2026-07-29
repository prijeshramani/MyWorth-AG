import Database from 'better-sqlite3';

export interface EstateProfileRecord {
  id: number;
  family_id: number;
  estate_health_score: number;
  estate_value: number;
  primary_executor_id?: number;
  lawyer_contact?: string;
  ca_contact?: string;
  doctor_contact?: string;
  last_reviewed_at: string;
  created_at: string;
}

export interface WillRecord {
  id: number;
  family_id: number;
  testator_id: number;
  title: string;
  current_version: number;
  status: 'DRAFT' | 'ACTIVE' | 'REGISTERED' | 'REVOKED';
  registration_number?: string;
  registered_at?: string;
  review_due_date?: string;
  executor_name: string;
  witness1_name?: string;
  witness2_name?: string;
  document_id?: string;
  created_at: string;
}

export interface TrustRecord {
  id: number;
  family_id: number;
  trust_name: string;
  trust_type: 'FAMILY' | 'PRIVATE' | 'CHARITABLE' | 'REVOCABLE' | 'IRREVOCABLE';
  deed_number?: string;
  corpus_amount: number;
  settlor_id: number;
  document_id?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface BeneficiaryRecord {
  id: number;
  family_id: number;
  person_id: number;
  entitlement_percent: number;
  relationship_type: string;
  notes?: string;
}

export interface EstateTimelineRecord {
  id: number;
  family_id: number;
  event_type: string;
  title: string;
  description: string;
  created_at: string;
}

export class SQLiteEstateRepository {
  constructor(private db: Database.Database) {}

  public getOrCreateProfile(familyId: number): EstateProfileRecord {
    let profile = this.db
      .prepare('SELECT * FROM estate_profiles WHERE family_id = ?')
      .get(familyId) as EstateProfileRecord | undefined;

    if (!profile) {
      const stmt = this.db.prepare(`
        INSERT INTO estate_profiles (family_id, estate_health_score, estate_value, lawyer_contact, ca_contact)
        VALUES (?, 85.0, 0.0, NULL, NULL)
      `);
      const res = stmt.run(familyId);
      profile = {
        id: Number(res.lastInsertRowid),
        family_id: familyId,
        estate_health_score: 85.0,
        estate_value: 0.0,
        lawyer_contact: undefined,
        ca_contact: undefined,
        last_reviewed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      this.logTimeline(familyId, 'PROFILE_CREATED', 'Estate Profile Initialized', 'Initial estate profile generated for family.');
    }

    try {
      const assetWorth = (this.db.prepare(`SELECT SUM(current_value) as total FROM holdings WHERE deleted_at IS NULL`).get() as any)?.total || 0;
      const bankWorth = (this.db.prepare(`SELECT SUM(balance) as total FROM accounts WHERE deleted_at IS NULL`).get() as any)?.total || 0;
      profile.estate_value = assetWorth + bankWorth;
    } catch {}

    return profile;
  }

  public getWills(familyId: number): WillRecord[] {
    return this.db.prepare('SELECT * FROM wills WHERE family_id = ? ORDER BY id DESC').all(familyId) as WillRecord[];
  }

  public createWill(will: Omit<WillRecord, 'id' | 'created_at' | 'current_version'>): WillRecord {
    const stmt = this.db.prepare(`
      INSERT INTO wills (family_id, testator_id, title, current_version, status, registration_number, executor_name, witness1_name, witness2_name, document_id)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      will.family_id,
      will.testator_id,
      will.title,
      will.status,
      will.registration_number || null,
      will.executor_name,
      will.witness1_name || null,
      will.witness2_name || null,
      will.document_id || null
    );

    const newWill = { id: Number(res.lastInsertRowid), current_version: 1, created_at: new Date().toISOString(), ...will };
    this.logTimeline(will.family_id, 'WILL_CREATED', `Will Created: ${will.title}`, `Executor: ${will.executor_name}`);
    return newWill;
  }

  public getTrusts(familyId: number): TrustRecord[] {
    return this.db.prepare('SELECT * FROM trusts WHERE family_id = ? ORDER BY id DESC').all(familyId) as TrustRecord[];
  }

  public createTrust(trust: Omit<TrustRecord, 'id' | 'created_at'>): TrustRecord {
    const stmt = this.db.prepare(`
      INSERT INTO trusts (family_id, trust_name, trust_type, deed_number, corpus_amount, settlor_id, document_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      trust.family_id,
      trust.trust_name,
      trust.trust_type,
      trust.deed_number || null,
      trust.corpus_amount,
      trust.settlor_id,
      trust.document_id || null,
      trust.status
    );

    const newTrust = { id: Number(res.lastInsertRowid), created_at: new Date().toISOString(), ...trust };
    this.logTimeline(trust.family_id, 'TRUST_CREATED', `Trust Formed: ${trust.trust_name}`, `Type: ${trust.trust_type}, Corpus: ₹${trust.corpus_amount.toLocaleString('en-IN')}`);
    return newTrust;
  }

  public getBeneficiaries(familyId: number): BeneficiaryRecord[] {
    return this.db.prepare('SELECT * FROM beneficiaries WHERE family_id = ?').all(familyId) as BeneficiaryRecord[];
  }

  public getTimeline(familyId: number): EstateTimelineRecord[] {
    return this.db.prepare('SELECT * FROM estate_timeline WHERE family_id = ? ORDER BY created_at DESC').all(familyId) as EstateTimelineRecord[];
  }

  public logTimeline(familyId: number, eventType: string, title: string, description: string): void {
    this.db.prepare(`
      INSERT INTO estate_timeline (family_id, event_type, title, description)
      VALUES (?, ?, ?, ?)
    `).run(familyId, eventType, title, description);
  }
}
