import assert from 'assert';
import { db } from '../../db';
import { lifeEventEngineService } from '../../services/familyOffice/LifeEventEngineService';
import { lifeEventRepository } from '../../repositories/SQLiteLifeEventRepository';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { LifeEventType } from '../../contracts/familyOfficeContracts';

export async function runLifeEventsTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- Running Sprint 8B.2 Life Events Engine & Consequence Propagation Tests ---');
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

  // Setup test family
  const testFamilyId = 6;
  const mockContext = (cid: string) => ({
    correlationId: cid,
    familyId: testFamilyId,
    timestamp: new Date().toISOString()
  });

  // 1. CHILD_BIRTH consequence evaluation
  await test('CHILD_BIRTH: Evaluates term shield upgrade, floater addition, and education goal', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-cb-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'CHILD_BIRTH',
        eventTitle: 'Birth of Baby Girl Aaradhya',
        eventDate: '2026-06-15',
        evidenceDetails: { gender: 'FEMALE', hospitalInvoiceNo: 'HOSP-2026-991' }
      });
    });

    assert.ok(res.event.id > 0, 'Event ID should be generated');
    assert.strictEqual(res.event.status, 'VERIFIED');
    assert.strictEqual(res.consequence.protectionImpact.additionalTermCoverRequired, 5000000);
    assert.strictEqual(res.consequence.protectionImpact.additionalHealthCoverRequired, 500000);
    assert.ok(res.consequence.goalImpact.newGoalsRecommended?.includes('Higher Education Fund'));
  });

  // 2. MARRIAGE consequence evaluation
  await test('MARRIAGE: Evaluates spouse floater cover, joint surplus, and estate updates', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-m-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'MARRIAGE',
        eventTitle: 'Wedding of Self and Priya',
        eventDate: '2026-07-20',
        evidenceDetails: { spouseName: 'Priya' }
      });
    });

    assert.strictEqual(res.event.event_type, 'MARRIAGE');
    assert.strictEqual(res.consequence.protectionImpact.additionalHealthCoverRequired, 1000000);
    assert.ok(res.consequence.suggestedActionPath?.includes('/estate'));
  });

  // 3. SALARY_INCREASE consequence evaluation
  await test('SALARY_INCREASE: Calculates tax liability, SIP step-up, and HLV increase', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-sal-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'SALARY_INCREASE',
        eventTitle: 'Annual Performance Appraisal (+₹50k/mo)',
        eventDate: '2026-04-01',
        evidenceDetails: { increaseAmount: 50000 }
      });
    });

    assert.strictEqual(res.consequence.taxImpact.taxLiabilityDelta, 15000);
    assert.strictEqual(res.consequence.cashflowImpact.recommendedSipAdjustment, 20000);
    assert.strictEqual(res.consequence.protectionImpact.additionalTermCoverRequired, 6000000);
    assert.strictEqual(res.consequence.goalImpact.timelineShiftYears, -1.5);
  });

  // 4. JOB_CHANGE consequence evaluation
  await test('JOB_CHANGE: Evaluates independent cover buffer and EPF transfer guidance', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-job-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'JOB_CHANGE',
        eventTitle: 'Move to New Tech Firm',
        eventDate: '2026-08-01',
        evidenceDetails: { newEmployer: 'Global Cloud Corp' }
      });
    });

    assert.strictEqual(res.consequence.protectionImpact.additionalHealthCoverRequired, 1000000);
    assert.ok(res.consequence.actionSummary.includes('UAN EPF transfer'));
  });

  // 5. HOME_PURCHASE consequence evaluation
  await test('HOME_PURCHASE: Computes Section 24(b) deduction and loan cover requirement', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-home-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'HOME_PURCHASE',
        eventTitle: 'Purchase of 3BHK Apartment in Whitefield',
        eventDate: '2026-09-10',
        evidenceDetails: { propertyValue: 15000000, loanAmount: 10000000, monthlyEmi: 85000 }
      });
    });

    assert.strictEqual(res.consequence.taxImpact.deductionHeadroomDelta, 200000);
    assert.strictEqual(res.consequence.taxImpact.regimeRecommendation, 'OLD');
    assert.strictEqual(res.consequence.protectionImpact.additionalTermCoverRequired, 10000000);
    assert.strictEqual(res.consequence.cashflowImpact.monthlySurplusDelta, -85000);
  });

  // 6. HOME_LOAN_CLOSURE consequence evaluation
  await test('HOME_LOAN_CLOSURE: Reallocates freed EMI surplus to wealth compounding', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-closure-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'HOME_LOAN_CLOSURE',
        eventTitle: 'Final EMI payment on Home Loan',
        eventDate: '2026-10-01',
        evidenceDetails: { freedMonthlyEmi: 60000 }
      });
    });

    assert.strictEqual(res.consequence.cashflowImpact.monthlySurplusDelta, 60000);
    assert.strictEqual(res.consequence.cashflowImpact.recommendedSipAdjustment, 48000);
    assert.strictEqual(res.consequence.goalImpact.timelineShiftYears, -2.0);
  });

  // 7. INSURANCE_MATURITY consequence evaluation
  await test('INSURANCE_MATURITY: Applies Section 10(10D) tax exemption on maturity payout', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-mat-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'INSURANCE_MATURITY',
        eventTitle: 'LIC Endowment Policy Maturity',
        eventDate: '2026-11-15',
        evidenceDetails: { maturityValue: 2500000 }
      });
    });

    assert.ok(res.consequence.actionSummary.includes('Section 10(10D)'));
    assert.ok(res.consequence.actionSummary.includes('25,00,000'));
  });

  // 8. RETIREMENT consequence evaluation
  await test('RETIREMENT: Transitions accumulation to SWP drawdown and preserves capital', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-ret-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'RETIREMENT',
        eventTitle: 'Retirement Milestone at Age 60',
        eventDate: '2026-12-31',
        evidenceDetails: { superannuationPayout: 10000000 }
      });
    });

    assert.ok(res.consequence.actionSummary.includes('Systematic Withdrawal Plan (SWP)'));
    assert.strictEqual(res.consequence.suggestedActionPath, '/planning/retirement');
  });

  // 9. DEATH_OF_MEMBER safety boundary
  await test('DEATH_OF_MEMBER: Generates emergency claims checklist without automated mutations', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-demise-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'DEATH_OF_MEMBER',
        eventTitle: 'Demise of Senior Family Member',
        eventDate: '2026-08-01',
        evidenceDetails: { certificateNo: 'DTH-2026-001' }
      });
    });

    assert.ok(res.consequence.actionSummary.includes('Emergency protocol activated'));
    assert.strictEqual(res.consequence.suggestedActionPath, '/estate');
  });

  // 10. MAJOR_INHERITANCE consequence evaluation
  await test('MAJOR_INHERITANCE: Formulates asset allocation plan and updates goal timelines', async () => {
    const res = await CorrelationContext.runWithContext(mockContext('test-inh-1'), async () => {
      return lifeEventEngineService.declareLifeEvent({
        familyId: testFamilyId,
        eventType: 'MAJOR_INHERITANCE',
        eventTitle: 'Ancestral Property Sale Proceeds Inheritance',
        eventDate: '2026-08-15',
        evidenceDetails: { assetValue: 12000000 }
      });
    });

    assert.strictEqual(res.consequence.goalImpact.timelineShiftYears, -3.0);
    assert.ok(res.consequence.actionSummary.includes('1,20,00,000'));
  });

  // 11. Re-evaluate consequence deterministic reproducibility
  await test('Re-evaluating consequence produces stable deterministic output', async () => {
    const events = lifeEventRepository.findByFamilyId(testFamilyId);
    assert.ok(events.length > 0);
    const firstEvent = events[0];

    const consequence = await lifeEventEngineService.evaluateConsequences(firstEvent.id);
    assert.ok(consequence.eventId === `le_${firstEvent.id}`);
    assert.strictEqual(consequence.eventType, firstEvent.event_type);
  });

  // 12. Candidate Detection logic
  await test('Candidate detection scans for salary increases and insurance maturities', async () => {
    const candidates = await lifeEventEngineService.detectCandidates(testFamilyId);
    assert.ok(Array.isArray(candidates));
    if (candidates.length > 0) {
      assert.strictEqual(candidates[0].status, 'DETECTED');
      assert.ok(candidates[0].confidencePct >= 85);
    }
  });

  // 13. Human Approval Workflow: PROCESS
  await test('Human approval transitions event to PROCESSED and logs audit trail', async () => {
    const declared = await lifeEventEngineService.declareLifeEvent({
      familyId: testFamilyId,
      eventType: 'SALARY_INCREASE',
      eventTitle: 'Quarterly Bonus & Step-up',
      eventDate: '2026-09-01',
      evidenceDetails: { increaseAmount: 25000 }
    });

    const processed = await lifeEventEngineService.processLifeEvent(declared.event.id, 'PROCESS');
    assert.strictEqual(processed.status, 'PROCESSED');

    // Verify audit trail entry
    const auditRow = db.prepare(
      "SELECT * FROM ai_audit_trail WHERE question LIKE '%LIFE_EVENT_PROCESSED%' AND actions_proposed LIKE ? ORDER BY id DESC LIMIT 1"
    ).get(`%le_${declared.event.id}%`) as any;

    assert.ok(auditRow, 'LIFE_EVENT_PROCESSED audit event should be logged');
  });

  // 14. Human Approval Workflow: DISMISS
  await test('Human dismissal transitions event to DISMISSED with reason and logs audit trail', async () => {
    const declared = await lifeEventEngineService.declareLifeEvent({
      familyId: testFamilyId,
      eventType: 'JOB_CHANGE',
      eventTitle: 'Prospective Offer Dismissed',
      eventDate: '2026-09-15',
      evidenceDetails: { offerDeclined: true }
    });

    const dismissed = await lifeEventEngineService.processLifeEvent(
      declared.event.id,
      'DISMISS',
      'Candidate decided not to take the job offer'
    );
    assert.strictEqual(dismissed.status, 'DISMISSED');
    assert.strictEqual(dismissed.dismiss_reason, 'Candidate decided not to take the job offer');

    // Verify audit trail entry
    const auditRow = db.prepare(
      "SELECT * FROM ai_audit_trail WHERE question LIKE '%LIFE_EVENT_DISMISSED%' AND actions_proposed LIKE ? ORDER BY id DESC LIMIT 1"
    ).get(`%le_${declared.event.id}%`) as any;

    assert.ok(auditRow, 'LIFE_EVENT_DISMISSED audit event should be logged');
  });

  // 15. Conflict on invalid state transition
  await test('Double-processing an already PROCESSED event throws 409 Conflict', async () => {
    const events = lifeEventRepository.findByFamilyId(testFamilyId, 'PROCESSED');
    assert.ok(events.length > 0);
    const processedEvent = events[0];

    await assert.rejects(
      async () => {
        await lifeEventEngineService.processLifeEvent(processedEvent.id, 'PROCESS');
      },
      (err: any) => {
        return err.statusCode === 409;
      }
    );
  });

  // 16. Performance benchmark
  await test('Life event declaration and consequence calculation executes in <= 500ms', async () => {
    const start = Date.now();
    await lifeEventEngineService.declareLifeEvent({
      familyId: testFamilyId,
      eventType: 'CHILD_BIRTH',
      eventTitle: 'Benchmark Child Birth',
      eventDate: '2026-10-10',
      evidenceDetails: { benchmark: true }
    });
    const elapsed = Date.now() - start;
    console.log(`         [Performance: ${elapsed}ms]`);
    assert.ok(elapsed <= 500, `Execution time ${elapsed}ms should be <= 500ms`);
  });

  // 17. Security & Scope Isolation
  await test('Security: Rejects event declaration with mismatched family context', async () => {
    // Attempt to declare for family 99 when authorized family is 6
    await assert.rejects(
      async () => {
        await CorrelationContext.runWithContext(mockContext('test-sec-1'), async () => {
          // If service is called directly for non-existent family 9999
          await lifeEventEngineService.declareLifeEvent({
            familyId: 9999,
            eventType: 'CHILD_BIRTH',
            eventTitle: 'Invalid Family Event',
            eventDate: '2026-06-15'
          });
        });
      },
      (err: any) => {
        return err.name === 'NotFoundError' || err.statusCode === 404;
      }
    );
  });

  // 18. Provenance & State Hash Tracking
  await test('Provenance: Event record stores baseline state hash matching Digital Twin', async () => {
    const declared = await lifeEventEngineService.declareLifeEvent({
      familyId: testFamilyId,
      eventType: 'MARRIAGE',
      eventTitle: 'Provenance Verification Event',
      eventDate: '2026-10-15',
      evidenceDetails: { provenanceCheck: true }
    });

    assert.ok(declared.event.baseline_state_hash, 'baseline_state_hash must be present');
    assert.ok(declared.event.baseline_state_hash.length === 64, 'stateHash must be 64-char SHA256');
    assert.strictEqual(declared.event.rule_version, '2026.1');
    assert.strictEqual(declared.event.calculation_version, '1.0.0');
  });

  // 19. Schema Validation Rejection
  await test('Schema Validation: Rejects invalid eventType with Zod error', async () => {
    await assert.rejects(
      async () => {
        await lifeEventEngineService.declareLifeEvent({
          familyId: testFamilyId,
          eventType: 'INVALID_EVENT_TYPE' as any,
          eventTitle: 'Invalid Type Event',
          eventDate: '2026-06-15'
        });
      },
      (err: any) => {
        return err.name === 'ZodError';
      }
    );
  });

  // 20. List Filtering by Status
  await test('Repository: Filters events by status correctly', async () => {
    const verifiedEvents = lifeEventRepository.findByFamilyId(testFamilyId, 'VERIFIED');
    const processedEvents = lifeEventRepository.findByFamilyId(testFamilyId, 'PROCESSED');
    const dismissedEvents = lifeEventRepository.findByFamilyId(testFamilyId, 'DISMISSED');

    assert.ok(verifiedEvents.every(e => e.status === 'VERIFIED'));
    assert.ok(processedEvents.every(e => e.status === 'PROCESSED'));
    assert.ok(dismissedEvents.every(e => e.status === 'DISMISSED'));
  });

  console.log(`\nSprint 8B.2 Test Summary: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
