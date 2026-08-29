import assert from 'assert';
import { db } from '../../db';
import {
  FamilyFinancialHealthService,
  familyFinancialHealthService,
  FFH_RULE_REGISTRY,
  LIFE_STAGE_WEIGHTS
} from '../../services/familyOffice/FamilyFinancialHealthService';
import { familyHealthRepository } from '../../repositories/SQLiteFamilyHealthRepository';
import { SQLiteGoalRepository } from '../../repositories/SQLiteGoalRepository';
import { InsuranceRepository } from '../../repositories/InsuranceRepository';
import { familyRepository } from '../../repositories/SQLiteFamilyRepository';
import { familyMemberRepository } from '../../repositories/SQLiteFamilyMemberRepository';

export async function runSprint8c1Tests() {
  console.log('\n--- Running Sprint 8C.1 Invariant Tests (Family Financial Health Index Engine) ---');

  const healthService = new FamilyFinancialHealthService(db);
  const goalRepo = new SQLiteGoalRepository(db);
  const insuranceRepo = new InsuranceRepository(db);

  const TEST_FAM_A = 911;
  const TEST_FAM_B = 912;

  // Cleanup test artifacts before test run
  familyHealthRepository.deleteSnapshotsByFamily(TEST_FAM_A);
  familyHealthRepository.deleteSnapshotsByFamily(TEST_FAM_B);

  try {
    db.prepare(`INSERT OR IGNORE INTO families (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`).run(TEST_FAM_A, 'FFH Test Family A');
    db.prepare(`INSERT OR IGNORE INTO families (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`).run(TEST_FAM_B, 'FFH Test Family B');

    // Create member for Family A
    db.prepare(`DELETE FROM family_members WHERE family_id = ?`).run(TEST_FAM_A);
    db.prepare(`INSERT INTO family_members (id, family_id, name, relationship, pan, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).run(
      91101, TEST_FAM_A, 'Arjun Mehta', 'SELF', 'ABCDE1234F'
    );
    db.prepare(`INSERT INTO family_members (id, family_id, name, relationship, pan, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).run(
      91102, TEST_FAM_A, 'Pooja Mehta', 'SPOUSE', 'VWXYZ5678G'
    );
    db.prepare(`INSERT INTO family_members (id, family_id, name, relationship, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).run(
      91103, TEST_FAM_A, 'Aarav Mehta', 'CHILD'
    );

    // Create member for Family B
    db.prepare(`DELETE FROM family_members WHERE family_id = ?`).run(TEST_FAM_B);
    db.prepare(`INSERT INTO family_members (id, family_id, name, relationship, pan, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).run(
      91201, TEST_FAM_B, 'Rohan Verma', 'SELF', 'LMNOP9876Q'
    );
  } catch (e) {
    // Ignore schema insert variations
  }

  // ==========================================================================
  // 1. DETERMINISTIC LIFE-STAGE CLASSIFICATION PRECEDENCE
  // ==========================================================================

  // 1.1 Retirement Precedence (isRetired = true or age >= 65)
  const stageRetiree = healthService.determineLifeStage({ age: 68, isRetired: true }, 1);
  assert.strictEqual(stageRetiree, 'RETIREMENT', 'Age >= 65 or retired must classify as RETIREMENT');

  // 1.2 Minor Dependent Precedence Over Young Age
  const stageYoungParent = healthService.determineLifeStage({ age: 28, isRetired: false }, 1);
  assert.strictEqual(stageYoungParent, 'FAMILY_EXPANSION', 'Minor dependents present must classify as FAMILY_EXPANSION even if age < 32');

  // 1.3 Family Expansion Standard Bracket (32..49)
  const stageExpansion = healthService.determineLifeStage({ age: 38, isRetired: false }, 0);
  assert.strictEqual(stageExpansion, 'FAMILY_EXPANSION', 'Age 38 with 0 dependents must classify as FAMILY_EXPANSION');

  // 1.4 Wealth Preservation Bracket (50..64)
  const stagePreservation = healthService.determineLifeStage({ age: 56, isRetired: false }, 0);
  assert.strictEqual(stagePreservation, 'WEALTH_PRESERVATION', 'Age 56 without retirement must classify as WEALTH_PRESERVATION');

  // 1.5 Early Career Bracket (< 32, 0 dependents)
  const stageEarlyCareer = healthService.determineLifeStage({ age: 26, isRetired: false }, 0);
  assert.strictEqual(stageEarlyCareer, 'EARLY_CAREER', 'Age 26 with 0 dependents must classify as EARLY_CAREER');
  console.log('  [PASS] Life-Stage Classification: Deterministic 4-tier precedence verified');

  // ==========================================================================
  // 2. 5-PILLAR CALCULATION & FIDUCIARY FORMULAS
  // ==========================================================================

  // Setup sample insurance policies for Family A
  try {
    db.prepare(`DELETE FROM insurance_policies WHERE family_id = ?`).run(TEST_FAM_A);
    insuranceRepo.create({
      family_id: TEST_FAM_A,
      policy_number: 'POL_TERM_911',
      insurer_name: 'HDFC Life',
      policy_type: 'TERM',
      policy_holder_id: 91101,
      sum_assured: 20000000, // ₹2 Crore
      premium_amount: 25000,
      premium_frequency: 'ANNUAL',
      start_date: '2022-01-01',
      next_premium_due_date: '2027-01-01',
      status: 'ACTIVE'
    });
    insuranceRepo.create({
      family_id: TEST_FAM_A,
      policy_number: 'POL_HLTH_911',
      insurer_name: 'Care Health',
      policy_type: 'HEALTH',
      policy_holder_id: 91101,
      sum_assured: 2500000, // ₹25 Lakhs (100% of benchmark)
      premium_amount: 30000,
      premium_frequency: 'ANNUAL',
      start_date: '2023-01-01',
      next_premium_due_date: '2027-01-01',
      status: 'ACTIVE'
    });
  } catch (e) {}

  // Setup goals for Family A
  try {
    db.prepare(`DELETE FROM financial_goals WHERE family_id = ?`).run(TEST_FAM_A);
    db.prepare(`
      INSERT INTO financial_goals (family_id, goal_type, title, target_amount, target_year, current_allocated_amount, monthly_sip_amount, expected_return_pct, inflation_pct, priority, status, created_at)
      VALUES (?, 'EDUCATION', 'Aarav Higher Education', 5000000, 2038, 2500000, 25000, 12, 6, 'HIGH', 'ON_TRACK', CURRENT_TIMESTAMP)
    `).run(TEST_FAM_A);
    db.prepare(`
      INSERT INTO financial_goals (family_id, goal_type, title, target_amount, target_year, current_allocated_amount, monthly_sip_amount, expected_return_pct, inflation_pct, priority, status, created_at)
      VALUES (?, 'RETIREMENT', 'Retirement 2045', 50000000, 2045, 40000000, 50000, 12, 6, 'HIGH', 'ON_TRACK', CURRENT_TIMESTAMP)
    `).run(TEST_FAM_A);
  } catch (e) {}

  const liveHealth = await healthService.calculateHealth(TEST_FAM_A);
  assert.ok(liveHealth.overallScore >= 0 && liveHealth.overallScore <= 100);
  assert.strictEqual(liveHealth.lifeStage, 'FAMILY_EXPANSION');
  assert.strictEqual(liveHealth.pillars.protection.pillar, 'PROTECTION');
  assert.strictEqual(liveHealth.pillars.goals.pillar, 'GOALS');
  assert.strictEqual(liveHealth.pillars.taxAndData.pillar, 'TAX_AND_DATA');
  console.log(`  [PASS] 5-Pillar Composite Calculation: Live score evaluated (${liveHealth.overallScore}/100)`);

  // ==========================================================================
  // 3. GOALS NOT_APPLICABLE & PROPORTIONAL WEIGHT REDISTRIBUTION
  // ==========================================================================

  // Clear goals for Family B (0 goals configured)
  db.prepare(`DELETE FROM financial_goals WHERE family_id = ?`).run(TEST_FAM_B);
  const healthFamB = await healthService.calculateHealth(TEST_FAM_B);

  assert.strictEqual(healthFamB.pillars.goals.status, 'NOT_APPLICABLE');
  assert.strictEqual(healthFamB.pillars.goals.score, null);
  assert.strictEqual(healthFamB.weights.goals, 0);

  // Remaining 4 weights must sum to 1.00 (100%)
  const sumWeightsB = Math.round(
    (healthFamB.weights.protection +
      healthFamB.weights.liquidity +
      healthFamB.weights.estate +
      healthFamB.weights.taxAndData) * 100
  ) / 100;
  assert.strictEqual(sumWeightsB, 1.0, 'When Goals is NOT_APPLICABLE, remaining 4 weights must sum to 100%');
  console.log('  [PASS] Weight Redistribution: Goals NOT_APPLICABLE redistributes proportionally to 100%');

  // ==========================================================================
  // 4. COMPLETENESS FACTOR & OVERALL STATUS RESOLUTION
  // ==========================================================================

  assert.ok(liveHealth.completenessScore >= 0.5 && liveHealth.completenessScore <= 1.0);
  assert.ok(['COMPLETE', 'PARTIAL', 'INSUFFICIENT_DATA'].includes(liveHealth.overallStatus));
  console.log(`  [PASS] Completeness & Status: Evaluated completenessScore = ${liveHealth.completenessScore}, overallStatus = ${liveHealth.overallStatus}`);

  // ==========================================================================
  // 5. READ-ONLY NON-MUTATING INVARIANT ON GET /health
  // ==========================================================================

  const initialCount = db.prepare(`SELECT COUNT(*) as c FROM family_health_history WHERE family_id = ?`).get(TEST_FAM_A) as { c: number };
  await healthService.calculateHealth(TEST_FAM_A);
  await healthService.calculateHealth(TEST_FAM_A);
  const postCount = db.prepare(`SELECT COUNT(*) as c FROM family_health_history WHERE family_id = ?`).get(TEST_FAM_A) as { c: number };
  assert.strictEqual(initialCount.c, postCount.c, 'calculateHealth / GET /health must NEVER insert into family_health_history');
  console.log('  [PASS] Read-Only Invariant: Live calculation creates zero database history rows');

  // ==========================================================================
  // 6. HISTORICAL SNAPSHOT PERSISTENCE & CONCURRENCY DEDUPLICATION
  // ==========================================================================

  const snap1 = await healthService.createSnapshot(TEST_FAM_A);
  assert.strictEqual(snap1.family_id, TEST_FAM_A);
  assert.ok(snap1.id && snap1.id > 0);

  // Duplicate snapshot creation with identical state returns existing row without new insert
  const snap1Duplicate = await healthService.createSnapshot(TEST_FAM_A);
  assert.strictEqual(snap1Duplicate.id, snap1.id, 'Duplicate snapshot must return existing record without insert');

  const history = healthService.getSnapshotHistory(TEST_FAM_A, 10);
  assert.strictEqual(history.length, 1, 'Snapshot history must contain exactly 1 deduplicated record');
  console.log('  [PASS] Snapshot Deduplication: Identical point-in-time state returns existing record without insert');

  // ==========================================================================
  // 7. COMPARATIVE DELTA ATTRIBUTION & ZERO-DIVISION PROTECTION
  // ==========================================================================

  // Persist a synthetic previous snapshot with score = 0 to verify zero division safety
  db.prepare(`
    INSERT INTO family_health_history (
      family_id, overall_score, pillar_scores_json, life_stage, weights_json, completeness_score, state_hash, calculation_version, snapshot_period, as_of_date, created_at
    ) VALUES (
      ?, 0.0, '{}', 'EARLY_CAREER', '{}', 0.5, 'hash_zero_prev', '2026.1', '2026-07', '2026-07-01T00:00:00.000Z', CURRENT_TIMESTAMP
    )
  `).run(TEST_FAM_B);

  const healthWithZeroPrev = await healthService.calculateHealth(TEST_FAM_B);
  assert.strictEqual(healthWithZeroPrev.deltas?.percentDelta, null, 'Division by zero on previousScore = 0 must return percentDelta = null');
  assert.ok(healthWithZeroPrev.deltas?.absoluteDelta !== undefined, 'absoluteDelta must remain valid');
  console.log('  [PASS] Delta Safety: Division-by-zero protection yields percentDelta = null');

  // ==========================================================================
  // 8. HISTORICAL AS_OF_DATE BOUNDARY REJECTION
  // ==========================================================================

  let historicalRejected = false;
  try {
    await healthService.createSnapshot(TEST_FAM_A, '2022-01-01T00:00:00.000Z');
  } catch (err: any) {
    if (err.name === 'ValidationError' || err.message.includes('Historical asOfDate calculation is unsupported in Sprint 8C.1')) {
      historicalRejected = true;
    }
  }
  assert.ok(historicalRejected, 'Past asOfDate must be rejected with ValidationError until Sprint 8C.3 Time Machine');
  console.log('  [PASS] Historical Date Boundary: Past asOfDate explicitly rejected with ValidationError');

  // ==========================================================================
  // 9. CROSS-FAMILY ISOLATION & SUB-500MS PERFORMANCE BENCHMARK
  // ==========================================================================

  const famAHistory = healthService.getSnapshotHistory(TEST_FAM_A);
  const famBHistory = healthService.getSnapshotHistory(TEST_FAM_B);
  assert.ok(famAHistory.every(h => h.family_id === TEST_FAM_A));
  assert.ok(famBHistory.every(h => h.family_id === TEST_FAM_B));
  console.log('  [PASS] Cross-Family Isolation: Snapshot history isolated per family scope');

  // Performance benchmark
  const startMs = Date.now();
  await healthService.calculateHealth(TEST_FAM_A);
  const durationMs = Date.now() - startMs;
  assert.ok(durationMs <= 500, `FFH calculation must complete in <= 500ms (Actual: ${durationMs}ms)`);
  console.log(`  [PASS] Performance Benchmark: Live calculation completed in ${durationMs}ms (<= 500ms target)`);

  // Cleanup test families
  familyHealthRepository.deleteSnapshotsByFamily(TEST_FAM_A);
  familyHealthRepository.deleteSnapshotsByFamily(TEST_FAM_B);

  console.log('Sprint 8C.1 Invariant Test Summary: 9 test suites passed, 0 failed\n');
  return { passed: 9, failed: 0 };
}
