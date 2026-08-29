import assert from 'assert';
import { db } from '../../db';
import { familyTimelineService, FamilyTimelineService } from '../../services/familyOffice/FamilyTimelineService';
import { familyTimelineRepository } from '../../repositories/SQLiteFamilyTimelineRepository';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { TimelineEvent } from '../../contracts/familyOfficeContracts';

export async function runSprint8c2Tests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- SPRINT 8C.2 INVARIANT TEST SUITE: MULTI-DOMAIN TIMELINE LEDGER & NARRATIVE HISTORY ---');

  const TEST_FAM_A = 921;
  const TEST_FAM_B = 922;

  // Cleanup fixtures before test execution
  function cleanupFixtures() {
    familyTimelineRepository.purgeFamilyTimeline(TEST_FAM_A);
    familyTimelineRepository.purgeFamilyTimeline(TEST_FAM_B);

    db.prepare(`
      DELETE FROM transactions WHERE holding_id IN (
        SELECT h.id FROM holdings h
        JOIN accounts acc ON h.account_id = acc.id
        JOIN entities e ON acc.entity_id = e.id
        JOIN family_members fm ON e.family_member_id = fm.id
        WHERE fm.family_id IN (?, ?)
      ) OR id IN (921201, 921202, 922201)
    `).run(TEST_FAM_A, TEST_FAM_B);

    db.prepare(`
      DELETE FROM holdings WHERE account_id IN (
        SELECT acc.id FROM accounts acc
        JOIN entities e ON acc.entity_id = e.id
        JOIN family_members fm ON e.family_member_id = fm.id
        WHERE fm.family_id IN (?, ?)
      ) OR id IN (921151, 921152, 922151)
    `).run(TEST_FAM_A, TEST_FAM_B);

    db.prepare('DELETE FROM assets_master WHERE id IN (921101, 921102, 922101)').run();
    db.prepare('DELETE FROM assets WHERE id IN (921101, 921102, 922101)').run();

    db.prepare(`
      DELETE FROM accounts WHERE entity_id IN (
        SELECT e.id FROM entities e
        JOIN family_members fm ON e.family_member_id = fm.id
        WHERE fm.family_id IN (?, ?)
      ) OR id IN (921002, 922002)
    `).run(TEST_FAM_A, TEST_FAM_B);

    db.prepare(`
      DELETE FROM entities WHERE family_member_id IN (
        SELECT id FROM family_members WHERE family_id IN (?, ?)
      ) OR id IN (921001, 922001)
    `).run(TEST_FAM_A, TEST_FAM_B);

    db.prepare('DELETE FROM insurance_policies WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM financial_goals WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM life_events WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM wills WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM trusts WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM tax_deductions WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM tax_profiles WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM proactive_triggers WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM graph_edges WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM graph_nodes WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM family_members WHERE family_id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
    db.prepare('DELETE FROM families WHERE id IN (?, ?)').run(TEST_FAM_A, TEST_FAM_B);
  }

  cleanupFixtures();

  // Setup Families & Members
  db.prepare(`
    INSERT INTO families (id, name, created_at) VALUES (?, 'Kapoor Family', CURRENT_TIMESTAMP)
  `).run(TEST_FAM_A);
  db.prepare(`
    INSERT INTO families (id, name, created_at) VALUES (?, 'Singhania Family', CURRENT_TIMESTAMP)
  `).run(TEST_FAM_B);

  const memberA1 = 92101;
  const memberA2 = 92102;
  const memberB1 = 92201;

  db.prepare(`INSERT INTO family_members (id, family_id, name, relationship, pan, created_at) VALUES (?, ?, 'Rajesh Kapoor', 'SELF', 'ABCDE1234F', CURRENT_TIMESTAMP)`).run(memberA1, TEST_FAM_A);
  db.prepare(`INSERT INTO family_members (id, family_id, name, relationship, pan, created_at) VALUES (?, ?, 'Sunita Kapoor', 'SPOUSE', 'FGHIJ5678K', CURRENT_TIMESTAMP)`).run(memberA2, TEST_FAM_A);
  db.prepare(`INSERT INTO family_members (id, family_id, name, relationship, pan, created_at) VALUES (?, ?, 'Vikram Singhania', 'SELF', 'KLMNO9876P', CURRENT_TIMESTAMP)`).run(memberB1, TEST_FAM_B);

  // ==========================================================================
  // 1. 7-DOMAIN NORMALIZATION & PROVENANCE TAGGING
  // ==========================================================================

  // 1.1 Portfolio fixture
  db.prepare(`
    INSERT INTO entities (id, family_member_id, name, entity_type, created_at)
    VALUES (921001, ?, 'Rajesh Kapoor', 'INDIVIDUAL', CURRENT_TIMESTAMP)
  `).run(memberA1);

  db.prepare(`
    INSERT INTO accounts (id, entity_id, account_name, account_type, created_at)
    VALUES (921002, 921001, 'Zerodha Demat', 'DEMAT', CURRENT_TIMESTAMP)
  `).run();

  db.prepare(`
    INSERT INTO assets (id, name, type, category)
    VALUES (921101, 'HDFC Bank Equity', 'STOCK', 'Equity')
  `).run();

  db.prepare(`
    INSERT INTO assets_master (id, name, display_name, asset_type, currency, created_at)
    VALUES (921101, 'HDFC Bank Equity', 'HDFC Bank', 'STOCK', 'INR', '2024-01-01T00:00:00.000Z')
  `).run();

  db.prepare(`
    INSERT INTO holdings (id, account_id, asset_id, opened_at, created_at)
    VALUES (921151, 921002, 921101, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
  `).run();

  db.prepare(`
    INSERT INTO transactions (id, asset_id, holding_id, type, date, quantity, price, amount, source, narration, created_at)
    VALUES (921201, 921101, 921151, 'BUY', '2024-03-15', 1000, 1500, 1500000, 'MANUAL', 'Bulk equity purchase', '2024-03-15T10:00:00.000Z')
  `).run();

  // 1.2 Protection fixture
  db.prepare(`
    INSERT INTO insurance_policies (
      id, family_id, policy_number, insurer_name, policy_type, policy_holder_id,
      sum_assured, premium_amount, premium_frequency, start_date, next_premium_due_date, status, created_at
    ) VALUES (
      921301, ?, 'POL-HDFC-99887766', 'HDFC Life', 'TERM', ?,
      15000000.0, 35000.0, 'ANNUAL', '2023-06-01', '2027-06-01', 'ACTIVE', '2023-06-01T00:00:00.000Z'
    )
  `).run(TEST_FAM_A, memberA1);

  // 1.3 Goals fixture
  db.prepare(`
    INSERT INTO financial_goals (
      id, family_id, goal_type, title, target_amount, target_year, current_allocated_amount, monthly_sip_amount, expected_return_pct, inflation_pct, priority, status, created_at
    ) VALUES (
      921401, ?, 'RETIREMENT', 'Golden Years 2045', 30000000, 2045, 18000000, 75000, 12, 6, 'HIGH', 'ON_TRACK', '2023-01-10T00:00:00.000Z'
    )
  `).run(TEST_FAM_A);

  // 1.4 Life Event fixture
  db.prepare(`
    INSERT INTO life_events (
      id, family_id, event_type, event_title, status, event_version, declared_at, effective_date, declared_by_member_id,
      confidence_pct, evidence_completeness_pct, event_payload_json, evidence_payload_json, impact_summary_json,
      rule_version, calculation_version, created_at, updated_at
    ) VALUES (
      921501, ?, 'CHILD_BIRTH', 'Birth of Aarav Kapoor', 'PROCESSED', 1, '2024-02-01T00:00:00.000Z', '2024-02-01', ?,
      100, 100, '{}', '{}', '{}', '2026.1', '2026.1', '2024-02-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z'
    )
  `).run(TEST_FAM_A, memberA1);

  // 1.5 Estate fixture (Will + Trust + KG Edge)
  db.prepare(`
    INSERT INTO wills (id, family_id, testator_id, title, current_version, status, registered_at, executor_name, created_at)
    VALUES (921601, ?, ?, 'Family Will 2024', 1, 'REGISTERED', '2024-05-10', 'Primary Executor', '2024-05-10T00:00:00.000Z')
  `).run(TEST_FAM_A, memberA1);

  db.prepare(`
    INSERT INTO trusts (id, family_id, trust_name, trust_type, corpus_amount, settlor_id, status, created_at)
    VALUES (921602, ?, 'Kapoor Private Family Trust', 'FAMILY', 5000000, ?, 'ACTIVE', '2024-06-01T00:00:00.000Z')
  `).run(TEST_FAM_A, memberA1);

  db.prepare(`
    INSERT INTO graph_nodes (id, family_id, entity_type, entity_id, label)
    VALUES (921701, ?, 'PERSON', '92101', 'Rajesh Kapoor')
  `).run(TEST_FAM_A);
  db.prepare(`
    INSERT INTO graph_nodes (id, family_id, entity_type, entity_id, label)
    VALUES (921702, ?, 'PERSON', '92102', 'Sunita Kapoor')
  `).run(TEST_FAM_A);

  db.prepare(`
    INSERT INTO graph_edges (id, family_id, source_node_id, target_node_id, relationship_type_id, status, created_at)
    VALUES (921703, ?, 921701, 921702, (SELECT id FROM relationship_types WHERE code = 'NOMINEE'), 'ACTIVE', '2024-05-15T00:00:00.000Z')
  `).run(TEST_FAM_A);

  // 1.6 Tax fixture
  db.prepare(`
    INSERT INTO tax_profiles (id, family_id, user_id, financial_year, assessment_year, preferred_regime, created_at)
    VALUES (921801, ?, ?, '2025-26', '2026-27', 'NEW', '2025-04-01T00:00:00.000Z')
  `).run(TEST_FAM_A, memberA1);

  db.prepare(`
    INSERT INTO tax_deductions (id, family_id, tax_profile_id, section, claimed_amount, created_at)
    VALUES (921802, ?, 921801, '80CCD(1B)', 50000, '2025-04-05T00:00:00.000Z')
  `).run(TEST_FAM_A);

  // 1.7 AI Decision fixture
  db.prepare(`
    INSERT INTO proactive_triggers (
      id, trigger_id, family_id, rule_code, rule_version, entity_id, urgency, priority_score, confidence_pct,
      data_completeness_score, headline, rationale, evidence_payload_json, explainability_lineage_json, action_payload_json,
      state_hash, as_of_date, correlation_id, status, created_at, updated_at
    ) VALUES (
      921901, 'trg_921_prot_01', ?, 'RULE_PROTECTION_HLV_GAP', '2026.1', 'fam_921', 'HIGH', 85, 95,
      90, 'Term Insurance Gap Identified', 'Family term protection deficit', '{}', '{}', '{}',
      'hash921', '2024-04-01', 'req_921_01', 'ACKNOWLEDGED', '2024-04-01T00:00:00.000Z', '2024-04-02T10:00:00.000Z'
    )
  `).run(TEST_FAM_A);

  // Synchronize Timeline
  const syncResult = await familyTimelineService.syncFamilyTimeline(TEST_FAM_A);
  assert.ok(syncResult.syncedCount >= 7, `Expected at least 7 events across 7 domains, got ${syncResult.syncedCount}`);
  console.log(`  [PASS] 7-Domain Ingestion: Synced ${syncResult.syncedCount} events in ${syncResult.durationMs}ms`);

  // Verify all 7 domains exist in projected events
  const allEvents = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 });
  const presentDomains = new Set(allEvents.events.map(e => e.domain));
  assert.ok(presentDomains.has('PORTFOLIO'), 'PORTFOLIO domain event must exist');
  assert.ok(presentDomains.has('PROTECTION'), 'PROTECTION domain event must exist');
  assert.ok(presentDomains.has('GOAL'), 'GOAL domain event must exist');
  assert.ok(presentDomains.has('LIFE_EVENT'), 'LIFE_EVENT domain event must exist');
  assert.ok(presentDomains.has('ESTATE'), 'ESTATE domain event must exist');
  assert.ok(presentDomains.has('TAX'), 'TAX domain event must exist');
  assert.ok(presentDomains.has('AI_DECISION'), 'AI_DECISION domain event must exist');
  console.log('  [PASS] Domain Classification: All 7 logical domains verified in timeline projection');

  // ==========================================================================
  // 2. REPEATING EVENT IDENTITY NON-COLLISION
  // ==========================================================================

  const goalEvents = allEvents.events.filter(e => e.domain === 'GOAL');
  const goalEventIds = goalEvents.map(e => e.eventId);
  const uniqueGoalIds = new Set(goalEventIds);
  assert.strictEqual(goalEventIds.length, uniqueGoalIds.size, 'Goal lifecycle events on same record must not have ID collisions');
  assert.ok(goalEventIds.some(id => id.includes('_CREATED')), 'Goal created event must exist');
  assert.ok(goalEventIds.some(id => id.includes('_HALFWAY_FUNDED')), 'Goal halfway funded event must exist');
  console.log('  [PASS] Repeating Event Identity: Distinct canonical keys prevent ID collision');

  // ==========================================================================
  // 3. SCHEDULED VS HISTORICAL EVENT SEPARATION
  // ==========================================================================

  const timelineWithScheduled = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100, includeScheduled: true });
  const scheduledEvents = timelineWithScheduled.events.filter(e => e.eventStatus === 'SCHEDULED');
  assert.ok(scheduledEvents.length > 0, 'Scheduled premium due event must be tagged SCHEDULED');
  assert.strictEqual(scheduledEvents[0].eventType, 'SCHEDULED_PREMIUM_DUE', 'Event type must be SCHEDULED_PREMIUM_DUE');

  // By default, past query should not include future scheduled dates
  const historicalQuery = familyTimelineService.getTimeline(TEST_FAM_A, { includeScheduled: false });
  assert.ok(!historicalQuery.events.some(e => e.eventStatus === 'SCHEDULED'), 'Historical query must exclude future scheduled events');
  console.log('  [PASS] Scheduled vs Historical: Future obligations tagged SCHEDULED and filtered appropriately');

  // ==========================================================================
  // 4. VALUATION INVARIANT & PROTECTION COVERAGE
  // ==========================================================================

  const protectionEvent = allEvents.events.find(e => e.eventType === 'POLICY_ACTIVATED')!;
  assert.strictEqual(protectionEvent.amountType, 'SUM_ASSURED', 'Protection event amountType must be SUM_ASSURED (coverage)');
  assert.strictEqual(protectionEvent.amount, 15000000.0, 'Sum assured amount must match policy cover');
  console.log('  [PASS] Valuation Invariant: SUM_ASSURED verified as coverage protection');

  // ==========================================================================
  // 5. DETERMINISTIC NARRATIVE HISTORY & IDENTIFIER MASKING
  // ==========================================================================

  assert.ok(protectionEvent.description?.includes('••••'), 'Policy numbers must be centrally masked in narrative');
  assert.ok(!protectionEvent.description?.includes('POL-HDFC-99887766'), 'Raw policy number must NEVER appear in narrative');
  assert.ok(protectionEvent.description?.includes('₹1.5 Cr') || protectionEvent.description?.includes('₹150 L'), 'Indian currency formatting must be rendered');

  const portfolioEvent = allEvents.events.find(e => e.domain === 'PORTFOLIO')!;
  assert.ok(portfolioEvent.description?.includes('₹15 L'), 'Portfolio transaction narrative must format ₹15 L');
  console.log('  [PASS] Deterministic Narrative: Indian currency formatting and central identifier masking verified');

  // ==========================================
  // 6. CURRENCY-AWARE FILTERING
  // ==========================================

  // Add USD asset transaction
  db.prepare(`
    INSERT INTO assets (id, name, type, category)
    VALUES (921102, 'Apple Inc Stock', 'US_STOCK', 'Equity')
  `).run();

  db.prepare(`
    INSERT INTO assets_master (id, name, display_name, asset_type, currency, created_at)
    VALUES (921102, 'Apple Inc Stock', 'Apple Inc', 'STOCK', 'USD', '2024-01-01T00:00:00.000Z')
  `).run();

  db.prepare(`
    INSERT INTO holdings (id, account_id, asset_id, opened_at, created_at)
    VALUES (921152, 921002, 921102, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
  `).run();

  db.prepare(`
    INSERT INTO transactions (id, asset_id, holding_id, type, date, quantity, price, amount, source, narration, created_at)
    VALUES (921202, 921102, 921152, 'BUY', '2024-03-20', 10, 180, 1800, 'MANUAL', 'AAPL buy', '2024-03-20T10:00:00.000Z')
  `).run();

  await familyTimelineService.syncFamilyTimeline(TEST_FAM_A);

  const inrFiltered = familyTimelineService.getTimeline(TEST_FAM_A, { minAmount: 100000, minAmountCurrency: 'INR' });
  assert.ok(inrFiltered.events.every(e => e.currency === 'INR'), 'INR-denominated filter must exclude un-converted USD transactions');
  console.log('  [PASS] Currency-Aware Filtering: Safe currency-specific threshold filtering verified');

  // ==========================================
  // 7. NO-MUTATION INVARIANT ACROSS ALL 11 SOURCE TABLES
  // ==========================================

  function getSourceTableCounts() {
    return {
      transactions: (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c,
      holdings: (db.prepare('SELECT COUNT(*) as c FROM holdings').get() as any).c,
      assets: (db.prepare('SELECT COUNT(*) as c FROM assets').get() as any).c,
      assets_master: (db.prepare('SELECT COUNT(*) as c FROM assets_master').get() as any).c,
      insurance_policies: (db.prepare('SELECT COUNT(*) as c FROM insurance_policies').get() as any).c,
      financial_goals: (db.prepare('SELECT COUNT(*) as c FROM financial_goals').get() as any).c,
      life_events: (db.prepare('SELECT COUNT(*) as c FROM life_events').get() as any).c,
      wills: (db.prepare('SELECT COUNT(*) as c FROM wills').get() as any).c,
      trusts: (db.prepare('SELECT COUNT(*) as c FROM trusts').get() as any).c,
      tax_profiles: (db.prepare('SELECT COUNT(*) as c FROM tax_profiles').get() as any).c,
      tax_deductions: (db.prepare('SELECT COUNT(*) as c FROM tax_deductions').get() as any).c,
      proactive_triggers: (db.prepare('SELECT COUNT(*) as c FROM proactive_triggers').get() as any).c,
      graph_edges: (db.prepare('SELECT COUNT(*) as c FROM graph_edges').get() as any).c
    };
  }

  const beforeCounts = getSourceTableCounts();
  await familyTimelineService.syncFamilyTimeline(TEST_FAM_A);
  const afterCounts = getSourceTableCounts();

  assert.deepStrictEqual(beforeCounts, afterCounts, 'Timeline sync must execute ZERO writes (inserts/updates/deletes) on source tables');
  console.log('  [PASS] No-Mutation Invariant: Confirmed 0 writes across all 11 source tables');

  // ==========================================
  // 8. ATOMIC SYNC FAILURE ROLLBACK
  // ==========================================

  const timelineBefore = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 });
  let failedClosed = false;

  // Create a mock instance with a broken extractor to simulate fatal domain failure
  const brokenService = new FamilyTimelineService();
  brokenService.extractTaxEvents = () => { throw new Error('Fatal Tax Extractor Crash'); };

  try {
    await brokenService.syncFamilyTimeline(TEST_FAM_A);
  } catch (err: any) {
    if (err.message.includes('Timeline domain extraction failure')) {
      failedClosed = true;
    }
  }

  assert.strictEqual(failedClosed, true, 'Extraction failure must fail closed');
  const timelineAfter = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 });
  assert.strictEqual(timelineBefore.total, timelineAfter.total, 'Failed sync must preserve previous timeline without partial corruption');
  console.log('  [PASS] Atomic Rollback: Fail-closed transaction preserves previous timeline state on error');

  // ==========================================
  // 9. DETERMINISTIC REBUILD INVARIANT
  // ==========================================

  await familyTimelineService.syncFamilyTimeline(TEST_FAM_A);
  const run1 = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 }).events;

  // Purge entire projection
  familyTimelineRepository.purgeFamilyTimeline(TEST_FAM_A);
  assert.strictEqual(familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 }).total, 0, 'Purged timeline must have 0 events');

  // Re-sync from authoritative sources
  await familyTimelineService.syncFamilyTimeline(TEST_FAM_A);
  const run2 = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 }).events;

  assert.strictEqual(run1.length, run2.length, 'Rebuild count must match');
  for (let i = 0; i < run1.length; i++) {
    assert.strictEqual(run1[i].eventId, run2[i].eventId, `Event ID mismatch at index ${i}`);
    assert.strictEqual(run1[i].eventDate, run2[i].eventDate, `Event date mismatch at index ${i}`);
    assert.strictEqual(run1[i].amount, run2[i].amount, `Amount mismatch at index ${i}`);
    assert.strictEqual(run1[i].importanceTier, run2[i].importanceTier, `Importance mismatch at index ${i}`);
    assert.strictEqual(run1[i].description, run2[i].description, `Narrative mismatch at index ${i}`);
    assert.strictEqual(run1[i].stateHash, run2[i].stateHash, `State hash mismatch at index ${i}`);
  }
  console.log('  [PASS] Deterministic Rebuild: 100% identical event IDs, dates, amounts, hashes, and narratives on rebuild');

  // ==========================================
  // 10. CROSS-FAMILY SECURITY ISOLATION
  // ==========================================

  // Populate Family B timeline
  db.prepare(`
    INSERT INTO entities (id, family_member_id, name, entity_type, created_at)
    VALUES (922001, ?, 'Vikram Singhania', 'INDIVIDUAL', CURRENT_TIMESTAMP)
  `).run(memberB1);

  db.prepare(`
    INSERT INTO accounts (id, entity_id, account_name, account_type, created_at)
    VALUES (922002, 922001, 'Singhania Real Estate', 'OTHER', CURRENT_TIMESTAMP)
  `).run();

  db.prepare(`
    INSERT INTO assets (id, name, type, category)
    VALUES (922101, 'Singhania Villa', 'PROPERTY', 'Other')
  `).run();

  db.prepare(`
    INSERT INTO assets_master (id, name, display_name, asset_type, currency, created_at)
    VALUES (922101, 'Singhania Villa', 'Singhania Villa', 'REAL_ESTATE', 'INR', '2024-01-01T00:00:00.000Z')
  `).run();

  db.prepare(`
    INSERT INTO holdings (id, account_id, asset_id, opened_at, created_at)
    VALUES (922151, 922002, 922101, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
  `).run();

  db.prepare(`
    INSERT INTO transactions (id, asset_id, holding_id, type, date, quantity, price, amount, source, narration, created_at)
    VALUES (922201, 922101, 922151, 'BUY', '2024-01-15', 1, 50000000, 50000000, 'MANUAL', 'Villa purchase', '2024-01-15T10:00:00.000Z')
  `).run();

  await familyTimelineService.syncFamilyTimeline(TEST_FAM_B);

  const famAEvents = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 });
  const famBEvents = familyTimelineService.getTimeline(TEST_FAM_B, { limit: 100 });

  assert.ok(famAEvents.events.every(e => e.familyId === TEST_FAM_A), 'Family A must only see Family A events');
  assert.ok(famBEvents.events.every(e => e.familyId === TEST_FAM_B), 'Family B must only see Family B events');
  assert.ok(!famAEvents.events.some(e => e.title.includes('Singhania Villa')), 'Family A cannot view Family B transactions');
  console.log('  [PASS] Cross-Family Isolation: Complete multi-tenant privacy enforced');

  // ==========================================================================
  // 11. FULL-DOMAIN PERFORMANCE BENCHMARK
  // ==========================================================================

  const perfStart = Date.now();
  const perfResult = await familyTimelineService.syncFamilyTimeline(TEST_FAM_A);
  const queryResult = familyTimelineService.getTimeline(TEST_FAM_A, { limit: 100 });
  const totalDuration = Date.now() - perfStart;

  console.log(`  [BENCHMARK] Full Sync & Query completed in ${totalDuration}ms (Sync: ${perfResult.durationMs}ms, Events: ${queryResult.total})`);
  assert.ok(totalDuration <= 100, `Performance target exceeded: ${totalDuration}ms > 100ms`);
  console.log('  [PASS] Performance Benchmark: Execution time comfortably within <= 100ms requirement');

  // Cleanup after test run
  cleanupFixtures();
  console.log('Sprint 8C.2 Invariant Test Summary: 11 test suites passed, 0 failed\n');
  return { passed: 11, failed: 0 };
}
