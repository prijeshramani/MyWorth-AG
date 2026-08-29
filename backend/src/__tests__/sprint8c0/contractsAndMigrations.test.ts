import assert from 'assert';
import { db } from '../../db';
import {
  LifeStageEnum,
  PillarStatusEnum,
  ProvenanceTypeEnum,
  ValuationTypeEnum,
  TimelineDomainEnum,
  TimelineImportanceEnum,
  FFHPillarScoreSchema,
  FamilyFinancialHealthSchema,
  FamilyHealthSnapshotRowSchema,
  TimelineEventSchema,
  TimelineQueryFilterSchema,
  TimeMachineReconstructionSchema,
  WhatIfScenarioInputSchema,
  WhatIfSimulationResultSchema
} from '../../contracts/familyOfficeContracts';
import { SQLiteFamilyHealthRepository } from '../../repositories/SQLiteFamilyHealthRepository';
import { SQLiteFamilyTimelineRepository } from '../../repositories/SQLiteFamilyTimelineRepository';

export async function runSprint8c0Tests() {
  console.log('\n--- Running Sprint 8C.0 Invariant Tests (Contracts, Zod Schemas & Migration 019) ---');

  const healthRepo = new SQLiteFamilyHealthRepository(db);
  const timelineRepo = new SQLiteFamilyTimelineRepository(db);

  // Setup test family IDs
  const TEST_FAM_A = 901;
  const TEST_FAM_B = 902;

  // Cleanup before tests
  healthRepo.deleteSnapshotsByFamily(TEST_FAM_A);
  healthRepo.deleteSnapshotsByFamily(TEST_FAM_B);
  timelineRepo.purgeFamilyTimeline(TEST_FAM_A);
  timelineRepo.purgeFamilyTimeline(TEST_FAM_B);

  // Ensure test family exists in families table if needed
  try {
    db.prepare(`INSERT OR IGNORE INTO families (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`).run(TEST_FAM_A, 'Family 8C Test A');
    db.prepare(`INSERT OR IGNORE INTO families (id, name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`).run(TEST_FAM_B, 'Family 8C Test B');
  } catch (e) {
    // Ignore if families table has different constraints
  }

  // ==========================================================================
  // 1. ZOD CONTRACT VALIDATION & REJECTION INVARIANTS
  // ==========================================================================

  // 1.1 Valid FFH Pillar Score
  const validPillar = FFHPillarScoreSchema.parse({
    pillar: 'PROTECTION',
    score: 85.5,
    weight: 0.25,
    weightedContribution: 21.375,
    status: 'COMPLETE',
    calculationVersion: '2026.1',
    authoritativeEngine: 'DigitalTwinService',
    metrics: { termCover: 30000000, hlvTarget: 25000000 }
  });
  assert.strictEqual(validPillar.score, 85.5);
  assert.strictEqual(validPillar.status, 'COMPLETE');
  console.log('  [PASS] FFHPillarScoreSchema parses valid complete pillar score');

  // 1.2 FFH Out-of-bounds Score Rejection
  assert.throws(() => {
    FFHPillarScoreSchema.parse({
      pillar: 'LIQUIDITY',
      score: 105.0, // Invalid: > 100
      weight: 0.20,
      weightedContribution: 21.0,
      status: 'COMPLETE',
      authoritativeEngine: 'DigitalTwinService'
    });
  }, /Number must be less than or equal to 100/);
  console.log('  [PASS] FFHPillarScoreSchema rejects out-of-bounds score (> 100)');

  // 1.3 Full Family Financial Health Schema Validation
  const validFFH = FamilyFinancialHealthSchema.parse({
    familyId: TEST_FAM_A,
    overallScore: 82.4,
    overallStatus: 'COMPLETE',
    completenessScore: 0.95,
    lifeStage: 'FAMILY_EXPANSION',
    weights: {
      protection: 0.25,
      liquidity: 0.20,
      goals: 0.20,
      estate: 0.15,
      taxAndData: 0.20
    },
    pillars: {
      protection: validPillar,
      liquidity: {
        pillar: 'LIQUIDITY',
        score: 75.0,
        weight: 0.20,
        weightedContribution: 15.0,
        status: 'COMPLETE',
        calculationVersion: '2026.1',
        authoritativeEngine: 'DigitalTwinService',
        metrics: { monthsRunway: 5.5 }
      },
      goals: {
        pillar: 'GOALS',
        score: 90.0,
        weight: 0.20,
        weightedContribution: 18.0,
        status: 'COMPLETE',
        calculationVersion: '2026.1',
        authoritativeEngine: 'GoalPlanningService',
        metrics: { goalsOnTrack: 2 }
      },
      estate: {
        pillar: 'ESTATE',
        score: 65.0,
        weight: 0.15,
        weightedContribution: 9.75,
        status: 'PARTIAL',
        calculationVersion: '2026.1',
        authoritativeEngine: 'EstateHealthService',
        metrics: { willRegistered: false, nomineeCoveragePct: 80 }
      },
      taxAndData: {
        pillar: 'TAX_AND_DATA',
        score: 91.5,
        weight: 0.20,
        weightedContribution: 18.3,
        status: 'COMPLETE',
        calculationVersion: '2026.1',
        authoritativeEngine: 'TaxCalculationEngine',
        metrics: { section80CUtilized: 150000 }
      }
    },
    stateHash: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
    calculationVersion: '2026.1',
    asOfDate: '2026-08-23T00:00:00.000Z'
  });
  assert.strictEqual(validFFH.overallScore, 82.4);
  assert.strictEqual(validFFH.lifeStage, 'FAMILY_EXPANSION');
  console.log('  [PASS] FamilyFinancialHealthSchema parses 5-pillar composite structure');

  // 1.4 Timeline Event Schema Validation & Serialization
  const validTimelineEvent = TimelineEventSchema.parse({
    eventId: 'evt_tx_12345',
    familyId: TEST_FAM_A,
    domain: 'PORTFOLIO',
    eventType: 'TRANSACTION_MAJOR',
    sourceType: 'transactions',
    sourceId: '12345',
    title: 'Mutual Fund Purchase of ₹1,50,000',
    description: 'Parag Parikh Flexi Cap Fund Direct Growth',
    amount: 150000,
    amountType: 'BUY',
    currency: 'INR',
    familyMemberId: 1,
    eventDate: '2026-08-15',
    importanceTier: 'HIGH',
    metadata: { isin: 'INF879O01018', folionumber: '12345' }
  });
  assert.strictEqual(validTimelineEvent.domain, 'PORTFOLIO');
  assert.strictEqual(validTimelineEvent.amount, 150000);
  console.log('  [PASS] TimelineEventSchema parses event and validates domain enum');

  // 1.5 What-If Parameter Validation Rejections
  assert.throws(() => {
    WhatIfScenarioInputSchema.parse({
      monthlySipAmount: -5000 // Invalid: negative
    });
  }, /Number must be greater than or equal to 0/);

  assert.throws(() => {
    WhatIfScenarioInputSchema.parse({
      targetRetirementAge: 25 // Invalid: < 35
    });
  }, /Number must be greater than or equal to 35/);

  assert.throws(() => {
    WhatIfScenarioInputSchema.parse({
      sipStepUpPercent: 150 // Invalid: > 100
    });
  }, /Number must be less than or equal to 100/);
  console.log('  [PASS] WhatIfScenarioInputSchema strictly rejects negative amounts and invalid boundaries');

  // 1.6 Time Machine Reconstruction Schema & Completeness Verification
  const validTimeMachine = TimeMachineReconstructionSchema.parse({
    familyId: TEST_FAM_A,
    asOfDate: '2024-03-31',
    netWorth: 4500000,
    grossAssets: 5000000,
    totalLiabilities: 500000,
    holdings: [
      {
        assetId: 101,
        assetName: 'HDFC Bank Ltd',
        assetClass: 'Equity',
        units: 100,
        unitPrice: 1450,
        priceDate: '2024-03-28',
        valuationType: 'MARKET_VALUE',
        provenance: 'EXACT_HISTORICAL',
        totalMarketValue: 145000,
        currency: 'INR',
        isEstimate: false
      }
    ],
    cashBalances: { 'HDFC_Savings_9901': 350000 },
    liabilitiesBreakdown: { 'Home_Loan_Principal': 500000 },
    protectionShield: {
      totalSumAssured: 10000000,
      activePolicyCount: 1,
      policies: []
    },
    domains: {
      portfolio: { domain: 'PORTFOLIO', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: [] },
      protection: { domain: 'PROTECTION', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: [] },
      liquidity: { domain: 'LIQUIDITY', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: [] },
      goals: { domain: 'GOALS', status: 'PARTIAL', coveragePct: 50, missingDataReasons: [], sourceTables: [] },
      estate: { domain: 'ESTATE', status: 'PARTIAL', coveragePct: 50, missingDataReasons: [], sourceTables: [] },
      tax: { domain: 'TAX', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: [] }
    },
    overallStatus: 'PARTIAL',
    completenessScore: 0.85,
    provenanceBreakdown: {
      EXACT_HISTORICAL: 1,
      CALCULATED: 1,
      KNOWN_ACQUISITION_COST: 0
    },
    stateHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    calculationVersion: '2026.1',
    reconstructedAt: '2026-08-23T00:00:00.000Z'
  });
  assert.strictEqual(validTimeMachine.overallStatus, 'PARTIAL');
  assert.strictEqual(validTimeMachine.completenessScore, 0.85);
  assert.strictEqual(validTimeMachine.provenanceBreakdown['EXACT_HISTORICAL'], 1);

  // Completeness score bounds rejection
  assert.throws(() => {
    TimeMachineReconstructionSchema.parse({
      ...validTimeMachine,
      completenessScore: 1.5 // Invalid: > 1
    });
  }, /Number must be less than or equal to 1/);
  console.log('  [PASS] TimeMachineReconstructionSchema strictly validates overallStatus, completenessScore (0..1), and provenance');

  // ==========================================================================
  // 2. MIGRATION 019 SCHEMA & CONSTRAINTS VERIFICATION
  // ==========================================================================

  // Check family_health_history table and indexes
  const healthTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='family_health_history'").get();
  assert.ok(healthTable, 'family_health_history table must exist');

  const healthIndexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='family_health_history'").all() as Array<{ name: string }>;
  const healthIndexNames = healthIndexes.map(i => i.name);
  assert.ok(healthIndexNames.includes('idx_health_hist_fam_date'), 'idx_health_hist_fam_date must exist');
  assert.ok(healthIndexNames.includes('idx_health_hist_fam_hash'), 'idx_health_hist_fam_hash must exist');
  console.log('  [PASS] Migration 019: family_health_history table and indexes verified');

  // Check family_timeline_events table and indexes
  const timelineTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='family_timeline_events'").get();
  assert.ok(timelineTable, 'family_timeline_events table must exist');

  const timelineIndexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='family_timeline_events'").all() as Array<{ name: string }>;
  const timelineIndexNames = timelineIndexes.map(i => i.name);
  assert.ok(timelineIndexNames.includes('idx_timeline_fam_date'), 'idx_timeline_fam_date must exist');
  assert.ok(timelineIndexNames.includes('idx_timeline_fam_domain'), 'idx_timeline_fam_domain must exist');
  assert.ok(timelineIndexNames.includes('idx_timeline_fam_source'), 'idx_timeline_fam_source must exist');
  console.log('  [PASS] Migration 019: family_timeline_events table and composite indexes verified');

  // ==========================================================================
  // 3. REPOSITORY CRUD & CONCURRENCY DEDUPLICATION INVARIANTS
  // ==========================================================================

  // 3.1 Health Snapshot Persistence & Deduplication
  const snap1 = healthRepo.saveSnapshot({
    family_id: TEST_FAM_A,
    overall_score: 80.0,
    pillar_scores_json: JSON.stringify(validFFH.pillars),
    life_stage: 'FAMILY_EXPANSION',
    weights_json: JSON.stringify(validFFH.weights),
    completeness_score: 0.90,
    state_hash: 'hash_test_123',
    calculation_version: '2026.1',
    snapshot_period: '2026-08',
    as_of_date: '2026-08-01T00:00:00.000Z'
  });
  assert.strictEqual(snap1.overall_score, 80.0);
  assert.strictEqual(snap1.snapshot_period, '2026-08');

  // Concurrency duplicate write with same (family_id, snapshot_period, state_hash) updates existing row
  const snap1Update = healthRepo.saveSnapshot({
    family_id: TEST_FAM_A,
    overall_score: 82.5, // Updated score
    pillar_scores_json: JSON.stringify(validFFH.pillars),
    life_stage: 'FAMILY_EXPANSION',
    weights_json: JSON.stringify(validFFH.weights),
    completeness_score: 0.95,
    state_hash: 'hash_test_123',
    calculation_version: '2026.1',
    snapshot_period: '2026-08',
    as_of_date: '2026-08-01T00:00:00.000Z'
  });
  assert.strictEqual(snap1Update.id, snap1.id, 'Idempotent snapshot update must not create duplicate row');
  assert.strictEqual(snap1Update.overall_score, 82.5);
  console.log('  [PASS] SQLiteFamilyHealthRepository enforces UNIQUE(family_id, snapshot_period, state_hash)');

  // 3.2 Latest Snapshot & History Pagination
  healthRepo.saveSnapshot({
    family_id: TEST_FAM_A,
    overall_score: 85.0,
    pillar_scores_json: JSON.stringify(validFFH.pillars),
    life_stage: 'FAMILY_EXPANSION',
    weights_json: JSON.stringify(validFFH.weights),
    completeness_score: 0.95,
    state_hash: 'hash_test_456',
    calculation_version: '2026.1',
    snapshot_period: '2026-09',
    as_of_date: '2026-09-01T00:00:00.000Z'
  });

  const latestSnap = healthRepo.getLatestSnapshot(TEST_FAM_A);
  assert.ok(latestSnap !== null);
  assert.strictEqual(latestSnap.overall_score, 85.0);
  assert.strictEqual(latestSnap.snapshot_period, '2026-09');

  const history = healthRepo.getSnapshotHistory(TEST_FAM_A, 10);
  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0].snapshot_period, '2026-09');
  assert.strictEqual(history[1].snapshot_period, '2026-08');
  console.log('  [PASS] SQLiteFamilyHealthRepository retrieves latest and paginated chronological history');

  // 3.3 Timeline Event Upsert & Atomic Batch Upsert
  const event1 = timelineRepo.upsertEvent({
    family_id: TEST_FAM_A,
    event_id: 'evt_ins_101',
    domain: 'PROTECTION',
    event_type: 'INSURANCE_MILESTONE',
    source_type: 'insurance_policies',
    source_id: '101',
    title: 'Max Life Term Insurance Activated',
    amount: 30000000,
    amount_type: 'SUM_ASSURED',
    currency: 'INR',
    event_date: '2026-07-01',
    importance_tier: 'CRITICAL'
  });
  assert.strictEqual(event1.event_id, 'evt_ins_101');
  assert.strictEqual(event1.title, 'Max Life Term Insurance Activated');

  // Atomic batch upsert inside transaction
  timelineRepo.batchUpsertEvents([
    {
      family_id: TEST_FAM_A,
      event_id: 'evt_goal_201',
      domain: 'GOAL',
      event_type: 'GOAL_MILESTONE',
      source_type: 'financial_goals',
      source_id: '201',
      title: 'Retirement 2045 Goal Created',
      amount: 50000000,
      amount_type: 'TARGET',
      event_date: '2026-07-15',
      importance_tier: 'HIGH'
    },
    {
      family_id: TEST_FAM_A,
      event_id: 'evt_tax_301',
      domain: 'TAX',
      event_type: 'TAX_MILESTONE',
      source_type: 'tax_deductions',
      source_id: '301',
      title: 'Section 80C Limit Fully Maximized',
      amount: 150000,
      amount_type: 'DEDUCTION',
      event_date: '2026-08-01',
      importance_tier: 'MEDIUM'
    }
  ]);

  const timelineQuery = timelineRepo.getTimeline(TEST_FAM_A, { limit: 10 });
  assert.strictEqual(timelineQuery.total, 3);
  assert.strictEqual(timelineQuery.events.length, 3);
  // Chronological ordering check: newest eventDate first
  assert.strictEqual(timelineQuery.events[0].event_date, '2026-08-01');
  assert.strictEqual(timelineQuery.events[1].event_date, '2026-07-15');
  assert.strictEqual(timelineQuery.events[2].event_date, '2026-07-01');
  console.log('  [PASS] SQLiteFamilyTimelineRepository atomic batch upsert & chronological ordering verified');

  // Domain filtering check
  const protTimeline = timelineRepo.getTimeline(TEST_FAM_A, { domain: 'PROTECTION' });
  assert.strictEqual(protTimeline.total, 1);
  assert.strictEqual(protTimeline.events[0].event_id, 'evt_ins_101');
  console.log('  [PASS] SQLiteFamilyTimelineRepository domain filtering verified');

  // ==========================================================================
  // 4. CROSS-FAMILY ISOLATION & SOURCE COLLISION TESTS
  // ==========================================================================

  // Insert identical sourceId on Family B
  timelineRepo.upsertEvent({
    family_id: TEST_FAM_B,
    event_id: 'evt_ins_101', // Same event_id string on different family
    domain: 'PROTECTION',
    event_type: 'INSURANCE_MILESTONE',
    source_type: 'insurance_policies',
    source_id: '101',
    title: 'Family B Separate Insurance Policy',
    amount: 10000000,
    event_date: '2026-07-01',
    importance_tier: 'HIGH'
  });

  // Query Family A timeline must NOT return Family B's event
  const famATimeline = timelineRepo.getTimeline(TEST_FAM_A);
  assert.strictEqual(famATimeline.total, 3);
  assert.ok(!famATimeline.events.some(e => e.title === 'Family B Separate Insurance Policy'));

  // Delete sourceId on Family A must NOT affect Family B
  timelineRepo.deleteBySource(TEST_FAM_A, 'insurance_policies', '101');
  
  const famBCheck = timelineRepo.findByEventId(TEST_FAM_B, 'evt_ins_101');
  assert.ok(famBCheck !== null, 'Family B event must remain untouched when Family A deletes source');
  assert.strictEqual(famBCheck.title, 'Family B Separate Insurance Policy');

  const famACheck = timelineRepo.findByEventId(TEST_FAM_A, 'evt_ins_101');
  assert.strictEqual(famACheck, null, 'Family A event must be deleted');
  console.log('  [PASS] Cross-Family Isolation: Source ID collisions and scoped deletion verified');

  // Purge Family A must NOT affect Family B
  timelineRepo.purgeFamilyTimeline(TEST_FAM_A);
  assert.strictEqual(timelineRepo.getTimeline(TEST_FAM_A).total, 0);
  assert.strictEqual(timelineRepo.getTimeline(TEST_FAM_B).total, 1);
  console.log('  [PASS] Cross-Family Isolation: purgeFamilyTimeline operates strictly on authorized familyId');

  // Cleanup test families
  healthRepo.deleteSnapshotsByFamily(TEST_FAM_A);
  healthRepo.deleteSnapshotsByFamily(TEST_FAM_B);
  timelineRepo.purgeFamilyTimeline(TEST_FAM_A);
  timelineRepo.purgeFamilyTimeline(TEST_FAM_B);

  console.log('Sprint 8C.0 Invariant Test Summary: 12 passed, 0 failed\n');
  return { passed: 12, failed: 0 };
}
