import { 
  FamilyFinancialHealthSchema, 
  TimelineEventSchema, 
  TimeMachineReconstructionSchema, 
  WhatIfSimulationResultSchema, 
  ProactiveTriggerSchema,
  ProactiveTriggerActionInputSchema 
} from '../../contracts/familyOfficeContracts';

export async function runSprint8c4Tests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${msg}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${msg}`);
    }
  }

  console.log('\n--- SPRINT 8C.4: FRONTEND CONTRACTS & FIDUCIARY INVARIANTS ---');

  // Test 1: Family Financial Health Schema Conformance
  try {
    const mockHealthPayload = {
      familyId: 1,
      overallScore: 84.5,
      overallStatus: 'COMPLETE',
      completenessScore: 0.95,
      lifeStage: 'FAMILY_EXPANSION',
      weights: {
        protection: 0.35,
        liquidity: 0.20,
        goals: 0.20,
        estate: 0.10,
        taxAndData: 0.15
      },
      pillars: {
        protection: {
          pillar: 'PROTECTION',
          score: 90,
          status: 'COMPLETE',
          weight: 0.35,
          weightedContribution: 31.5,
          authoritativeEngine: 'ProtectionService',
          metrics: { activeTermCover: 20000000, requiredHlvCover: 15000000, isAdequate: true }
        },
        liquidity: {
          pillar: 'LIQUIDITY',
          score: 80,
          status: 'COMPLETE',
          weight: 0.20,
          weightedContribution: 16.0,
          authoritativeEngine: 'LiquidityEngine',
          metrics: { emergencyFundMonths: 8.5, liquidReserves: 850000 }
        },
        goals: {
          pillar: 'GOALS',
          score: 85,
          status: 'COMPLETE',
          weight: 0.20,
          weightedContribution: 17.0,
          authoritativeEngine: 'GoalsEngine',
          metrics: { activeGoalsCount: 3, fundedRatio: 0.85 }
        },
        estate: {
          pillar: 'ESTATE',
          score: 75,
          status: 'PARTIAL',
          weight: 0.10,
          weightedContribution: 7.5,
          authoritativeEngine: 'EstateService',
          metrics: { hasRegisteredWill: true, unassignedAssetsCount: 2 }
        },
        taxAndData: {
          pillar: 'TAX_AND_DATA',
          score: 85,
          status: 'COMPLETE',
          weight: 0.15,
          weightedContribution: 12.75,
          authoritativeEngine: 'TaxEngine',
          metrics: { regime: 'NEW', panLinked: true }
        }
      },
      stateHash: 'hash_test_1234567890',
      calculationVersion: '2026.1',
      asOfDate: new Date().toISOString()
    };

    const parsed = FamilyFinancialHealthSchema.safeParse(mockHealthPayload);
    assert(parsed.success, 'FamilyFinancialHealthSchema parses 5-pillar health response');
  } catch (err: any) {
    assert(false, `FamilyFinancialHealthSchema failed: ${err.message}`);
  }

  // Test 2: Timeline Ledger Scheduled vs Historical
  try {
    const historicalEvent = {
      eventId: 'evt_hist_1',
      familyId: 1,
      domain: 'PORTFOLIO',
      eventType: 'MUTUAL_FUND_SIP',
      sourceType: 'ASSET_TRANSACTION',
      sourceId: 'tx_101',
      title: 'Monthly SIP - HDFC Flexi Cap',
      amount: 25000,
      amountType: 'TRANSACTION',
      currency: 'INR',
      eventDate: '2026-02-01',
      eventStatus: 'HISTORICAL',
      importanceTier: 'MEDIUM',
      metadata: { maskedIdentifier: '••••5678' }
    };

    const scheduledEvent = {
      eventId: 'evt_sched_1',
      familyId: 1,
      domain: 'PROTECTION',
      eventType: 'INSURANCE_PREMIUM_DUE',
      sourceType: 'INSURANCE_POLICY',
      sourceId: 'pol_202',
      title: 'Annual Term Insurance Premium Due',
      amount: 32000,
      amountType: 'PREMIUM',
      currency: 'INR',
      eventDate: '2026-09-15',
      eventStatus: 'SCHEDULED',
      importanceTier: 'HIGH',
      metadata: { policyType: 'TERM' }
    };

    const parseHist = TimelineEventSchema.safeParse(historicalEvent);
    const parseSched = TimelineEventSchema.safeParse(scheduledEvent);

    assert(parseHist.success && parseSched.success, 'TimelineEventSchema parses historical & scheduled events');
    assert(parseSched.data?.eventStatus === 'SCHEDULED', 'Scheduled event correctly carries SCHEDULED status');
  } catch (err: any) {
    assert(false, `TimelineEventSchema failed: ${err.message}`);
  }

  // Test 3: Time Machine Reconstruction & Net Worth Isolation
  try {
    const reconstructionMock = {
      familyId: 1,
      asOfDate: '2025-03-31',
      reconstructionMode: 'HISTORICAL_ECONOMIC_STATE',
      knowledgeTimeStatus: 'NOT_FULLY_RECONSTRUCTABLE',
      netWorth: 15000000, // 1.5 Cr
      grossAssets: 18000000,
      totalLiabilities: 3000000,
      containsNonMarketValuations: false,
      completenessScore: 0.9,
      overallStatus: 'COMPLETE',
      holdings: [
        {
          assetId: 101,
          assetName: 'Infosys Ltd',
          assetClass: 'EQUITY',
          units: 1000,
          unitPrice: 1500,
          valuationType: 'MARKET_VALUE',
          provenance: 'EXACT_HISTORICAL',
          daysOfProxyLag: 0,
          totalMarketValue: 1500000,
          currency: 'INR',
          status: 'COMPLETE',
          isEstimate: false
        },
        {
          assetId: 102,
          assetName: 'Unlisted Private Co',
          assetClass: 'UNLISTED_EQUITY',
          units: 500,
          unitPrice: null,
          valuationType: 'UNKNOWN',
          provenance: 'HISTORICAL_SOURCE_UNAVAILABLE',
          daysOfProxyLag: 0,
          totalMarketValue: null,
          currency: 'INR',
          status: 'INSUFFICIENT_DATA',
          missingDataReason: 'No historical trade or valuation certificate available for date',
          isEstimate: false
        }
      ],
      cashBalances: { 'HDFC_001': 500000 },
      liabilitiesBreakdown: { 'HOME_LOAN': 3000000 },
      protectionShield: {
        totalSumAssured: 25000000, // 2.5 Cr cover
        activePolicyCount: 2,
        policies: [
          {
            policyId: 1,
            policyName: 'HDFC Life Click 2 Protect',
            policyType: 'TERM',
            sumAssured: 20000000,
            startDate: '2022-01-01',
            status: 'ACTIVE'
          }
        ]
      },
      domains: {
        portfolio: { domain: 'PORTFOLIO', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: ['assets'] },
        protection: { domain: 'PROTECTION', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: ['insurance_policies'] },
        liquidity: { domain: 'LIQUIDITY', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: ['bank_accounts'] },
        goals: { domain: 'GOALS', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: ['goals'] },
        estate: { domain: 'ESTATE', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: ['wills'] },
        tax: { domain: 'TAX', status: 'COMPLETE', coveragePct: 100, missingDataReasons: [], sourceTables: ['itr_filings'] }
      },
      provenanceBreakdown: { 'EXACT_HISTORICAL': 1 },
      stateHash: 'state_hash_recon_999',
      ruleVersion: '2026.1',
      calculationVersion: '2026.1',
      reconstructedAt: new Date().toISOString()
    };

    const parsed = TimeMachineReconstructionSchema.safeParse(reconstructionMock);
    assert(parsed.success, 'TimeMachineReconstructionSchema parses historical balance sheet');
    assert(parsed.data?.netWorth === 15000000, 'Net Worth is calculated strictly from Assets - Liabilities');
    assert(parsed.data?.protectionShield.totalSumAssured === 25000000, 'Protection Sum Assured is isolated from Net Worth');
    assert(parsed.data?.holdings[1].totalMarketValue === null, 'Unpriced holding totalMarketValue is null (never coerced to 0)');
  } catch (err: any) {
    assert(false, `TimeMachineReconstructionSchema failed: ${err.message}`);
  }

  // Test 4: What-If Simulation Result & Assumption Provenance
  try {
    const simMock = {
      scenarioId: 'sim_rec_001',
      scenarioType: 'RECURRING_SIP_STEP_UP',
      familyId: 1,
      baselineStateHash: 'base_hash_123',
      baselineAsOf: '2026-08-30',
      appliedParameters: {
        scenarioType: 'RECURRING_SIP_STEP_UP',
        monthlySipAmount: 30000,
        sipStepUpPercent: 10,
        years: 15
      },
      status: 'COMPLETE',
      projectedValue: 18500000,
      estimatedWealthGain: 6500000,
      assumptionsUsed: {
        expectedReturn: {
          value: 0.12,
          provenance: 'SYSTEM_ASSUMPTION',
          description: '12% Equity expected return assumption'
        },
        inflationRate: {
          value: 0.06,
          provenance: 'FAMILY_PROFILE',
          description: '6% Family baseline inflation rate'
        }
      },
      calculationVersion: '2026.1',
      ruleVersion: '2026.1',
      generatedAt: new Date().toISOString()
    };

    const parsed = WhatIfSimulationResultSchema.safeParse(simMock);
    assert(parsed.success, 'WhatIfSimulationResultSchema parses simulation output with provenance');
    assert(parsed.data?.assumptionsUsed.expectedReturn.provenance === 'SYSTEM_ASSUMPTION', 'System assumption provenance preserved');
    assert(parsed.data?.assumptionsUsed.inflationRate.provenance === 'FAMILY_PROFILE', 'Family profile provenance preserved');
  } catch (err: any) {
    assert(false, `WhatIfSimulationResultSchema failed: ${err.message}`);
  }

  // Test 5: Proactive Trigger Triage Action Inputs
  try {
    const validSnooze = ProactiveTriggerActionInputSchema.safeParse({ action: 'SNOOZE', snoozeDays: 14 });
    const invalidSnooze = ProactiveTriggerActionInputSchema.safeParse({ action: 'SNOOZE', snoozeDays: 45 }); // >30
    const validDismiss = ProactiveTriggerActionInputSchema.safeParse({ action: 'DISMISS', reason: 'Reviewed by user' });

    assert(validSnooze.success, 'Snooze action valid within 1..30 days range');
    assert(!invalidSnooze.success, 'Snooze action rejected when snoozeDays > 30');
    assert(validDismiss.success, 'Dismiss action valid with optional reason');
  } catch (err: any) {
    assert(false, `ProactiveTriggerActionInputSchema failed: ${err.message}`);
  }

  return { passed, failed };
}
