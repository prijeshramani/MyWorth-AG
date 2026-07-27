import Database from 'better-sqlite3';

export interface InsurancePolicyRecord {
  id: number;
  family_id: number;
  policy_number: string;
  insurer_name: string;
  policy_type: string;
  policy_holder_id: number;
  sum_assured: number;
  premium_amount: number;
  premium_frequency: string;
  start_date: string;
  maturity_date?: string;
  next_premium_due_date: string;
  status: string;
  nominee_name?: string;
  nominee_relationship?: string;
  document_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  holder_name?: string;
}

export class InsuranceRepository {
  constructor(private db: Database.Database) {}

  public findByFamilyId(familyId: number): InsurancePolicyRecord[] {
    const query = `
      SELECT p.*, m.name as holder_name
      FROM insurance_policies p
      JOIN family_members m ON p.policy_holder_id = m.id
      WHERE p.family_id = ? AND p.deleted_at IS NULL AND m.deleted_at IS NULL
      ORDER BY p.next_premium_due_date ASC
    `;
    return this.db.prepare(query).all(familyId) as InsurancePolicyRecord[];
  }

  public create(policy: Omit<InsurancePolicyRecord, 'id' | 'created_at' | 'updated_at'>): InsurancePolicyRecord {
    const stmt = this.db.prepare(`
      INSERT INTO insurance_policies (
        family_id, policy_number, insurer_name, policy_type, policy_holder_id,
        sum_assured, premium_amount, premium_frequency, start_date, maturity_date,
        next_premium_due_date, status, nominee_name, nominee_relationship, document_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      policy.family_id,
      policy.policy_number,
      policy.insurer_name,
      policy.policy_type,
      policy.policy_holder_id,
      policy.sum_assured,
      policy.premium_amount,
      policy.premium_frequency || 'ANNUAL',
      policy.start_date,
      policy.maturity_date || null,
      policy.next_premium_due_date,
      policy.status || 'ACTIVE',
      policy.nominee_name || null,
      policy.nominee_relationship || null,
      policy.document_id || null,
      policy.notes || null
    );

    return {
      id: Number(result.lastInsertRowid),
      ...policy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
