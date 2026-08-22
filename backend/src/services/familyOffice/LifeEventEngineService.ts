import { db } from '../../db';
import { SQLiteLifeEventRepository, lifeEventRepository, LifeEventRecord } from '../../repositories/SQLiteLifeEventRepository';
import { digitalTwinService } from './DigitalTwinService';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { auditHookService } from '../../infrastructure/audit/AuditHookService';
import {
  LifeEventType,
  LifeEventDeclarationInput,
  LifeEventDeclarationInputSchema,
  LifeEventCandidate,
  LifeEventCandidateSchema,
  LifeEventConsequence,
  LifeEventConsequenceSchema
} from '../../contracts/familyOfficeContracts';
import { NotFoundError, ValidationError, AppError } from '../../errors/AppError';

export class LifeEventEngineService {
  constructor(private repo: SQLiteLifeEventRepository = lifeEventRepository) {}

  /**
   * 1. Declare a Life Event with explicit user input and calculate immediate consequence baseline.
   */
  public async declareLifeEvent(input: LifeEventDeclarationInput): Promise<{
    event: LifeEventRecord;
    consequence: LifeEventConsequence;
  }> {
    // Validate schema
    const validated = LifeEventDeclarationInputSchema.parse(input);

    // Fetch baseline digital twin state for point-in-time provenance
    const twin = await digitalTwinService.getDigitalTwin(validated.familyId);
    const baselineStateHash = twin.metadata.stateHash;
    const baselineAsOf = twin.metadata.asOf;

    // Calculate deterministic consequences
    const consequence = this.calculateConsequence({
      eventId: `temp_${Date.now()}`,
      eventType: validated.eventType,
      familyId: validated.familyId,
      eventDate: validated.eventDate,
      eventTitle: validated.eventTitle,
      evidenceDetails: validated.evidenceDetails || {},
      twinState: twin.state
    });

    // Persist life event record
    const eventRecord = this.repo.create({
      family_id: validated.familyId,
      event_type: validated.eventType,
      event_title: validated.eventTitle,
      status: 'VERIFIED',
      declared_at: new Date().toISOString(),
      effective_date: validated.eventDate,
      declared_by_member_id: validated.declaredByMemberId || null,
      confidence_pct: 100.0,
      evidence_completeness_pct: 100.0,
      event_payload: {
        eventTitle: validated.eventTitle,
        evidenceDetails: validated.evidenceDetails
      },
      evidence_payload: validated.evidenceDetails,
      impact_summary: consequence,
      baseline_state_hash: baselineStateHash,
      baseline_as_of: baselineAsOf,
      rule_version: '2026.1',
      calculation_version: '1.0.0'
    });

    // Update consequence with persisted eventId
    consequence.eventId = `le_${eventRecord.id}`;
    this.repo.updateImpactSummary(eventRecord.id, consequence, baselineStateHash, baselineAsOf);

    // Dispatch Fiduciary Audit Event
    await auditHookService.createAndPublishEvent({
      eventType: 'LIFE_EVENT_DECLARED',
      aggregateType: 'LIFE_EVENT',
      aggregateId: `le_${eventRecord.id}`,
      familyId: validated.familyId,
      payload: {
        eventId: eventRecord.id,
        eventType: eventRecord.event_type,
        eventTitle: eventRecord.event_title,
        effectiveDate: eventRecord.effective_date,
        stateHash: baselineStateHash,
        ruleVersion: '2026.1'
      }
    });

    return {
      event: eventRecord,
      consequence
    };
  }

  /**
   * 2. Evaluate or re-evaluate multi-domain consequences for an existing life event.
   */
  public async evaluateConsequences(eventId: number): Promise<LifeEventConsequence> {
    const event = this.repo.findById(eventId);
    if (!event) {
      throw new NotFoundError(`Life event with ID ${eventId} not found`);
    }

    const twin = await digitalTwinService.getDigitalTwin(event.family_id);
    const eventPayload = JSON.parse(event.event_payload_json || '{}');
    const evidence = JSON.parse(event.evidence_payload_json || '{}');

    const consequence = this.calculateConsequence({
      eventId: `le_${event.id}`,
      eventType: event.event_type,
      familyId: event.family_id,
      eventDate: event.effective_date,
      eventTitle: event.event_title,
      evidenceDetails: evidence,
      twinState: twin.state
    });

    this.repo.updateImpactSummary(event.id, consequence, twin.metadata.stateHash, twin.metadata.asOf);
    return consequence;
  }

  /**
   * 3. Detect prospective life event candidates from transaction & account patterns.
   */
  public async detectCandidates(familyId: number): Promise<LifeEventCandidate[]> {
    const candidates: LifeEventCandidate[] = [];

    // Scan 1: Salary Increase Spike (Income credits in last 90 days)
    try {
      const incomeTxs = db.prepare(`
        SELECT t.* FROM transactions t
        JOIN assets a ON t.asset_id = a.id
        LEFT JOIN family_members fm ON a.family_member_id = fm.id
        WHERE (fm.family_id = ? OR fm.family_id IS NULL)
          AND t.type IN ('CREDIT', 'DIVIDEND', 'INTEREST')
          AND t.amount > 100000
        ORDER BY t.date DESC LIMIT 5
      `).all(familyId) as any[];

      if (incomeTxs.length >= 2) {
        const latestAmt = incomeTxs[0].amount;
        const prevAmt = incomeTxs[1].amount;
        if (latestAmt > prevAmt * 1.15) {
          candidates.push({
            candidateId: `cand_salary_${familyId}_${Date.now()}`,
            familyId,
            eventType: 'SALARY_INCREASE',
            confidencePct: 90,
            detectedAt: new Date().toISOString(),
            triggerSource: 'BANK_TRANSACTION_CREDIT_SPIKE',
            evidence: {
              previousMonthlyCredit: prevAmt,
              latestMonthlyCredit: latestAmt,
              percentageIncrease: Number(((latestAmt - prevAmt) / prevAmt * 100).toFixed(1))
            },
            status: 'DETECTED'
          });
        }
      }
    } catch (err) {
      console.warn('[LifeEventEngineService] Candidate scan 1 error:', err);
    }

    // Scan 2: Insurance Policy Approaching Maturity (within 90 days)
    try {
      const today = new Date().toISOString().split('T')[0];
      const maturingPolicies = db.prepare(`
        SELECT * FROM insurance_policies 
        WHERE family_id = ? AND status = 'ACTIVE' AND maturity_date IS NOT NULL AND maturity_date >= ?
        ORDER BY maturity_date ASC LIMIT 3
      `).all(familyId, today) as any[];

      for (const policy of maturingPolicies) {
        candidates.push({
          candidateId: `cand_maturity_${policy.id}`,
          familyId,
          eventType: 'INSURANCE_MATURITY',
          confidencePct: 95,
          detectedAt: new Date().toISOString(),
          triggerSource: 'INSURANCE_RECORD_MATURITY_SCHEDULE',
          evidence: {
            policyId: policy.id,
            policyNumber: policy.policy_number,
            insurerName: policy.insurer_name,
            maturityDate: policy.maturity_date,
            sumAssured: policy.sum_assured
          },
          status: 'DETECTED'
        });
      }
    } catch (err) {
      console.warn('[LifeEventEngineService] Candidate scan 2 error:', err);
    }

    return candidates.map(c => LifeEventCandidateSchema.parse(c));
  }

  /**
   * 4. Human Fiduciary Approval & State Transition Gate.
   */
  public async processLifeEvent(
    eventId: number,
    decision: 'PROCESS' | 'DISMISS',
    reason?: string
  ): Promise<LifeEventRecord> {
    const event = this.repo.findById(eventId);
    if (!event) {
      throw new NotFoundError(`Life event with ID ${eventId} not found`);
    }

    if (event.status === 'PROCESSED' || event.status === 'DISMISSED') {
      throw new AppError(`Cannot transition event ${eventId} from status ${event.status}`, 409, 'CONFLICT');
    }

    if (decision === 'PROCESS') {
      this.repo.updateStatus(eventId, 'PROCESSED');
      await auditHookService.createAndPublishEvent({
        eventType: 'LIFE_EVENT_PROCESSED',
        aggregateType: 'LIFE_EVENT',
        aggregateId: `le_${event.id}`,
        familyId: event.family_id,
        payload: {
          eventId: event.id,
          eventType: event.event_type,
          status: 'PROCESSED',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      this.repo.updateStatus(eventId, 'DISMISSED', { dismissReason: reason || 'Dismissed by user' });
      await auditHookService.createAndPublishEvent({
        eventType: 'LIFE_EVENT_DISMISSED',
        aggregateType: 'LIFE_EVENT',
        aggregateId: `le_${event.id}`,
        familyId: event.family_id,
        payload: {
          eventId: event.id,
          eventType: event.event_type,
          status: 'DISMISSED',
          reason: reason || 'Dismissed by user',
          timestamp: new Date().toISOString()
        }
      });
    }

    return this.repo.findById(eventId)!;
  }

  // ==========================================================================
  // DETERMINISTIC 10-EVENT CONSEQUENCE FORMULAS
  // ==========================================================================

  private calculateConsequence(params: {
    eventId: string;
    eventType: LifeEventType;
    familyId: number;
    eventDate: string;
    eventTitle: string;
    evidenceDetails: Record<string, any>;
    twinState: any;
  }): LifeEventConsequence {
    const { eventId, eventType, twinState, evidenceDetails } = params;

    let taxImpact = {
      deductionHeadroomDelta: 0,
      taxLiabilityDelta: 0,
      regimeRecommendation: 'UNCHANGED' as 'OLD' | 'NEW' | 'UNCHANGED'
    };

    let protectionImpact = {
      additionalTermCoverRequired: 0,
      additionalHealthCoverRequired: 0
    };

    let cashflowImpact = {
      monthlySurplusDelta: 0,
      recommendedSipAdjustment: 0
    };

    let goalImpact = {
      newGoalsRecommended: [] as string[],
      timelineShiftYears: 0
    };

    let actionSummary = '';
    let suggestedActionPath = '/planning';

    switch (eventType) {
      case 'CHILD_BIRTH':
        protectionImpact.additionalTermCoverRequired = 5000000; // +50L Term cover standard
        protectionImpact.additionalHealthCoverRequired = 500000; // Family Floater add
        cashflowImpact.monthlySurplusDelta = -15000; // Monthly childcare & maintenance buffer
        goalImpact.newGoalsRecommended = ['Higher Education Fund', 'Child Milestone Wealth'];
        actionSummary = 'New child arrival: Recommend upgrading term life shield by ₹50L, adding child to health floater, and initiating an 18-year Higher Education compounding goal.';
        suggestedActionPath = '/planning/goals';
        break;

      case 'MARRIAGE':
        protectionImpact.additionalHealthCoverRequired = 1000000; // Add spouse to Family Floater
        taxImpact.deductionHeadroomDelta = 50000; // Potential joint/HUF assessment headroom
        goalImpact.newGoalsRecommended = ['Spousal Retirement Security', 'Couples Dream Home'];
        actionSummary = 'Marriage milestone: Add spouse to family health floater, recalculate joint emergency reserve, and update Will succession nominees.';
        suggestedActionPath = '/estate';
        break;

      case 'SALARY_INCREASE':
        const salaryBump = Number(evidenceDetails.increaseAmount) || 30000;
        taxImpact.taxLiabilityDelta = Number((salaryBump * 0.3).toFixed(2));
        cashflowImpact.monthlySurplusDelta = Number((salaryBump * 0.7).toFixed(2));
        cashflowImpact.recommendedSipAdjustment = Number((salaryBump * 0.4).toFixed(2));
        protectionImpact.additionalTermCoverRequired = salaryBump * 12 * 10; // 10x annual increment
        goalImpact.timelineShiftYears = -1.5; // Goals accelerate by ~1.5 years
        actionSummary = `Salary increment of ₹${salaryBump.toLocaleString('en-IN')}/mo: Step up active SIPs by ₹${cashflowImpact.recommendedSipAdjustment.toLocaleString('en-IN')}/mo to accelerate retirement timeline by 1.5 years.`;
        suggestedActionPath = '/portfolio';
        break;

      case 'JOB_CHANGE':
        cashflowImpact.monthlySurplusDelta = 0;
        protectionImpact.additionalHealthCoverRequired = 1000000; // Independent cover buffer
        actionSummary = 'Career transition: Ensure continuity of personal term & health coverage during employer group policy transition, and initiate UAN EPF transfer.';
        suggestedActionPath = '/protection';
        break;

      case 'HOME_PURCHASE':
        const loanEmi = Number(evidenceDetails.monthlyEmi) || 50000;
        const loanPrincipal = Number(evidenceDetails.loanAmount) || 5000000;
        taxImpact.deductionHeadroomDelta = 200000; // Section 24(b) interest deduction
        taxImpact.taxLiabilityDelta = -60000; // Tax saved under Old Regime
        taxImpact.regimeRecommendation = 'OLD';
        protectionImpact.additionalTermCoverRequired = loanPrincipal; // Cover debt liability
        cashflowImpact.monthlySurplusDelta = -loanEmi;
        actionSummary = `Home purchase with ₹${loanPrincipal.toLocaleString('en-IN')} loan: Claim up to ₹2L Section 24(b) interest deduction and ensure term life shield covers outstanding debt liability.`;
        suggestedActionPath = '/tax';
        break;

      case 'HOME_LOAN_CLOSURE':
        const freedEmi = Number(evidenceDetails.freedMonthlyEmi) || 45000;
        cashflowImpact.monthlySurplusDelta = freedEmi;
        cashflowImpact.recommendedSipAdjustment = Number((freedEmi * 0.8).toFixed(2));
        goalImpact.timelineShiftYears = -2.0;
        actionSummary = `Home loan closed! ₹${freedEmi.toLocaleString('en-IN')}/mo cashflow freed. Reallocate ₹${cashflowImpact.recommendedSipAdjustment.toLocaleString('en-IN')}/mo into equity SIPs to compound retirement wealth.`;
        suggestedActionPath = '/planning';
        break;

      case 'INSURANCE_MATURITY':
        const maturityValue = Number(evidenceDetails.maturityValue) || 1500000;
        cashflowImpact.monthlySurplusDelta = 0;
        actionSummary = `Insurance policy matured with ₹${maturityValue.toLocaleString('en-IN')} payout (Section 10(10D) tax-exempt). Re-deploy capital across diversified equity and debt allocation.`;
        suggestedActionPath = '/portfolio';
        break;

      case 'RETIREMENT':
        cashflowImpact.monthlySurplusDelta = 0;
        cashflowImpact.recommendedSipAdjustment = -1; // Switch off SIPs, activate SWP
        goalImpact.timelineShiftYears = 0;
        actionSummary = 'Retirement milestone reached: Transition portfolio from accumulation to capital preservation and Systematic Withdrawal Plan (SWP) for tax-efficient monthly income.';
        suggestedActionPath = '/planning/retirement';
        break;

      case 'DEATH_OF_MEMBER':
        protectionImpact.additionalTermCoverRequired = 0;
        actionSummary = 'Emergency protocol activated: Generate comprehensive Insurance Claim, Bank Account Transmission, and Estate Will Succession Dossier.';
        suggestedActionPath = '/estate';
        break;

      case 'MAJOR_INHERITANCE':
        const inheritanceValue = Number(evidenceDetails.assetValue) || 5000000;
        goalImpact.timelineShiftYears = -3.0;
        actionSummary = `Inheritance of ₹${inheritanceValue.toLocaleString('en-IN')} received: Update family asset registry, establish capital gains cost basis, and deploy tax-efficiently.`;
        suggestedActionPath = '/estate';
        break;
    }

    const consequenceObject: LifeEventConsequence = {
      eventId,
      eventType,
      taxImpact,
      protectionImpact,
      cashflowImpact,
      goalImpact,
      actionSummary,
      suggestedActionPath
    };

    return LifeEventConsequenceSchema.parse(consequenceObject);
  }
}

export const lifeEventEngineService = new LifeEventEngineService();
