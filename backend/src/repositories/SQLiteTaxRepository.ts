import Database from 'better-sqlite3';

export interface TaxProfileRecord {
  id: number;
  family_id: number;
  user_id?: number;
  financial_year: string;
  assessment_year: string;
  residential_status: string;
  age_category: string;
  pan?: string;
  aadhaar_linked: number;
  preferred_regime: 'OLD' | 'NEW';
  is_huf: number;
  created_at: string;
  updated_at: string;
}

export interface TaxIncomeSourceRecord {
  id: number;
  family_id: number;
  tax_profile_id: number;
  category: string;
  gross_amount: number;
  tax_deducted: number;
}

export interface TaxDeductionRecord {
  id: number;
  family_id: number;
  tax_profile_id: number;
  section: string;
  claimed_amount: number;
  document_id?: string;
}

export interface TaxRecommendationRecord {
  id: number;
  family_id: number;
  title: string;
  description: string;
  estimated_savings: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action_type: string;
}

export interface TaxCalendarRecord {
  id: number;
  title: string;
  due_date: string;
  category: string;
  status: string;
}

export class SQLiteTaxRepository {
  constructor(private db: Database.Database) {}

  public getOrCreateProfile(familyId: number, financialYear: string = '2025-26'): TaxProfileRecord {
    let profile = this.db
      .prepare('SELECT * FROM tax_profiles WHERE family_id = ? AND financial_year = ? AND deleted_at IS NULL')
      .get(familyId, financialYear) as TaxProfileRecord | undefined;

    if (!profile) {
      const stmt = this.db.prepare(`
        INSERT INTO tax_profiles (family_id, financial_year, assessment_year, residential_status, age_category, preferred_regime)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const res = stmt.run(familyId, financialYear, '2026-27', 'RESIDENT', 'REGULAR', 'NEW');

      profile = {
        id: Number(res.lastInsertRowid),
        family_id: familyId,
        financial_year: financialYear,
        assessment_year: '2026-27',
        residential_status: 'RESIDENT',
        age_category: 'REGULAR',
        aadhaar_linked: 1,
        preferred_regime: 'NEW',
        is_huf: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return profile;
  }

  public getIncomeSources(familyId: number, profileId: number): TaxIncomeSourceRecord[] {
    return this.db
      .prepare('SELECT * FROM tax_income_sources WHERE family_id = ? AND tax_profile_id = ?')
      .all(familyId, profileId) as TaxIncomeSourceRecord[];
  }

  public addIncomeSource(income: Omit<TaxIncomeSourceRecord, 'id'>): TaxIncomeSourceRecord {
    const stmt = this.db.prepare(`
      INSERT INTO tax_income_sources (family_id, tax_profile_id, category, gross_amount, tax_deducted)
      VALUES (?, ?, ?, ?, ?)
    `);
    const res = stmt.run(income.family_id, income.tax_profile_id, income.category, income.gross_amount, income.tax_deducted);
    return { id: Number(res.lastInsertRowid), ...income };
  }

  public getDeductions(familyId: number, profileId: number): TaxDeductionRecord[] {
    return this.db
      .prepare('SELECT * FROM tax_deductions WHERE family_id = ? AND tax_profile_id = ?')
      .all(familyId, profileId) as TaxDeductionRecord[];
  }

  public saveDeduction(deduction: Omit<TaxDeductionRecord, 'id'>): TaxDeductionRecord {
    const stmt = this.db.prepare(`
      INSERT INTO tax_deductions (family_id, tax_profile_id, section, claimed_amount, document_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const res = stmt.run(deduction.family_id, deduction.tax_profile_id, deduction.section, deduction.claimed_amount, deduction.document_id || null);
    return { id: Number(res.lastInsertRowid), ...deduction };
  }

  public getRecommendations(familyId: number): TaxRecommendationRecord[] {
    return this.db
      .prepare('SELECT * FROM tax_recommendations WHERE family_id = ? ORDER BY estimated_savings DESC')
      .all(familyId) as TaxRecommendationRecord[];
  }

  public getCalendarEvents(): TaxCalendarRecord[] {
    return this.db
      .prepare('SELECT * FROM tax_calendar ORDER BY due_date ASC')
      .all() as TaxCalendarRecord[];
  }
}
