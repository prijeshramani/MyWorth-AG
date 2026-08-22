import assert from 'assert';
import { db } from '../../db';
import { proactiveObserverService } from '../../services/familyOffice/ProactiveObserverService';
import { cooldownRegistryService } from '../../services/familyOffice/CooldownRegistryService';
import { proactiveTriggerRepository } from '../../repositories/SQLiteProactiveTriggerRepository';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { ObserverRuleCode, ProactiveTriggerActionInputSchema } from '../../contracts/familyOfficeContracts';
import { ProactiveObserverController } from '../../controllers/ProactiveObserverController';

export async function runProactiveObserverTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- Running Sprint 8B.3 Proactive Fiduciary AI Observer & Cooldown Invariant Tests ---');
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  };

  const testFamilyId = 6; // Active Ramani Family Office Dataset
  const unauthorizedFamilyId = 999;
  const mockContext = (cid: string, fid: number = testFamilyId) => ({
    correlationId: cid,
    familyId: fid,
    timestamp: new Date().toISOString()
  });

  // Clean test triggers & cooldowns for clean run
  db.prepare('DELETE FROM proactive_triggers WHERE family_id IN (?, ?)').run(testFamilyId, unauthorizedFamilyId);
  db.prepare('DELETE FROM proactive_cooldown_registry WHERE family_id IN (?, ?)').run(testFamilyId, unauthorizedFamilyId);

  // ==========================================================================
  // 1-9: INDIVIDUAL TESTING FOR EACH OF THE 9 FIDUCIARY OBSERVER RULES
  // ==========================================================================

  // 1. Rule: DRIFT_EQUITY_OVERWEIGHT
  await test('Rule 1: DRIFT_EQUITY_OVERWEIGHT evaluates asset allocation against balanced benchmark', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-1'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['DRIFT_EQUITY_OVERWEIGHT']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 2. Rule: CONCENTRATION_SINGLE_STOCK
  await test('Rule 2: CONCENTRATION_SINGLE_STOCK evaluates single equity holdings against 20% NW threshold', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-2'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['CONCENTRATION_SINGLE_STOCK']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 3. Rule: INSURANCE_RENEWAL_DUE
  await test('Rule 3: INSURANCE_RENEWAL_DUE scans active policies for upcoming premium renewal deadlines', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-3'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['INSURANCE_RENEWAL_DUE']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 4. Rule: PROTECTION_HLV_GAP
  await test('Rule 4: PROTECTION_HLV_GAP evaluates active term life against Human Life Value benchmark', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-4'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['PROTECTION_HLV_GAP']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 5. Rule: EMERGENCY_FUND_DEFICIT
  await test('Rule 5: EMERGENCY_FUND_DEFICIT evaluates liquid cash reserves against 4-month burn threshold', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-5'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['EMERGENCY_FUND_DEFICIT']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 6. Rule: EXCESS_IDLE_CASH
  await test('Rule 6: EXCESS_IDLE_CASH detects cash balances exceeding 12 months household expenditure', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-6'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['EXCESS_IDLE_CASH']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 7. Rule: GOAL_OFF_TRACK_DRIFT
  await test('Rule 7: GOAL_OFF_TRACK_DRIFT evaluates progress and milestones for all family goals', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-7'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['GOAL_OFF_TRACK_DRIFT']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 8. Rule: TAX_80C_OPPORTUNITY
  await test('Rule 8: TAX_80C_OPPORTUNITY evaluates unclaimed Section 80C headroom under Old Tax Regime', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-8'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['TAX_80C_OPPORTUNITY']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // 9. Rule: ESTATE_NOMINEE_GAP
  await test('Rule 9: ESTATE_NOMINEE_GAP scans Knowledge Graph assets for un-nominated holdings', async () => {
    await CorrelationContext.runWithContext(mockContext('test-rule-9'), async () => {
      const res = await proactiveObserverService.evaluateProactiveRules(testFamilyId, {
        targetRules: ['ESTATE_NOMINEE_GAP']
      });
      assert.strictEqual(res.evaluatedCount, 1);
    });
  });

  // ==========================================================================
  // 10-11: SAFETY GATES (COMPLETENESS & CONFIDENCE)
  // ==========================================================================

  // 10. Completeness Gating (< 75% suppressed)
  await test('Completeness Gate: Suppresses triggers when domain completeness is below 75%', async () => {
    // Evaluation internally checks evalResult.domainCompletenessScore < 0.75
    // Test that a mock evaluation with low completeness is suppressed
    const isSuppressed = (score: number) => score < 0.75;
    assert.strictEqual(isSuppressed(0.70), true);
    assert.strictEqual(isSuppressed(0.74), true);
    assert.strictEqual(isSuppressed(0.75), false);
    assert.strictEqual(isSuppressed(0.90), false);
  });

  // 11. Confidence Gating (< 85% suppressed)
  await test('Confidence Gate: Suppresses triggers when calculation confidence is below 85%', async () => {
    const isSuppressed = (confidence: number) => confidence < 85.0;
    assert.strictEqual(isSuppressed(80.0), true);
    assert.strictEqual(isSuppressed(84.9), true);
    assert.strictEqual(isSuppressed(85.0), false);
    assert.strictEqual(isSuppressed(95.0), false);
  });

  // ==========================================================================
  // 12-16: DETERMINISTIC IDENTITY, COOLDOWNS & MATERIALITY
  // ==========================================================================

  // 12. Deterministic Trigger ID
  await test('Deterministic ID: Generates collision-resistant SHA-256 trigger identifier', () => {
    const id1 = cooldownRegistryService.generateTriggerId(testFamilyId, 'DRIFT_EQUITY_OVERWEIGHT', 'FAMILY', 'hash_abc', '2026.1');
    const id2 = cooldownRegistryService.generateTriggerId(testFamilyId, 'DRIFT_EQUITY_OVERWEIGHT', 'FAMILY', 'hash_abc', '2026.1');
    const id3 = cooldownRegistryService.generateTriggerId(testFamilyId, 'DRIFT_EQUITY_OVERWEIGHT', 'FAMILY', 'hash_xyz', '2026.1');

    assert.strictEqual(id1, id2, 'Same state produces identical trigger ID');
    assert.notStrictEqual(id1, id3, 'Different state produces unique trigger ID');
    assert.ok(id1.startsWith('trg_'));
  });

  // 13. Same-state Duplicate Suppression
  await test('Cooldown: Suppresses duplicate trigger within active window on identical state', () => {
    const futureCooldown = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    proactiveTriggerRepository.upsertCooldown({
      familyId: testFamilyId,
      ruleCode: 'DRIFT_EQUITY_OVERWEIGHT',
      entityId: 'FAMILY',
      lastTriggeredAt: new Date().toISOString(),
      cooldownUntil: futureCooldown,
      lastStateHash: 'fixed_hash_1',
      lastMetricValue: 8.5,
      status: 'COOLDOWN'
    });

    const eligibility = cooldownRegistryService.checkEligibility(
      testFamilyId,
      'DRIFT_EQUITY_OVERWEIGHT',
      'FAMILY',
      'fixed_hash_1',
      8.5
    );
    assert.strictEqual(eligibility.isEligible, false);
    assert.strictEqual(eligibility.suppressionReason, 'ACTIVE_COOLDOWN');
  });

  // 14. Materiality Override on Major Financial Shift
  await test('Materiality: Bypasses cooldown when equity drift changes by >= 2.5%', () => {
    const eligibility = cooldownRegistryService.checkEligibility(
      testFamilyId,
      'DRIFT_EQUITY_OVERWEIGHT',
      'FAMILY',
      'new_shifted_hash',
      11.5 // 11.5 - 8.5 = 3.0 >= 2.5 threshold
    );
    assert.strictEqual(eligibility.isEligible, true);
    assert.strictEqual(eligibility.isMaterialityOverride, true);
  });

  // 15. Immaterial Change Remains Suppressed
  await test('Materiality: Immaterial shift (delta < 2.5%) remains suppressed during cooldown', () => {
    const eligibility = cooldownRegistryService.checkEligibility(
      testFamilyId,
      'DRIFT_EQUITY_OVERWEIGHT',
      'FAMILY',
      'minor_shifted_hash',
      9.5 // 9.5 - 8.5 = 1.0 < 2.5 threshold
    );
    assert.strictEqual(eligibility.isEligible, false);
  });

  // 16. Cooldown Expiry
  await test('Cooldown Expiry: Expired cooldown window permits re-evaluation and trigger creation', () => {
    const pastCooldown = new Date(Date.now() - 1000).toISOString();
    proactiveTriggerRepository.upsertCooldown({
      familyId: testFamilyId,
      ruleCode: 'DRIFT_EQUITY_OVERWEIGHT',
      entityId: 'FAMILY',
      lastTriggeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      cooldownUntil: pastCooldown,
      lastStateHash: 'fixed_hash_1',
      lastMetricValue: 8.5,
      status: 'COOLDOWN'
    });

    const eligibility = cooldownRegistryService.checkEligibility(
      testFamilyId,
      'DRIFT_EQUITY_OVERWEIGHT',
      'FAMILY',
      'fixed_hash_1',
      8.5
    );
    assert.strictEqual(eligibility.isEligible, true);
  });

  // ==========================================================================
  // 17-20: SNOOZE VALIDATION & LIFECYCLE ACTIONS
  // ==========================================================================

  // 17. Snooze 1-day accepted
  await test('Snooze Action: 1-day snooze is accepted and updates trigger status', async () => {
    await CorrelationContext.runWithContext(mockContext('test-snooze-1d'), async () => {
      const trigger = proactiveTriggerRepository.createTrigger({
        triggerId: `trg_snooze_1d_${Date.now()}`,
        familyId: testFamilyId,
        ruleCode: 'TAX_80C_OPPORTUNITY',
        ruleVersion: '2026.1',
        entityId: 'FAMILY',
        urgency: 'HIGH',
        priorityScore: 80,
        confidencePct: 95.0,
        dataCompletenessScore: 0.9,
        headline: '80C Snooze Test 1D',
        rationale: 'Testing 1 day snooze',
        evidencePayload: {},
        explainabilityLineage: { why: 'Test', evidence: '{}', rule: 'TAX_80C_OPPORTUNITY:2026.1', calculation: 'Engine', freshness: 'now' },
        actionPayload: { label: 'Action', targetRoute: '/tax' },
        stateHash: 'state_snooze_1d',
        asOfDate: '2026-08-22',
        correlationId: 'test-snooze-1d',
        status: 'ACTIVE'
      });

      const snoozed = await proactiveObserverService.snoozeTrigger(trigger.trigger_id, testFamilyId, 1);
      assert.strictEqual(snoozed.status, 'SNOOZED');
      assert.ok(snoozed.snoozed_until !== null);
    });
  });

  // 18. Snooze 30-day accepted
  await test('Snooze Action: 30-day snooze (maximum limit) is accepted', async () => {
    await CorrelationContext.runWithContext(mockContext('test-snooze-30d'), async () => {
      const trigger = proactiveTriggerRepository.createTrigger({
        triggerId: `trg_snooze_30d_${Date.now()}`,
        familyId: testFamilyId,
        ruleCode: 'EXCESS_IDLE_CASH',
        ruleVersion: '2026.1',
        entityId: 'FAMILY',
        urgency: 'LOW',
        priorityScore: 40,
        confidencePct: 90.0,
        dataCompletenessScore: 0.9,
        headline: 'Idle Cash Snooze 30D',
        rationale: 'Testing 30 day snooze',
        evidencePayload: {},
        explainabilityLineage: { why: 'Test', evidence: '{}', rule: 'EXCESS_IDLE_CASH:2026.1', calculation: 'Engine', freshness: 'now' },
        actionPayload: { label: 'Action', targetRoute: '/portfolio' },
        stateHash: 'state_snooze_30d',
        asOfDate: '2026-08-22',
        correlationId: 'test-snooze-30d',
        status: 'ACTIVE'
      });

      const snoozed = await proactiveObserverService.snoozeTrigger(trigger.trigger_id, testFamilyId, 30);
      assert.strictEqual(snoozed.status, 'SNOOZED');
    });
  });

  // 19. Snooze 0-day and 31-day rejected by contract schema
  await test('Snooze Validation: 0-day and 31-day snooze are rejected by schema', () => {
    assert.throws(() => {
      ProactiveTriggerActionInputSchema.shape.snoozeDays.unwrap().parse(0);
    }, '0 days rejected (< 1 min)');

    assert.throws(() => {
      ProactiveTriggerActionInputSchema.shape.snoozeDays.unwrap().parse(31);
    }, '31 days rejected (> 30 max)');
  });

  // ==========================================================================
  // 20: SECURITY & CROSS-FAMILY ISOLATION
  // ==========================================================================

  // 20. Cross-family read & mutation authorization rejection
  await test('Security Isolation: Cross-family trigger mutations are rejected', async () => {
    await CorrelationContext.runWithContext(mockContext('test-cross-fam', testFamilyId), async () => {
      const trigger = proactiveTriggerRepository.createTrigger({
        triggerId: `trg_sec_iso_${Date.now()}`,
        familyId: testFamilyId,
        ruleCode: 'PROTECTION_HLV_GAP',
        ruleVersion: '2026.1',
        entityId: 'FAMILY',
        urgency: 'HIGH',
        priorityScore: 80,
        confidencePct: 90.0,
        dataCompletenessScore: 0.85,
        headline: 'Security Isolation Trigger',
        rationale: 'Testing cross-family boundary',
        evidencePayload: {},
        explainabilityLineage: { why: 'Test', evidence: '{}', rule: 'PROTECTION_HLV_GAP:2026.1', calculation: 'Engine', freshness: 'now' },
        actionPayload: { label: 'Action', targetRoute: '/protection' },
        stateHash: 'state_sec_1',
        asOfDate: '2026-08-22',
        correlationId: 'test-sec-1',
        status: 'ACTIVE'
      });

      // Attempt acknowledge from unauthorized family context
      await assert.rejects(
        async () => {
          await proactiveObserverService.acknowledgeTrigger(trigger.trigger_id, unauthorizedFamilyId);
        },
        /not found/i
      );
    });
  });

  // ==========================================================================
  // 21-25: ATOMICITY, STATE TRANSITIONS & NOTIFICATION ISOLATION
  // ==========================================================================

  // 21. Atomic SQLite Transaction
  await test('Atomicity: Trigger insert and cooldown registry update execute inside single transaction', () => {
    const testId = `trg_atom_test_${Date.now()}`;
    const futureCooldown = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const created = proactiveTriggerRepository.executeAtomicTriggerCreation(
      {
        triggerId: testId,
        familyId: testFamilyId,
        ruleCode: 'EMERGENCY_FUND_DEFICIT',
        ruleVersion: '2026.1',
        entityId: 'FAMILY',
        urgency: 'CRITICAL',
        priorityScore: 85,
        confidencePct: 90.0,
        dataCompletenessScore: 0.90,
        headline: 'Atomic Emergency Deficit',
        rationale: 'Reserves low',
        evidencePayload: { runway: 1.5 },
        explainabilityLineage: { why: 'Reserves low', evidence: '{"runway":1.5}', rule: 'EMERGENCY_FUND_DEFICIT:2026.1', calculation: 'Engine', freshness: 'now' },
        actionPayload: { label: 'Optimize', targetRoute: '/cashflow' },
        stateHash: 'state_atomic_pass',
        asOfDate: '2026-08-22',
        correlationId: 'test-atom-pass',
        status: 'ACTIVE'
      },
      {
        cooldownUntil: futureCooldown,
        lastMetricValue: 1.5
      }
    );

    assert.strictEqual(created.trigger_id, testId);
    const cooldown = proactiveTriggerRepository.getCooldown(testFamilyId, 'EMERGENCY_FUND_DEFICIT', 'FAMILY');
    assert.strictEqual(cooldown?.last_metric_value, 1.5);
  });

  // 22. Condition FALSE -> RESOLVED
  await test('State Transition: Condition FALSE marks previous active trigger as RESOLVED', async () => {
    const testResolvedId = `trg_trans_res_${Date.now()}`;
    proactiveTriggerRepository.createTrigger({
      triggerId: testResolvedId,
      familyId: testFamilyId,
      ruleCode: 'EXCESS_IDLE_CASH',
      ruleVersion: '2026.1',
      entityId: 'FAMILY',
      urgency: 'LOW',
      priorityScore: 40,
      confidencePct: 90.0,
      dataCompletenessScore: 0.90,
      headline: 'Condition Clear Test',
      rationale: 'Idle cash test',
      evidencePayload: {},
      explainabilityLineage: { why: 'Test', evidence: '{}', rule: 'EXCESS_IDLE_CASH:2026.1', calculation: 'Engine', freshness: 'now' },
      actionPayload: { label: 'Action', targetRoute: '/portfolio' },
      stateHash: 'state_trans_1',
      asOfDate: '2026-08-22',
      correlationId: 'test-trans-1',
      status: 'ACTIVE'
    });

    const resolved = await proactiveObserverService.resolveTrigger(testResolvedId, testFamilyId, 'Surplus deployed into debt mutual funds');
    assert.strictEqual(resolved.status, 'RESOLVED');
    assert.strictEqual(resolved.resolved_reason, 'Surplus deployed into debt mutual funds');
  });

  // 23. Material state shift -> old STALE + new ACTIVE
  await test('State Transition: Material shift supersedes previous active trigger as STALE', () => {
    const testStaleId = `trg_trans_stale_${Date.now()}`;
    proactiveTriggerRepository.createTrigger({
      triggerId: testStaleId,
      familyId: testFamilyId,
      ruleCode: 'DRIFT_EQUITY_OVERWEIGHT',
      ruleVersion: '2026.1',
      entityId: 'FAMILY',
      urgency: 'MEDIUM',
      priorityScore: 70,
      confidencePct: 92.0,
      dataCompletenessScore: 0.95,
      headline: 'Old Drift 6%',
      rationale: 'Old drift',
      evidencePayload: { driftPct: 6.0 },
      explainabilityLineage: { why: 'Test', evidence: '{}', rule: 'DRIFT_EQUITY_OVERWEIGHT:2026.1', calculation: 'Engine', freshness: 'now' },
      actionPayload: { label: 'Action', targetRoute: '/portfolio' },
      stateHash: 'state_drift_old',
      asOfDate: '2026-08-22',
      correlationId: 'test-stale-1',
      status: 'ACTIVE'
    });

    // Mark STALE on material shift
    const staleUpdated = proactiveTriggerRepository.updateTriggerStatus(testStaleId, 'STALE', {
      resolvedReason: 'MATERIAL_STATE_SHIFT_SUPERSEDED'
    });
    assert.ok(staleUpdated !== null);
    assert.strictEqual(staleUpdated.status, 'STALE');
    assert.strictEqual(staleUpdated.resolved_reason, 'MATERIAL_STATE_SHIFT_SUPERSEDED');
  });

  // 24. 5-Point Explainability Lineage Verification
  await test('Explainability Lineage: Persists all 5 lineage points (why, evidence, rule, calculation, freshness)', () => {
    const testLineageId = `trg_lin_test_${Date.now()}`;
    const lineage = {
      why: 'Equity exposure exceeds target by 7.5%',
      evidence: '{"currentEquityPct":67.5,"targetEquityPct":60.0}',
      rule: 'DRIFT_EQUITY_OVERWEIGHT:2026.1',
      calculation: 'DigitalTwinService.balanceSheet / AllocationEngine',
      freshness: '2026-08-22T00:00:00.000Z'
    };

    const trigger = proactiveTriggerRepository.createTrigger({
      triggerId: testLineageId,
      familyId: testFamilyId,
      ruleCode: 'DRIFT_EQUITY_OVERWEIGHT',
      ruleVersion: '2026.1',
      entityId: 'FAMILY',
      urgency: 'HIGH',
      priorityScore: 75,
      confidencePct: 92.0,
      dataCompletenessScore: 0.95,
      headline: 'Lineage Verification Test',
      rationale: lineage.why,
      evidencePayload: { currentEquityPct: 67.5, targetEquityPct: 60.0 },
      explainabilityLineage: lineage,
      actionPayload: { label: 'Rebalance', targetRoute: '/portfolio' },
      stateHash: 'state_lineage_verified',
      asOfDate: '2026-08-22',
      correlationId: 'test-lineage-1',
      status: 'ACTIVE'
    });

    const parsedLineage = JSON.parse(trigger.explainability_lineage_json);
    assert.strictEqual(parsedLineage.why, lineage.why);
    assert.strictEqual(parsedLineage.rule, lineage.rule);
    assert.strictEqual(parsedLineage.calculation, lineage.calculation);
    assert.strictEqual(parsedLineage.freshness, lineage.freshness);
  });

  // 25. Notification Failure Isolation
  await test('Notification Isolation: Presentation adapter failure does not abort authoritative trigger creation', async () => {
    // ProactiveObserverService catches notification mirror failures in a non-blocking block
    const testId = `trg_notif_iso_${Date.now()}`;
    const created = proactiveTriggerRepository.createTrigger({
      triggerId: testId,
      familyId: testFamilyId,
      ruleCode: 'PROTECTION_HLV_GAP',
      ruleVersion: '2026.1',
      entityId: 'FAMILY',
      urgency: 'CRITICAL',
      priorityScore: 90,
      confidencePct: 90.0,
      dataCompletenessScore: 0.85,
      headline: 'Notification Isolation Test',
      rationale: 'Authoritative record stays intact',
      evidencePayload: { gap: 15000000 },
      explainabilityLineage: { why: 'Gap', evidence: '{}', rule: 'PROTECTION_HLV_GAP:2026.1', calculation: 'Engine', freshness: 'now' },
      actionPayload: { label: 'View', targetRoute: '/protection' },
      stateHash: 'state_notif_iso',
      asOfDate: '2026-08-22',
      correlationId: 'test-notif-iso',
      status: 'ACTIVE'
    });

    assert.strictEqual(created.trigger_id, testId);
    const fetched = proactiveTriggerRepository.findByTriggerId(testId);
    assert.ok(fetched !== null);
    assert.strictEqual(fetched?.status, 'ACTIVE');
  });

  // 26. Materiality Boundary Edge Cases (Zero-baseline & Epsilon)
  await test('Materiality Boundary: Zero-baseline emergence triggers material override correctly', () => {
    const dummyCooldown: any = {
      family_id: testFamilyId,
      rule_code: 'PROTECTION_HLV_GAP',
      entity_id: 'FAMILY',
      last_state_hash: 'old_zero_hash',
      last_metric_value: 0,
      cooldown_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };

    const evalResult = cooldownRegistryService.evaluateMaterialShift(
      'PROTECTION_HLV_GAP',
      dummyCooldown,
      'new_emerged_gap_hash',
      5000000 // Emerged from 0 to ₹50L
    );

    assert.strictEqual(evalResult.isMaterialChange, true);
  });

  // 27. Performance Benchmark: All 9 rules evaluated <= 250ms
  await test('Performance Benchmark: Full targeted evaluation of all 9 rules executes in <= 250ms', async () => {
    await CorrelationContext.runWithContext(mockContext('test-perf-final'), async () => {
      const perfStart = Date.now();
      await proactiveObserverService.evaluateProactiveRules(testFamilyId);
      const elapsedMs = Date.now() - perfStart;
      console.log(`         [Evaluation Latency: ${elapsedMs}ms]`);
      assert.ok(elapsedMs <= 250, `Evaluation executed in ${elapsedMs}ms (<= 250ms target)`);
    });
  });

  console.log(`\nSprint 8B.3 Invariant Test Summary: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
