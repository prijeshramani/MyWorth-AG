import Database from 'better-sqlite3';

export class TaxRuleSeedLoader {
  public static seedTaxRules(db: Database.Database): void {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tax_rules'").get();
    if (!tableCheck) {
      return;
    }

    // Check if rules exist
    const count = db.prepare('SELECT COUNT(*) as count FROM tax_rules').get() as { count: number };
    if (count && count.count > 0) {
      return;
    }

    console.log('Seeding baseline Indian Tax Rules for FY 2025-26 & FY 2026-27...');

    db.transaction(() => {
      // 1. New Tax Regime Rule FY 2025-26
      const newRegimeStmt = db.prepare(`
        INSERT INTO tax_rules (category, code, financial_year, assessment_year, version, effective_from, status, finance_act_year, rule_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const resNew = newRegimeStmt.run(
        'INCOME_TAX_SLABS',
        'IND_TAX_NEW_REGIME_FY2526',
        '2025-26',
        '2026-27',
        '1.0.0',
        '2025-04-01',
        'ACTIVE',
        2024,
        JSON.stringify({
          standardDeduction: 75000,
          rebateSection87ALimit: 700000,
          cessPercent: 4
        })
      );
      const ruleIdNew = Number(resNew.lastInsertRowid);

      const slabStmt = db.prepare(`
        INSERT INTO tax_slabs (rule_id, regime, min_income, max_income, rate_percent)
        VALUES (?, ?, ?, ?, ?)
      `);

      slabStmt.run(ruleIdNew, 'NEW', 0, 300000, 0);
      slabStmt.run(ruleIdNew, 'NEW', 300001, 700000, 5);
      slabStmt.run(ruleIdNew, 'NEW', 700001, 1000000, 10);
      slabStmt.run(ruleIdNew, 'NEW', 1000001, 1200000, 15);
      slabStmt.run(ruleIdNew, 'NEW', 1200001, 1500000, 20);
      slabStmt.run(ruleIdNew, 'NEW', 1500001, null, 30);

      // 2. Old Tax Regime Rule FY 2025-26
      const resOld = newRegimeStmt.run(
        'INCOME_TAX_SLABS',
        'IND_TAX_OLD_REGIME_FY2526',
        '2025-26',
        '2026-27',
        '1.0.0',
        '2025-04-01',
        'ACTIVE',
        2024,
        JSON.stringify({
          standardDeduction: 50000,
          rebateSection87ALimit: 500000,
          cessPercent: 4
        })
      );
      const ruleIdOld = Number(resOld.lastInsertRowid);

      slabStmt.run(ruleIdOld, 'OLD', 0, 250000, 0);
      slabStmt.run(ruleIdOld, 'OLD', 250001, 500000, 5);
      slabStmt.run(ruleIdOld, 'OLD', 500001, 1000000, 20);
      slabStmt.run(ruleIdOld, 'OLD', 1000001, null, 30);

      // 3. Deduction Rules Baseline
      const dedStmt = db.prepare(`
        INSERT INTO deduction_rules (section, max_limit, applicable_regime, description)
        VALUES (?, ?, ?, ?)
      `);

      dedStmt.run('80C', 150000, 'OLD', 'EPF, PPF, ELSS, Life Insurance Premiums, Principal Repayment on Housing Loan');
      dedStmt.run('80CCD1B', 50000, 'BOTH', 'National Pension System (NPS) Additional Deduction');
      dedStmt.run('80D', 25000, 'OLD', 'Medical Insurance Premiums for Self, Family');
      dedStmt.run('24B', 200000, 'OLD', 'Interest on Home Loan for Self-Occupied Property');

      // 4. Compliance Calendar Baseline
      const calStmt = db.prepare(`
        INSERT INTO tax_calendar (title, due_date, category, status)
        VALUES (?, ?, ?, ?)
      `);

      calStmt.run('Q1 Advance Tax Installment (15%)', '2025-06-15', 'ADVANCE_TAX', 'UPCOMING');
      calStmt.run('Q2 Advance Tax Installment (45%)', '2025-09-15', 'ADVANCE_TAX', 'UPCOMING');
      calStmt.run('Q3 Advance Tax Installment (75%)', '2025-12-15', 'ADVANCE_TAX', 'UPCOMING');
      calStmt.run('Q4 Advance Tax Installment (100%)', '2026-03-15', 'ADVANCE_TAX', 'UPCOMING');
      calStmt.run('ITR Filing Deadline (Non-Audit)', '2026-07-31', 'ITR', 'UPCOMING');
    })();

    console.log('Indian Tax Rules baseline successfully seeded.');
  }
}
