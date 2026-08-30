import { db } from '../../db';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { digitalTwinService } from '../../services/familyOffice/DigitalTwinService';
import { ActionRankingEngine } from '../../services/familyOffice/ActionRankingEngine';
import {
  ActionableCompletenessResponseSchema,
  NextBestAction
} from '../../contracts/familyOfficeContracts';

export async function runSprint9Tests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${msg}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${msg}`);
    }
  }

  console.log('\n==================================================');
  console.log(' RUNNING SPRINT 9.1 ONBOARDING & COMPLETENESS TESTS');
  console.log('==================================================\n');

  // Setup isolated test family (Family 999)
  const testFamilyId = 999;
  db.prepare('DELETE FROM transactions WHERE asset_id IN (SELECT id FROM assets WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?))').run(testFamilyId);
  db.prepare('DELETE FROM assets WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?)').run(testFamilyId);
  db.prepare('DELETE FROM accounts WHERE entity_id IN (SELECT id FROM entities WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?))').run(testFamilyId);
  db.prepare('DELETE FROM entities WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?)').run(testFamilyId);
  db.prepare('DELETE FROM insurance_policies WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM financial_goals WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM wills WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM tax_profiles WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM family_members WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM families WHERE id = ?').run(testFamilyId);
  db.prepare('INSERT INTO families (id, name, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run(testFamilyId, 'Sprint 9 Test Family');

  await CorrelationContext.runWithContext({
    correlationId: 'req_sprint9_test',
    familyId: testFamilyId,
    timestamp: new Date().toISOString()
  }, async () => {
    // ------------------------------------------------------------------------
    // TEST 1: Empty Family State (Baseline Detection)
    // ------------------------------------------------------------------------
    console.log('\n--- 1. Baseline Action Detection on Empty Family ---');
    const baseline = await digitalTwinService.getActionableCompleteness(testFamilyId);
    
    assert(baseline.status === 'INSUFFICIENT_DATA', 'Empty family reports status INSUFFICIENT_DATA');
    assert(baseline.rankedActions.length >= 5, `Empty family triggers all missing foundation actions (found ${baseline.rankedActions.length})`);
    
    const actionIds = baseline.rankedActions.map(a => a.actionId);
    assert(actionIds.includes('ACT_LIN_01'), 'ACT_LIN_01 detected when 0 members exist');
    assert(actionIds.includes('ACT_AST_01'), 'ACT_AST_01 detected when 0 assets exist');
    assert(actionIds.includes('ACT_INS_01'), 'ACT_INS_01 detected when 0 policies exist');
    assert(actionIds.includes('ACT_LIQ_01'), 'ACT_LIQ_01 detected when 0 bank cash exists');
    assert(actionIds.includes('ACT_TAX_01'), 'ACT_TAX_01 detected when 0 tax profiles exist');

    // ------------------------------------------------------------------------
    // TEST 2: Correction 1 – ACT_LIN_01 Primary Testator Anchor Requirement
    // ------------------------------------------------------------------------
    console.log('\n--- 2. ACT_LIN_01 Primary Testator Anchor Requirement (Correction 1) ---');
    // Add a member that is NOT primary testator (e.g. child)
    const nonHeadInsert = db.prepare(`
      INSERT INTO family_members (family_id, name, relationship, created_at, updated_at)
      VALUES (?, 'Minor Dependent', 'CHILD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(testFamilyId);
    const nonHeadMemberId = Number(nonHeadInsert.lastInsertRowid);

    const nonHeadCompleteness = await digitalTwinService.getActionableCompleteness(testFamilyId);
    assert(
      nonHeadCompleteness.rankedActions.some(a => a.actionId === 'ACT_LIN_01'),
      'ACT_LIN_01 remains ACTIVE when members exist but no primary testator/head anchor is declared (Correction 1)'
    );

    // Now update member to primary testator ('SELF')
    db.prepare("UPDATE family_members SET relationship = 'SELF' WHERE id = ?").run(nonHeadMemberId);
    const headCompleteness = await digitalTwinService.getActionableCompleteness(testFamilyId);
    assert(
      !headCompleteness.rankedActions.some(a => a.actionId === 'ACT_LIN_01'),
      'ACT_LIN_01 is RESOLVED when a valid primary testator/head is declared'
    );
    assert(headCompleteness.domainReadiness.lineage.isReady === true, 'Lineage domainReadiness becomes true');

    // ------------------------------------------------------------------------
    // TEST 3: ACT_AST_01 Known-Zero vs Unknown Record Count Detection
    // ------------------------------------------------------------------------
    console.log('\n--- 3. ACT_AST_01 Record Count Grounding ---');
    assert(headCompleteness.rankedActions.some(a => a.actionId === 'ACT_AST_01'), 'ACT_AST_01 active when 0 asset records exist');

    const assetInsert = db.prepare(`
      INSERT INTO assets (family_member_id, name, type, category, identifier, created_at, updated_at)
      VALUES (?, 'HDFC Balanced Advantage Fund', 'MUTUAL_FUND', 'Equity', 'INF179K01BE2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(nonHeadMemberId);
    const assetId = Number(assetInsert.lastInsertRowid);

    // Insert buy transaction so balance sheet aggregates
    db.prepare(`
      INSERT INTO transactions (asset_id, type, amount, quantity, price, date, source, created_at)
      VALUES (?, 'BUY', 500000, 1000, 500, '2025-01-01', 'MANUAL', CURRENT_TIMESTAMP)
    `).run(assetId);

    const withAssetCompleteness = await digitalTwinService.getActionableCompleteness(testFamilyId);
    assert(
      !withAssetCompleteness.rankedActions.some(a => a.actionId === 'ACT_AST_01'),
      'ACT_AST_01 is RESOLVED when asset records exist'
    );
    assert(withAssetCompleteness.domainReadiness.balanceSheet.isReady === true, 'BalanceSheet domainReadiness becomes true');

    // ------------------------------------------------------------------------
    // TEST 4: ACT_INS_01 Protection Consistency & Resolution
    // ------------------------------------------------------------------------
    console.log('\n--- 4. ACT_INS_01 Protection Floor ---');
    assert(withAssetCompleteness.rankedActions.some(a => a.actionId === 'ACT_INS_01'), 'ACT_INS_01 active when 0 policies exist');

    db.prepare(`
      INSERT INTO insurance_policies (family_id, policy_holder_id, insurer_name, policy_number, policy_type, sum_assured, premium_amount, premium_frequency, start_date, next_premium_due_date, status, created_at, updated_at)
      VALUES (?, ?, 'HDFC Life', 'POL-999-01', 'TERM_INSURANCE', 10000000, 15000, 'ANNUAL', '2025-01-01', '2026-01-01', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(testFamilyId, nonHeadMemberId);

    const withPolicyCompleteness = await digitalTwinService.getActionableCompleteness(testFamilyId);
    assert(
      !withPolicyCompleteness.rankedActions.some(a => a.actionId === 'ACT_INS_01'),
      'ACT_INS_01 is RESOLVED when active protection policy is recorded'
    );
    assert(withPolicyCompleteness.domainReadiness.protection.isReady === true, 'Protection domainReadiness becomes true');

    // ------------------------------------------------------------------------
    // TEST 5: ACT_LIQ_01 Bank Cash & Liquidity Reserves
    // ------------------------------------------------------------------------
    console.log('\n--- 5. ACT_LIQ_01 Liquid Reserves ---');
    assert(withPolicyCompleteness.rankedActions.some(a => a.actionId === 'ACT_LIQ_01'), 'ACT_LIQ_01 active when 0 bank cash exists');

    const bankInsert = db.prepare(`
      INSERT INTO assets (family_member_id, name, type, category, created_at, updated_at)
      VALUES (?, 'ICICI Salary Account', 'BANK_ACCOUNT', 'Cash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(nonHeadMemberId);
    const bankId = Number(bankInsert.lastInsertRowid);
    db.prepare(`
      INSERT INTO transactions (asset_id, type, amount, quantity, price, date, source, created_at)
      VALUES (?, 'BUY', 200000, 1, 200000, '2025-01-01', 'MANUAL', CURRENT_TIMESTAMP)
    `).run(bankId);

    const withLiquidCompleteness = await digitalTwinService.getActionableCompleteness(testFamilyId);
    assert(
      !withLiquidCompleteness.rankedActions.some(a => a.actionId === 'ACT_LIQ_01'),
      'ACT_LIQ_01 is RESOLVED when liquid bank account is recorded'
    );
    assert(withLiquidCompleteness.domainReadiness.liquidity.isReady === true, 'Liquidity domainReadiness becomes true');

    // ------------------------------------------------------------------------
    // TEST 6: ACT_TAX_01 Tax Profile Resolution
    // ------------------------------------------------------------------------
    console.log('\n--- 6. ACT_TAX_01 Tax Profile ---');
    assert(withLiquidCompleteness.rankedActions.some(a => a.actionId === 'ACT_TAX_01'), 'ACT_TAX_01 active when 0 tax profiles exist');

    db.prepare(`
      INSERT INTO tax_profiles (family_id, financial_year, assessment_year, residential_status, age_category, preferred_regime, aadhaar_linked, is_huf, created_at, updated_at)
      VALUES (?, '2025-26', '2026-27', 'RESIDENT', 'REGULAR', 'NEW', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(testFamilyId);

    const withTaxCompleteness = await digitalTwinService.getActionableCompleteness(testFamilyId);
    assert(
      !withTaxCompleteness.rankedActions.some(a => a.actionId === 'ACT_TAX_01'),
      'ACT_TAX_01 is RESOLVED when tax profile is recorded'
    );
    assert(withTaxCompleteness.domainReadiness.tax.isReady === true, 'Tax domainReadiness becomes true');

    // ------------------------------------------------------------------------
    // TEST 7: ACT_EST_01 & ACT_GOL_01 (Intelligence Enrichment Actions)
    // ------------------------------------------------------------------------
    console.log('\n--- 7. ACT_EST_01 and ACT_GOL_01 Enrichment Actions ---');
    assert(withTaxCompleteness.rankedActions.some(a => a.actionId === 'ACT_EST_01'), 'ACT_EST_01 active when 0 wills exist');
    assert(withTaxCompleteness.rankedActions.some(a => a.actionId === 'ACT_GOL_01'), 'ACT_GOL_01 active when 0 goals exist');

    db.prepare(`
      INSERT INTO wills (family_id, testator_id, title, executor_name, status, created_at)
      VALUES (?, ?, 'Primary Will', 'Test Executor', 'REGISTERED', CURRENT_TIMESTAMP)
    `).run(testFamilyId, nonHeadMemberId);

    db.prepare(`
      INSERT INTO financial_goals (family_id, title, goal_type, target_amount, target_year, status, created_at)
      VALUES (?, 'Retirement Corpus', 'RETIREMENT', 50000000, 2045, 'IN_PROGRESS', CURRENT_TIMESTAMP)
    `).run(testFamilyId);

    const fullyConfigured = await digitalTwinService.getActionableCompleteness(testFamilyId);
    assert(fullyConfigured.rankedActions.length === 0, 'All 7 actions resolved when family is fully configured');
    assert(fullyConfigured.status === 'COMPLETE' || fullyConfigured.status === 'PARTIAL', 'Fully configured family reaches high completeness status');

    // ------------------------------------------------------------------------
    // TEST 8: Pure 5-Tier Lexicographical Comparator Ranking Invariant
    // ------------------------------------------------------------------------
    console.log('\n--- 8. 5-Tier Deterministic Lexicographical Ranking ---');
    const mockActions: NextBestAction[] = [
      {
        actionId: 'ACT_GOL_01',
        title: 'Goals',
        description: '',
        category: 'INTELLIGENCE_ENRICHMENT',
        impactLevel: 'MEDIUM',
        whyItMatters: '',
        affectedCapabilities: ['GOALS'],
        targetRoute: '/goals',
        targetDomain: 'GOALS'
      },
      {
        actionId: 'ACT_LIN_01',
        title: 'Lineage',
        description: '',
        category: 'MISSING_FOUNDATION',
        impactLevel: 'HIGH',
        whyItMatters: '',
        affectedCapabilities: ['FAMILY_FINANCIAL_HEALTH', 'DIGITAL_TWIN', 'ESTATE_SUCCESSION'],
        targetRoute: '/family',
        targetDomain: 'LINEAGE'
      },
      {
        actionId: 'ACT_TAX_01',
        title: 'Tax',
        description: '',
        category: 'MISSING_FOUNDATION',
        impactLevel: 'MEDIUM',
        whyItMatters: '',
        affectedCapabilities: ['TAX'],
        targetRoute: '/tax',
        targetDomain: 'TAX'
      },
      {
        actionId: 'ACT_DAT_MOCK',
        title: 'Data Integrity Anomaly',
        description: '',
        category: 'DATA_INTEGRITY',
        impactLevel: 'HIGH',
        whyItMatters: '',
        affectedCapabilities: ['FINANCIAL_TIME_MACHINE'],
        targetRoute: '/portfolio',
        targetDomain: 'DATA_HYGIENE'
      }
    ];

    const ranked = ActionRankingEngine.rankActions(mockActions);
    assert(ranked[0].actionId === 'ACT_DAT_MOCK', 'Category A (DATA_INTEGRITY) ranks 1st over Category B and C');
    assert(ranked[1].actionId === 'ACT_LIN_01', 'Category B with HIGH impact & multi-pillar ranks 2nd');
    assert(ranked[2].actionId === 'ACT_TAX_01', 'Category B with MEDIUM impact ranks 3rd');
    assert(ranked[3].actionId === 'ACT_GOL_01', 'Category C (INTELLIGENCE_ENRICHMENT) ranks 4th');

    // ------------------------------------------------------------------------
    // TEST 9: Invariant 10.4 – No Static Numeric Score Promises in Schema
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Invariant 10.4 – No Static Point Gains ---');
    const validated = ActionableCompletenessResponseSchema.parse(baseline);
    assert(validated.rankedActions.every(a => (a as any).potentialScoreGain === undefined), 'Zod schema enforces zero potentialScoreGain numeric promises');
    assert(validated.rankedActions.every(a => ['HIGH', 'MEDIUM', 'LOW'].includes(a.impactLevel)), 'Every action specifies qualitative impactLevel');
  });

  // Cleanup test family
  db.prepare('DELETE FROM transactions WHERE asset_id IN (SELECT id FROM assets WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?))').run(testFamilyId);
  db.prepare('DELETE FROM assets WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?)').run(testFamilyId);
  db.prepare('DELETE FROM accounts WHERE entity_id IN (SELECT id FROM entities WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?))').run(testFamilyId);
  db.prepare('DELETE FROM entities WHERE family_member_id IN (SELECT id FROM family_members WHERE family_id = ?)').run(testFamilyId);
  db.prepare('DELETE FROM insurance_policies WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM financial_goals WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM wills WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM tax_profiles WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM family_members WHERE family_id = ?').run(testFamilyId);
  db.prepare('DELETE FROM families WHERE id = ?').run(testFamilyId);

  return { passed, failed };
}
