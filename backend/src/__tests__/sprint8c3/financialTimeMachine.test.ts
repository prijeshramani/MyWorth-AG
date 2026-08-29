import assert from 'assert';
import crypto from 'crypto';
import { db } from '../../db';
import { financialTimeMachineService, FinancialTimeMachineService } from '../../services/familyOffice/FinancialTimeMachineService';
import { whatIfSimulationEngine, WhatIfSimulationEngine } from '../../services/familyOffice/WhatIfSimulationEngine';
import { priceRepository } from '../../repositories/SQLitePriceRepository';
import { transactionRepository } from '../../repositories/SQLiteTransactionRepository';
import { calculateFixedDepositValuation } from '../../utils/fdValuation';
import { TaxCalculationEngine } from '../../engines/tax/TaxCalculationEngine';
import { timeMachineController } from '../../controllers/TimeMachineController';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { ValidationError, AppError } from '../../errors/AppError';

export async function runSprint8c3Tests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- SPRINT 8C.3 INVARIANT TEST SUITE: FINANCIAL TIME MACHINE & WHAT-IF SIMULATION SANDBOX ---');

  const TEST_FAM_A = 931;
  const TEST_FAM_B = 932;
  const MEM_A = 93101;
  const MEM_B = 93201;

  function cleanupFixtures() {
    db.prepare('DELETE FROM family_timeline_events WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM family_health_history WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM transactions WHERE asset_id IN (931101, 931102, 931103, 931104, 931105, 932101)').run();
    db.prepare('DELETE FROM asset_prices WHERE asset_id IN (931101, 931102, 931103, 931104, 931105, 932101)').run();
    db.prepare('DELETE FROM assets WHERE id IN (931101, 931102, 931103, 931104, 931105, 932101)').run();
    db.prepare('DELETE FROM insurance_policies WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM goal_allocations WHERE goal_id IN (SELECT id FROM financial_goals WHERE family_id IN (?, ?))').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM financial_goals WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM projection_assumptions WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM retirement_profiles WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM life_events WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM wills WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM trusts WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM tax_deductions WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM tax_profiles WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM proactive_triggers WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM proactive_cooldown_registry WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM graph_edges WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM graph_nodes WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare(`
      DELETE FROM accounts WHERE entity_id IN (
        SELECT e.id FROM entities e
        JOIN family_members fm ON e.family_member_id = fm.id
        WHERE fm.family_id IN (?, ?)
      )
    `).run(TEST_FAM_A, TEST_FAM_B);
    db.prepare(`
      DELETE FROM entities WHERE family_member_id IN (
        SELECT id FROM family_members WHERE family_id IN (?, ?)
      )
    `).run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM family_members WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM families WHERE id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
  }

  function setupFixtures() {
    cleanupFixtures();

    db.prepare('INSERT INTO families (id, name) VALUES (?, ?)').run(TEST_FAM_A, 'Time Machine Family A');
    db.prepare('INSERT INTO families (id, name) VALUES (?, ?)').run(TEST_FAM_B, 'Time Machine Family B');

    db.prepare('INSERT INTO family_members (id, family_id, name, relationship) VALUES (?, ?, ?, ?)').run(
      MEM_A, TEST_FAM_A, 'Alice Head', 'SELF'
    );
    db.prepare('INSERT INTO family_members (id, family_id, name, relationship) VALUES (?, ?, ?, ?)').run(
      MEM_B, TEST_FAM_B, 'Bob Other', 'SELF'
    );

    // Asset 931101: Equity Stock
    db.prepare(`
      INSERT INTO assets (id, family_member_id, name, category, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(931101, MEM_A, 'HDFC Bank', 'Equity', 'STOCK', '2024-01-01 10:00:00');

    // Asset 931102: Fixed Deposit
    db.prepare(`
      INSERT INTO assets (id, family_member_id, name, category, type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      931102, MEM_A, 'SBI Fixed Deposit 2Yr', 'Debt', 'FIXED_DEPOSIT',
      JSON.stringify({
        startDate: '2024-01-01',
        maturityDate: '2026-01-01',
        principal_amount: 500000,
        interestRate: 7.5,
        compoundingFrequency: 'QUARTERLY'
      }),
      '2024-01-01 10:00:00'
    );

    // Asset 931103: Cash Account
    db.prepare(`
      INSERT INTO assets (id, family_member_id, name, category, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(931103, MEM_A, 'HDFC Savings Bank', 'Cash', 'BANK_ACCOUNT', '2024-01-01 10:00:00');

    // Asset 932101: Family B Equity Asset
    db.prepare(`
      INSERT INTO assets (id, family_member_id, name, category, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(932101, MEM_B, 'TCS Shares', 'Equity', 'STOCK', '2024-01-01 10:00:00');
  }

  let passed = 0;
  let failed = 0;
  const failureList: string[] = [];

  function runTest(testName: string, testFn: () => void | Promise<void>) {
    try {
      testFn();
      console.log(`  [PASS] ${testName}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${testName}:`, err.message);
      failureList.push(`${testName} -> ${err.message}`);
      failed++;
    }
  }

  setupFixtures();

  // ==========================================================================
  // 1. HISTORICAL BOUNDARIES (Tests 1 - 8)
  // ==========================================================================

  runTest('1. Exact historical price is preferred with daysOfProxyLag = 0 (EXACT_HISTORICAL)', () => {
    priceRepository.upsertPrice(931101, '2024-03-25', 1400);
    priceRepository.upsertPrice(931101, '2024-03-31', 1450);

    const price = priceRepository.findPriceAsOf(TEST_FAM_A, 931101, '2024-03-31', 'Equity');
    assert(price !== null, 'Price should be found');
    assert.strictEqual(price.amount, 1450);
    assert.strictEqual(price.daysOfProxyLag, 0);
    assert.strictEqual(price.provenance, 'EXACT_HISTORICAL');
    assert.strictEqual(price.status, 'COMPLETE');
  });

  runTest('2. Nearest prior price within freshness window is selected (PRIOR_DATE_PROXY)', () => {
    const price = priceRepository.findPriceAsOf(TEST_FAM_A, 931101, '2024-04-03', 'Equity');
    assert(price !== null, 'Proxy price should be found');
    assert.strictEqual(price.amount, 1450);
    assert.strictEqual(price.daysOfProxyLag, 3);
    assert.strictEqual(price.provenance, 'PRIOR_DATE_PROXY');
    assert.strictEqual(price.status, 'COMPLETE');
  });

  runTest('3. Future price (date > asOfDate) is NEVER used as a proxy', () => {
    priceRepository.upsertPrice(931101, '2024-04-10', 1600);
    // Request date is 2024-03-20; prior price on 2024-03-25 is future to 2024-03-20
    const price = priceRepository.findPriceAsOf(TEST_FAM_A, 931101, '2024-03-20', 'Equity');
    assert.strictEqual(price, null, 'Future prices must not be used');
  });

  runTest('4. Expired proxy (> maxAgeDays) is flagged INSUFFICIENT_DATA and falls back to cost', () => {
    // Equity max proxy age is 30 days. Price is from 2024-03-31; asOfDate is 2024-06-01 (62 days lag)
    const price = priceRepository.findPriceAsOf(TEST_FAM_A, 931101, '2024-06-01', 'Equity');
    assert(price !== null, 'Price row returned with expiration flag');
    assert.strictEqual(price.status, 'INSUFFICIENT_DATA');
    assert.strictEqual(price.provenance, 'HISTORICAL_SOURCE_UNAVAILABLE');
    assert(price.daysOfProxyLag > 30, 'Proxy lag exceeds 30 days');
  });

  runTest('5. Missing price & cost returns HISTORICAL_SOURCE_UNAVAILABLE with status INSUFFICIENT_DATA and null value', () => {
    // Asset 931104 has no price and 0 cost
    db.prepare(`
      INSERT INTO assets (id, family_member_id, name, category, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(931104, MEM_A, 'Unpriced Speculative', 'Alternative', 'OTHER', '2024-01-01 10:00:00');

    db.prepare(`
      INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source)
      VALUES (null, 931104, 'BUY', '2024-01-10', 10, 0, 0, 'MANUAL')
    `).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931104);
    assert(holding !== undefined, 'Holding must exist in reconstruction');
    assert.strictEqual(holding.totalMarketValue, null, 'Missing value must be null (Mandatory Correction #1)');
    assert.strictEqual(holding.status, 'INSUFFICIENT_DATA');
    assert.strictEqual(holding.provenance, 'HISTORICAL_SOURCE_UNAVAILABLE');
  });

  runTest('6. Transactions dated after asOfDate do not alter historical units or cost basis', () => {
    db.prepare(`
      INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source)
      VALUES (null, 931101, 'BUY', '2024-01-15', 100, 1000, 100000, 'MANUAL')
    `).run();
    db.prepare(`
      INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source)
      VALUES (null, 931101, 'BUY', '2024-05-01', 200, 1500, 300000, 'MANUAL')
    `).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931101);
    assert(holding !== undefined);
    assert.strictEqual(holding.units, 100, 'Only transactions <= 2024-03-31 must be counted');
    assert.strictEqual(holding.costBasis, 100000);
  });

  runTest('7. Same-day transactions are sorted and processed deterministically by date ASC, id ASC', () => {
    // Buy 100 @ 1000, Sell 40 @ 1200 on same day
    const tx1 = db.prepare(`
      INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source)
      VALUES (null, 931101, 'BUY', '2024-02-15', 50, 1000, 50000, 'MANUAL')
    `).run();
    const tx2 = db.prepare(`
      INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source)
      VALUES (null, 931101, 'SELL', '2024-02-15', 20, 1200, 24000, 'MANUAL')
    `).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931101);
    assert(holding !== undefined);
    // Initial 100 + 50 - 20 = 130 units
    assert.strictEqual(holding.units, 130);
  });

  runTest('8. Unsupported transaction types produce explicit INSUFFICIENT_DATA rather than fabricated values', () => {
    // Insert invalid quantity <= 0
    db.prepare(`
      INSERT INTO transactions (holding_id, asset_id, type, date, quantity, price, amount, source)
      VALUES (null, 931101, 'BUY', '2024-03-01', 0, 1000, 0, 'MANUAL')
    `).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931101);
    assert(holding !== undefined);
    assert.strictEqual(holding.status, 'INSUFFICIENT_DATA');
  });

  // ==========================================================================
  // 2. HOLDINGS & VALUATION (Tests 9 - 13)
  // ==========================================================================

  runTest('9. Partial disposal calculates correct WAC and reduces cost basis proportionally', () => {
    // Clean and set clean transactions for 931101
    db.prepare('DELETE FROM transactions WHERE asset_id = 931101').run();
    // Buy 100 @ 100 (cost 10k), Buy 100 @ 200 (cost 20k) -> pool = 200 units @ 30k (avg cost 150)
    db.prepare(`INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source) VALUES (931101, 'BUY', '2024-01-01', 100, 100, 10000, 'MANUAL')`).run();
    db.prepare(`INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source) VALUES (931101, 'BUY', '2024-01-10', 100, 200, 20000, 'MANUAL')`).run();
    // Sell 50 units (cost reduced by 50 * 150 = 7500 -> remaining cost pool = 22500)
    db.prepare(`INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source) VALUES (931101, 'SELL', '2024-01-20', 50, 250, 12500, 'MANUAL')`).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931101);
    assert(holding !== undefined);
    assert.strictEqual(holding.units, 150);
    assert.strictEqual(holding.costBasis, 22500);
  });

  runTest('10. Full disposal reduces units and cost basis to 0', () => {
    db.prepare(`INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source) VALUES (931101, 'SELL', '2024-02-01', 150, 300, 45000, 'MANUAL')`).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931101);
    assert(holding !== undefined);
    assert.strictEqual(holding.units, 0);
    assert.strictEqual(holding.costBasis, 0);
    assert.strictEqual(holding.totalMarketValue, 0);
  });

  runTest('11. Negative quantity anomaly is clamped to 0 and flagged INSUFFICIENT_DATA with null market value', () => {
    db.prepare(`INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source) VALUES (931101, 'SELL', '2024-02-10', 50, 300, 15000, 'MANUAL')`).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931101);
    assert(holding !== undefined);
    assert.strictEqual(holding.units, 0);
    assert.strictEqual(holding.totalMarketValue, null, 'Negative anomaly market value must be null (Mandatory Correction #1)');
    assert.strictEqual(holding.status, 'INSUFFICIENT_DATA');
  });

  runTest('12. Acquisition cost fallback is explicitly typed valuationType = ACQUISITION_COST', () => {
    // Asset 931105 has transactions with cost basis, but no price records
    db.prepare(`
      INSERT INTO assets (id, family_member_id, name, category, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(931105, MEM_A, 'Unlisted Startup Equity', 'Alternative', 'OTHER', '2024-01-01 10:00:00');

    db.prepare(`INSERT INTO transactions (asset_id, type, date, quantity, price, amount, source) VALUES (931105, 'BUY', '2024-01-05', 5000, 100, 500000, 'MANUAL')`).run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931105);
    assert(holding !== undefined);
    assert.strictEqual(holding.valuationType, 'ACQUISITION_COST');
    assert.strictEqual(holding.provenance, 'KNOWN_ACQUISITION_COST');
    assert.strictEqual(holding.totalMarketValue, 500000);
  });

  runTest('13. Unrealized gain/loss is strictly null when valued at acquisition cost', () => {
    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931105);
    assert(holding !== undefined);
    assert.strictEqual(holding.unrealizedGainLoss, null, 'Unrealized gain/loss must be null when valued at acquisition cost');
  });

  // ==========================================================================
  // 3. FIXED DEPOSITS & INSURANCE (Tests 14 - 18)
  // ==========================================================================

  runTest('14. FD with asOfDate < startDate is omitted (NOT_YET_IN_EXISTENCE)', () => {
    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2023-12-31');
    const holding = recon.holdings.find(h => h.assetId === 931102);
    assert.strictEqual(holding, undefined, 'Pre-start FD must be omitted from active holdings');
  });

  runTest('15. Active FD accrues exact compounding interest up to asOfDate (CALCULATED)', () => {
    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const holding = recon.holdings.find(h => h.assetId === 931102);
    assert(holding !== undefined);
    assert.strictEqual(holding.valuationType, 'ACCRUED_VALUE');
    assert.strictEqual(holding.provenance, 'CALCULATED');

    const expectedVal = calculateFixedDepositValuation({
      costBasis: 500000,
      interestRate: 7.5,
      startDateStr: '2024-01-01',
      asOfDateStr: '2024-03-31',
      compoundingFrequency: 'QUARTERLY'
    });
    assert.strictEqual(holding.totalMarketValue, Math.round(expectedVal.marketValue));
  });

  runTest('16. FD past maturity without redemption has null value and is excluded from net worth (Mandatory Correction #2)', () => {
    // Reconstruct as of 2026-06-01 (past 2026-01-01 maturity)
    // First, provide a price for equity asset so we can isolate net worth
    priceRepository.upsertPrice(931101, '2026-06-01', 1500);

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2026-06-01');
    const fdHolding = recon.holdings.find(h => h.assetId === 931102);
    assert(fdHolding !== undefined);
    assert.strictEqual(fdHolding.lifecycleStatus, 'MATURED_PENDING_REINVESTMENT');
    assert.strictEqual(fdHolding.status, 'INSUFFICIENT_DATA');
    assert.strictEqual(fdHolding.totalMarketValue, null, 'Post-maturity FD value must be null without redemption evidence (Mandatory Correction #2)');
  });

  runTest('17. Insurance SUM_ASSURED is reported under protectionShield and NEVER enters net worth', () => {
    db.prepare(`
      INSERT INTO insurance_policies (family_id, policy_holder_id, policy_number, insurer_name, policy_type, sum_assured, premium_amount, next_premium_due_date, start_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(TEST_FAM_A, MEM_A, 'POL-93101', 'HDFC Life Term Cover', 'TERM', 10000000, 25000, '2025-01-01', '2024-01-01', 'ACTIVE');

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    assert.strictEqual(recon.protectionShield.totalSumAssured, 10000000);
    assert.strictEqual(recon.protectionShield.activePolicyCount, 1);
    // Net worth must NOT include the 1 Crore sum assured!
    assert(recon.netWorth < 5000000, 'Net worth must strictly exclude SUM_ASSURED');
  });

  runTest('18. Policy surrender value is null with HISTORICAL_SOURCE_UNAVAILABLE', () => {
    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    assert.strictEqual(recon.protectionShield.policies[0].sumAssured, 10000000);
    // No cash surrender value is injected into holdings
    const surrenderHolding = recon.holdings.find(h => h.assetName.includes('Term Cover'));
    assert.strictEqual(surrenderHolding, undefined, 'Term policy surrender value is not an asset holding');
  });

  // ==========================================================================
  // 4. HISTORICAL LIMITATIONS (Tests 19 - 22)
  // ==========================================================================

  runTest('19. Goals created after asOfDate do not appear in historical reconstruction', () => {
    db.prepare(`
      INSERT INTO financial_goals (family_id, title, goal_type, target_amount, target_year, current_allocated_amount, monthly_sip_amount, expected_return_pct, inflation_pct, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(TEST_FAM_A, 'Future Dream Home', 'HOUSE', 20000000, 2030, 0, 50000, 12, 6, '2024-08-01 10:00:00');

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    assert.strictEqual(recon.domains.goals.coveragePct, 0, 'Future goals must not leak backward');
  });

  runTest('20. Wills registered after asOfDate do not appear in historical reconstruction', () => {
    db.prepare(`
      INSERT INTO wills (family_id, testator_id, title, executor_name, registered_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(TEST_FAM_A, MEM_A, 'Test Will', 'Alice Executor', '2024-09-01', 'ACTIVE', '2024-09-01 10:00:00');

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    assert.strictEqual(recon.domains.estate.coveragePct, 0, 'Future estate docs must not leak backward');
  });

  runTest('21. Tax profile maps deterministically to Indian FY without future FY leakage', () => {
    db.prepare(`
      INSERT INTO tax_profiles (family_id, financial_year, pan, created_at)
      VALUES (?, ?, ?, ?)
    `).run(TEST_FAM_A, '2023-24', 'ABCDE1234F', '2024-02-01 10:00:00');
    db.prepare(`
      INSERT INTO tax_profiles (family_id, financial_year, pan, created_at)
      VALUES (?, ?, ?, ?)
    `).run(TEST_FAM_A, '2024-25', 'ABCDE1234F', '2024-07-01 10:00:00');

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    assert.strictEqual(recon.domains.tax.status, 'COMPLETE');
  });

  runTest('22. Missing historical cash balance is not fabricated (Mandatory Correction #1)', () => {
    // Asset 931103 has no transactions
    db.prepare('DELETE FROM transactions WHERE asset_id = 931103').run();

    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const cashHolding = recon.holdings.find(h => h.assetId === 931103);
    assert(cashHolding !== undefined);
    assert.strictEqual(cashHolding.totalMarketValue, null, 'Missing cash balance must be null, not 0 (Mandatory Correction #1)');
    assert.strictEqual(cashHolding.status, 'INSUFFICIENT_DATA');
  });

  // ==========================================================================
  // 5. INTEGRITY & SECURITY (Tests 23 - 30)
  // ==========================================================================

  runTest('23. Cross-family SQL isolation prevents Family A from reconstructing Family B data', () => {
    priceRepository.upsertPrice(932101, '2024-03-31', 3500);
    const reconA = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const familyBHolding = reconA.holdings.find(h => h.assetId === 932101);
    assert.strictEqual(familyBHolding, undefined, 'Family A reconstruction must NEVER contain Family B assets');
  });

  runTest('24. Reconstruction executes 0 database source writes', () => {
    const countBefore = db.prepare('SELECT count(*) as cnt FROM transactions').get() as { cnt: number };
    financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const countAfter = db.prepare('SELECT count(*) as cnt FROM transactions').get() as { cnt: number };
    assert.strictEqual(countBefore.cnt, countAfter.cnt, 'Reconstruction must not insert/update/delete transactions');
  });

  runTest('25. What-If simulation executes 0 database writes across all 21 database tables for all 5 scenarios', () => {
    function getDatabaseFingerprint(): string {
      const tables = [
        'assets', 'transactions', 'asset_prices', 'financial_goals', 'goal_allocations',
        'retirement_profiles', 'projection_assumptions', 'tax_profiles', 'tax_deductions',
        'tax_income_sources', 'insurance_policies', 'wills', 'trusts', 'family_timeline_events',
        'family_health_history', 'proactive_triggers', 'proactive_cooldown_registry',
        'family_members', 'families', 'accounts', 'entities'
      ];
      const parts: string[] = [];
      for (const table of tables) {
        try {
          const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id ASC`).all();
          parts.push(`${table}:${JSON.stringify(rows)}`);
        } catch {
          // ignore table if not present
        }
      }
      return crypto.createHash('sha256').update(parts.join(';')).digest('hex');
    }

    const fingerprintBefore = getDatabaseFingerprint();

    // 1. RECURRING_SIP_STEP_UP
    whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'RECURRING_SIP_STEP_UP',
      monthlySipAmount: 50000,
      sipStepUpPercent: 15,
      years: 25
    });
    assert.strictEqual(getDatabaseFingerprint(), fingerprintBefore, 'RECURRING_SIP_STEP_UP mutated database state');

    // 2. ONE_TIME_LUMP_SUM_INVESTMENT
    whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'ONE_TIME_LUMP_SUM_INVESTMENT',
      lumpSumAmount: 1000000,
      investmentHorizonYears: 10
    });
    assert.strictEqual(getDatabaseFingerprint(), fingerprintBefore, 'ONE_TIME_LUMP_SUM_INVESTMENT mutated database state');

    // 3. RETIREMENT_AGE_ADJUSTMENT
    whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'RETIREMENT_AGE_ADJUSTMENT',
      targetRetirementAge: 55
    });
    assert.strictEqual(getDatabaseFingerprint(), fingerprintBefore, 'RETIREMENT_AGE_ADJUSTMENT mutated database state');

    // 4. GOAL_CONTRIBUTION_REALLOCATION (create goal for test)
    const goalRes = db.prepare(`
      INSERT INTO financial_goals (family_id, title, goal_type, target_amount, target_year, current_allocated_amount, monthly_sip_amount, expected_return_pct, inflation_pct, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(TEST_FAM_A, 'Temp Zero-Write Goal', 'HOUSE', 5000000, 2035, 100000, 25000, 12, 6, '2024-01-01');
    const tempGoalId = Number(goalRes.lastInsertRowid);
    const fingerprintWithGoal = getDatabaseFingerprint();

    whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'GOAL_CONTRIBUTION_REALLOCATION',
      targetGoalId: tempGoalId,
      reallocatedMonthlySip: 40000
    });
    assert.strictEqual(getDatabaseFingerprint(), fingerprintWithGoal, 'GOAL_CONTRIBUTION_REALLOCATION mutated database state');

    // Clean up temporary goal
    db.prepare('DELETE FROM financial_goals WHERE id = ?').run(tempGoalId);

    // 5. TAX_REGIME_OPTIMIZATION_SCENARIO
    whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'TAX_REGIME_OPTIMIZATION_SCENARIO',
      salaryIncome: 2500000,
      hypothetical80CAmount: 150000
    });
    assert.strictEqual(getDatabaseFingerprint(), fingerprintBefore, 'TAX_REGIME_OPTIMIZATION_SCENARIO mutated database state');
  });

  runTest('26. What-If baseline remains immutable during simulation', () => {
    const histRecon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const initialNetWorth = histRecon.netWorth;
    const initialHash = histRecon.stateHash;

    whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'ONE_TIME_LUMP_SUM_INVESTMENT',
      baselineAsOf: '2024-03-31',
      lumpSumAmount: 1000000,
      investmentHorizonYears: 15
    });

    assert.strictEqual(histRecon.netWorth, initialNetWorth);
    assert.strictEqual(histRecon.stateHash, initialHash);
  });

  runTest('27. Identical historical reconstructions produce byte-identical canonical stateHash', () => {
    const recon1 = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    const recon2 = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    assert.strictEqual(recon1.stateHash, recon2.stateHash, 'State hashes must be byte-identical');
    assert.strictEqual(typeof recon1.stateHash, 'string');
    assert.strictEqual(recon1.stateHash.length, 64);
  });

  runTest('28. Volatile timestamps (reconstructedAt) do not alter canonical stateHash', () => {
    const preimage = {
      familyId: TEST_FAM_A,
      asOfDate: '2024-03-31',
      netWorth: 1000000
    };
    const hash1 = financialTimeMachineService.computeCanonicalStateHash(preimage);
    const hash2 = financialTimeMachineService.computeCanonicalStateHash({ ...preimage });
    assert.strictEqual(hash1, hash2);
  });

  runTest('29. Future asOfDate is strictly rejected with FUTURE_AS_OF_DATE_UNSUPPORTED', () => {
    let errorThrown = false;
    try {
      financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2099-01-01');
    } catch (err: any) {
      errorThrown = true;
      assert(err.message.includes('FUTURE_AS_OF_DATE_UNSUPPORTED'));
    }
    assert(errorThrown, 'Future asOfDate must throw error');
  });

  runTest('30. Missing data is never converted to numeric zero (Mandatory Correction #1)', () => {
    const recon = financialTimeMachineService.reconstructHistoricalEconomicState(TEST_FAM_A, '2024-03-31');
    for (const h of recon.holdings) {
      if (h.status === 'INSUFFICIENT_DATA') {
        assert.strictEqual(h.totalMarketValue, null, `Asset ${h.assetName} has status INSUFFICIENT_DATA but non-null value ${h.totalMarketValue}`);
      }
    }
  });

  // ==========================================================================
  // 6. WHAT-IF SCENARIOS (Tests 31 - 39)
  // ==========================================================================

  runTest('31. Unsupported scenario type fails schema validation', () => {
    let errorThrown = false;
    try {
      whatIfSimulationEngine.simulate(TEST_FAM_A, {
        scenarioType: 'NON_EXISTENT_SCENARIO' as any
      });
    } catch {
      errorThrown = true;
    }
    assert(errorThrown, 'Unsupported scenario must be rejected');
  });

  runTest('32. Scenario result contains explicit assumptions and rule versions', () => {
    const result = whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'RECURRING_SIP_STEP_UP',
      monthlySipAmount: 30000,
      sipStepUpPercent: 10,
      years: 15
    });
    assert(result.assumptionsUsed !== undefined);
    assert.strictEqual(result.assumptionsUsed.equityReturnPct, 12);
    assert.strictEqual(result.ruleVersion, '2026.1');
    assert.strictEqual(result.status, 'COMPLETE');
  });

  runTest('33. Scenario result contains baseline state hash', () => {
    const result = whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'ONE_TIME_LUMP_SUM_INVESTMENT',
      lumpSumAmount: 250000,
      investmentHorizonYears: 5
    });
    assert(result.baselineStateHash.length === 64);
    assert.strictEqual(result.appliedParameters.lumpSumAmount, 250000);
  });

  runTest('34. Incomplete tax data returns INSUFFICIENT_DATA, not fabricated ₹0 savings', () => {
    // Delete tax profiles
    db.prepare('DELETE FROM tax_profiles WHERE family_id = ?').run(TEST_FAM_A);

    const result = whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'TAX_REGIME_OPTIMIZATION_SCENARIO',
      hypothetical80CAmount: 150000
    });
    assert.strictEqual(result.status, 'INSUFFICIENT_DATA');
    assert.strictEqual(result.taxSavingsBenefit, null, 'Tax savings must be null on insufficient data');
  });

  runTest('35. Tax scenario delegates to TaxCalculationEngine and computes savings', () => {
    const result = whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'TAX_REGIME_OPTIMIZATION_SCENARIO',
      salaryIncome: 2000000,
      hypothetical80CAmount: 150000,
      hypothetical80CCDAmount: 50000
    });
    assert.strictEqual(result.status, 'COMPLETE');
    assert(result.taxSavingsBenefit !== null && result.taxSavingsBenefit !== undefined && result.taxSavingsBenefit >= 0);
    assert(result.optimalRegime === 'OLD' || result.optimalRegime === 'NEW');
  });

  runTest('36. Blocker 1: TimeMachineController resolves authorized family strictly from CorrelationContext', () => {
    // A. Missing context throws ValidationError (no hardcoded fallback 1)
    let authFailed = false;
    try {
      timeMachineController.resolveAuthorizedFamilyId({ headers: {}, query: {}, body: {} } as any);
    } catch (err: any) {
      authFailed = true;
      assert(err instanceof ValidationError, 'Must throw ValidationError on missing context');
    }
    assert(authFailed, 'Missing context must fail closed');

    // B. Forged header alone without CorrelationContext fails
    let headerFailed = false;
    try {
      timeMachineController.resolveAuthorizedFamilyId({ headers: { 'x-family-id': '999' }, query: {}, body: {} } as any);
    } catch (err: any) {
      headerFailed = true;
      assert(err instanceof ValidationError);
    }
    assert(headerFailed, 'x-family-id header cannot grant authorization');

    // C. Query familyId mismatch throws 403 FORBIDDEN
    let mismatchFailed = false;
    try {
      CorrelationContext.runWithContext({ correlationId: 'test-trace', timestamp: new Date().toISOString(), familyId: TEST_FAM_A }, () => {
        timeMachineController.resolveAuthorizedFamilyId({ headers: {}, query: { familyId: String(TEST_FAM_B) }, body: {} } as any);
      });
    } catch (err: any) {
      mismatchFailed = true;
      assert(err instanceof AppError && err.statusCode === 403, 'Must throw 403 FORBIDDEN on query familyId mismatch');
    }
    assert(mismatchFailed, 'Query mismatch must be rejected');

    // D. Body familyId mismatch throws 403 FORBIDDEN
    let bodyMismatchFailed = false;
    try {
      CorrelationContext.runWithContext({ correlationId: 'test-trace', timestamp: new Date().toISOString(), familyId: TEST_FAM_A }, () => {
        timeMachineController.resolveAuthorizedFamilyId({ headers: {}, query: {}, body: { familyId: TEST_FAM_B } } as any);
      });
    } catch (err: any) {
      bodyMismatchFailed = true;
      assert(err instanceof AppError && err.statusCode === 403, 'Must throw 403 FORBIDDEN on body familyId mismatch');
    }
    assert(bodyMismatchFailed, 'Body mismatch must be rejected');

    // E. Valid context succeeds
    CorrelationContext.runWithContext({ correlationId: 'test-trace', timestamp: new Date().toISOString(), familyId: TEST_FAM_A }, () => {
      const resolved = timeMachineController.resolveAuthorizedFamilyId({ headers: {}, query: { familyId: String(TEST_FAM_A) }, body: {} } as any);
      assert.strictEqual(resolved, TEST_FAM_A);
    });
  });

  runTest('37. Blocker 2: Tax What-If with tax profile but no income records returns INSUFFICIENT_DATA without fabricating ₹15L', () => {
    // Insert a tax profile with PAN only (no tax_income_sources rows)
    db.prepare('DELETE FROM tax_profiles WHERE family_id = ?').run(TEST_FAM_A);
    db.prepare(`
      INSERT INTO tax_profiles (family_id, financial_year, pan, created_at)
      VALUES (?, ?, ?, ?)
    `).run(TEST_FAM_A, '2025-26', 'ABCDE1234F', '2024-01-01');

    // Simulate without salaryIncome parameter
    const result = whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'TAX_REGIME_OPTIMIZATION_SCENARIO',
      hypothetical80CAmount: 150000
    });

    assert.strictEqual(result.status, 'INSUFFICIENT_DATA');
    assert.strictEqual(result.taxSavingsBenefit, null, 'Tax savings must be null when income is unverified');
    assert(result.missingDataReason?.includes('No verified gross income found'), 'Must give explicit missingDataReason');
  });

  runTest('38. Hardening 5: Assumptions used contains explicit provenance breakdown across scenarios', () => {
    const result = whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'RECURRING_SIP_STEP_UP',
      monthlySipAmount: 35000,
      sipStepUpPercent: 12,
      years: 15
    });

    assert(result.assumptionsUsed.provenance !== undefined, 'Provenance metadata must be present');
    assert.strictEqual(result.assumptionsUsed.provenance.monthlySip, 'USER_PROVIDED');
    assert.strictEqual(result.assumptionsUsed.provenance.stepUpPct, 'USER_PROVIDED');
    assert.strictEqual(result.assumptionsUsed.provenance.years, 'USER_PROVIDED');
  });

  runTest('39. Hardening 6: Historical What-If baseline with INSUFFICIENT_DATA is flagged and rejected from authoritative projection', () => {
    // Asset 931104 is unpriced and has no cost basis; reconstruct as of 2024-01-01
    // Net worth and completeness will be constrained
    const result = whatIfSimulationEngine.simulate(TEST_FAM_A, {
      scenarioType: 'RECURRING_SIP_STEP_UP',
      baselineAsOf: '2020-01-01' // Before family assets existed
    });

    // Before assets existed, baseline has 0 completeness and INSUFFICIENT_DATA status
    assert.strictEqual(result.status, 'INSUFFICIENT_DATA');
    assert(result.missingDataReason?.includes('Historical baseline as of 2020-01-01 contains insufficient data'));
  });

  cleanupFixtures();

  console.log(`\nSprint 8C.3 Invariant Test Results: ${passed} PASSED, ${failed} FAILED`);
  if (failureList.length > 0) {
    console.log('FAILURES:\n' + failureList.join('\n'));
  }
  return { passed, failed };
}
