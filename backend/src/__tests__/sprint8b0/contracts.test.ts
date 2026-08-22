import {
  EventEnvelopeSchema,
  ApiResponseEnvelopeSchema,
  DigitalTwinStateSchema,
  LifeEventDeclarationInputSchema,
  LifeEventCandidateSchema,
  LifeEventConsequenceSchema,
  ProactiveTriggerSchema,
  ExplainabilityLineageSchema
} from '../../contracts/familyOfficeContracts';

export async function runContractsTests(): Promise<{ passed: number; failed: number }> {
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

  console.log('\n--- Running Sprint 8B.0 Data Contracts Tests ---');

  // Test 1: EventEnvelopeSchema validation
  try {
    const validEvent = {
      eventId: 'evt_123',
      eventType: 'LIFE_EVENT_DECLARED',
      aggregateType: 'FAMILY_DIGITAL_TWIN',
      aggregateId: 'fam_1',
      familyId: 1,
      correlationId: 'req_abc123',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      payload: { test: true }
    };
    const parsed = EventEnvelopeSchema.parse(validEvent);
    assert(parsed.eventId === 'evt_123', 'EventEnvelopeSchema parses valid event');
  } catch (err: any) {
    assert(false, `EventEnvelopeSchema failed on valid event: ${err.message}`);
  }

  // Test 2: EventEnvelopeSchema rejects missing familyId
  try {
    EventEnvelopeSchema.parse({
      eventId: 'evt_123',
      eventType: 'LIFE_EVENT_DECLARED',
      aggregateType: 'FAMILY_DIGITAL_TWIN',
      aggregateId: 'fam_1',
      correlationId: 'req_abc123',
      timestamp: new Date().toISOString()
    });
    assert(false, 'EventEnvelopeSchema should fail when missing familyId');
  } catch {
    assert(true, 'EventEnvelopeSchema correctly rejects missing familyId');
  }

  // Test 3: DigitalTwinStateSchema validation
  try {
    const validTwin = {
      familyId: 1,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      dataCompletenessScore: 0.95,
      lineage: {
        members: [{ id: 1, familyId: 1, name: 'Test Member', relationship: 'Head', isPrimaryTestator: true }],
        entities: [],
        relationships: []
      },
      balanceSheet: {
        grossAssets: 5000000,
        totalLiabilities: 1000000,
        netWorth: 4000000,
        liquidReserves: 600000,
        emergencyFundMonths: 6,
        assetDistribution: { Equity: 3000000, Debt: 2000000 }
      },
      protection: {
        activeTermCover: 25000000,
        requiredHlvCover: 20000000,
        hlvGap: 0,
        healthCoverTotal: 1500000,
        isAdequate: true,
        uninsuredMemberIds: []
      },
      trajectory: {
        activeGoals: [],
        retirementTargetCorpus: 30000000,
        projectedRetirementAge: 60,
        savingsRatePct: 35
      },
      governance: {
        fy80CUtilized: 150000,
        fy80CHeadroom: 0,
        projectedTaxLiability: 250000,
        willRegistered: true,
        estateHealthScore: 85,
        unassignedNomineeAssetCount: 0
      }
    };
    DigitalTwinStateSchema.parse(validTwin);
    assert(true, 'DigitalTwinStateSchema validates complete state');
  } catch (err: any) {
    assert(false, `DigitalTwinStateSchema failed: ${err.message}`);
  }

  // Test 4: LifeEventDeclarationInputSchema validation
  try {
    const validDeclaration = {
      familyId: 1,
      eventType: 'CHILD_BIRTH',
      eventTitle: 'Birth of Second Child',
      eventDate: '2026-08-22',
      evidenceDetails: { childName: 'Aarav' }
    };
    const parsed = LifeEventDeclarationInputSchema.parse(validDeclaration);
    assert(parsed.eventType === 'CHILD_BIRTH', 'LifeEventDeclarationInputSchema validates declaration');
  } catch (err: any) {
    assert(false, `LifeEventDeclarationInputSchema failed: ${err.message}`);
  }

  // Test 5: ExplainabilityLineageSchema validation
  try {
    const validLineage = {
      recommendationId: 101,
      ruleCode: 'PROTECTION_TERM_GAP',
      category: 'PROTECTION',
      headline: 'Term Cover Gap Identified',
      detailedWhy: 'Current cover is below HLV requirement',
      evidence: [
        { label: 'Current Cover', value: 10000000, sourceTable: 'insurance_policies', lastUpdated: '2026-08-22' }
      ],
      engineName: 'ProtectionEngineService',
      engineVersion: 'v1.0.0',
      formulaDescription: 'HLV = (Annual Expense * Multiplier) + Liabilities - Liquid Assets',
      mathParameters: { annualExpense: 1200000, multiplier: 20 },
      confidencePct: 98,
      dataFreshnessTimestamp: new Date().toISOString(),
      isDeterministic: true,
      action: {
        label: 'Add Term Policy',
        targetRoute: '/protection'
      }
    };
    ExplainabilityLineageSchema.parse(validLineage);
    assert(true, 'ExplainabilityLineageSchema validates 5-Point Lineage');
  } catch (err: any) {
    assert(false, `ExplainabilityLineageSchema failed: ${err.message}`);
  }

  return { passed, failed };
}
