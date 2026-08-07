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
  is_family_floater?: number; // 0 = individual, 1 = family floater
  covered_member_ids?: string; // CSV of family_member IDs (e.g. "1,2,3")
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  holder_name?: string;
}

export class InsuranceRepository {
  constructor(private db: Database.Database) {}

  public findByFamilyId(familyId: number): InsurancePolicyRecord[] {
    const query = `
      SELECT p.*, COALESCE(m.name, 'All Members') as holder_name
      FROM insurance_policies p
      LEFT JOIN family_members m ON p.policy_holder_id = m.id AND m.deleted_at IS NULL
      WHERE p.family_id = ? AND p.deleted_at IS NULL
      ORDER BY p.next_premium_due_date ASC
    `;
    return this.db.prepare(query).all(familyId) as InsurancePolicyRecord[];
  }

  public findById(id: number): InsurancePolicyRecord | null {
    const query = `
      SELECT p.*, COALESCE(m.name, 'All Members') as holder_name
      FROM insurance_policies p
      LEFT JOIN family_members m ON p.policy_holder_id = m.id AND m.deleted_at IS NULL
      WHERE p.id = ? AND p.deleted_at IS NULL
    `;
    return (this.db.prepare(query).get(id) as InsurancePolicyRecord | undefined) ?? null;
  }

  public create(policy: Omit<InsurancePolicyRecord, 'id' | 'created_at' | 'updated_at'>): InsurancePolicyRecord {
    const stmt = this.db.prepare(`
      INSERT INTO insurance_policies (
        family_id, policy_number, insurer_name, policy_type, policy_holder_id,
        sum_assured, premium_amount, premium_frequency, start_date, maturity_date,
        next_premium_due_date, status, nominee_name, nominee_relationship, document_id, notes,
        is_family_floater, covered_member_ids
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      policy.notes || null,
      policy.is_family_floater ?? 0,
      policy.covered_member_ids || null
    );

    return {
      id: Number(result.lastInsertRowid),
      ...policy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  public update(id: number, patch: Partial<Omit<InsurancePolicyRecord, 'id' | 'created_at' | 'family_id'>>): InsurancePolicyRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    this.db.prepare(`
      UPDATE insurance_policies SET
        policy_number = ?,
        insurer_name = ?,
        policy_type = ?,
        policy_holder_id = ?,
        sum_assured = ?,
        premium_amount = ?,
        premium_frequency = ?,
        start_date = ?,
        maturity_date = ?,
        next_premium_due_date = ?,
        status = ?,
        nominee_name = ?,
        nominee_relationship = ?,
        notes = ?,
        is_family_floater = ?,
        covered_member_ids = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(
      patch.policy_number ?? existing.policy_number,
      patch.insurer_name ?? existing.insurer_name,
      patch.policy_type ?? existing.policy_type,
      patch.policy_holder_id ?? existing.policy_holder_id,
      patch.sum_assured ?? existing.sum_assured,
      patch.premium_amount ?? existing.premium_amount,
      patch.premium_frequency ?? existing.premium_frequency,
      patch.start_date ?? existing.start_date,
      patch.maturity_date ?? existing.maturity_date ?? null,
      patch.next_premium_due_date ?? existing.next_premium_due_date,
      patch.status ?? existing.status,
      patch.nominee_name ?? existing.nominee_name ?? null,
      patch.nominee_relationship ?? existing.nominee_relationship ?? null,
      patch.notes ?? existing.notes ?? null,
      patch.is_family_floater ?? existing.is_family_floater ?? 0,
      patch.covered_member_ids ?? existing.covered_member_ids ?? null,
      id
    );

    return this.findById(id);
  }

  public delete(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE insurance_policies
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `);
    const res = stmt.run(id);
    return res.changes > 0;
  }
}
