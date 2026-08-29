import crypto from 'crypto';
import Database from 'better-sqlite3';
import { db } from '../../db';
import {
  TimelineDomain,
  TimelineImportance,
  TimelineEvent,
  TimelineQueryFilter,
  TimelineNarrativeMetadata,
  TimelineNarrativeMetadataSchema,
  TimelineEventRow
} from '../../contracts/familyOfficeContracts';
import {
  familyTimelineRepository,
  CreateTimelineEventInput,
  SQLiteFamilyTimelineRepository
} from '../../repositories/SQLiteFamilyTimelineRepository';
import { InsuranceRepository } from '../../repositories/InsuranceRepository';
import { SQLiteEstateRepository } from '../../repositories/SQLiteEstateRepository';
import { SQLiteGoalRepository } from '../../repositories/SQLiteGoalRepository';
import { SQLiteLifeEventRepository } from '../../repositories/SQLiteLifeEventRepository';
import { SQLiteProactiveTriggerRepository } from '../../repositories/SQLiteProactiveTriggerRepository';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { ValidationError } from '../../errors/AppError';

// ============================================================================
// 1. VERSIONED TIMELINE RULE REGISTRY
// ============================================================================

export const TIMELINE_RULE_REGISTRY = {
  VERSION: '2026.1',
  JURISDICTION: 'IN',
  THRESHOLDS: {
    PORTFOLIO_CRITICAL_AMOUNT: {
      value: 1000000, // ₹10 Lakhs
      unit: 'INR',
      description: 'Transactions >= ₹10L are classified as CRITICAL'
    },
    PORTFOLIO_HIGH_AMOUNT: {
      value: 100000, // ₹1 Lakh
      unit: 'INR',
      description: 'Transactions >= ₹1L are classified as HIGH'
    },
    PROTECTION_CRITICAL_COVER: {
      value: 10000000, // ₹1 Crore
      unit: 'INR',
      description: 'Insurance policies with sum assured >= ₹1 Cr are classified as CRITICAL'
    },
    GOAL_HIGH_TARGET: {
      value: 2500000, // ₹25 Lakhs
      unit: 'INR',
      description: 'Goals with target >= ₹25L are classified as HIGH'
    }
  },
  IMPORTANCE_PRECEDENCE: ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const
};

// ============================================================================
// 2. HELPER UTILITIES: CURRENCY FORMATTER, CANONICAL HASHING & MASKING
// ============================================================================

export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 10000000) {
    const cr = absAmount / 10000000;
    const formatted = cr % 1 === 0 ? cr : parseFloat(cr.toFixed(2));
    return `${sign}₹${formatted} Cr`;
  }
  if (absAmount >= 100000) {
    const l = absAmount / 100000;
    const formatted = l % 1 === 0 ? l : parseFloat(l.toFixed(2));
    return `${sign}₹${formatted} L`;
  }

  return `${sign}₹${Math.round(absAmount).toLocaleString('en-IN')}`;
}

export function maskIdentifier(rawId: string | null | undefined): string {
  if (!rawId) return '••••';
  const cleaned = rawId.trim();
  if (cleaned.length <= 4) return `••••${cleaned}`;
  return `••••${cleaned.slice(-4)}`;
}

export function computeSourceStateHash(sourceType: string, economicPayload: Record<string, any>): string {
  // Key-sorted canonical representation excluding volatile timestamps and random IDs
  const sortedKeys = Object.keys(economicPayload).sort();
  const canonicalObj: Record<string, any> = {};
  for (const k of sortedKeys) {
    if (k !== 'updated_at' && k !== 'created_at' && k !== 'sourceObservedAt') {
      canonicalObj[k] = economicPayload[k];
    }
  }
  return crypto.createHash('sha256').update(`${sourceType}:${JSON.stringify(canonicalObj)}`).digest('hex');
}

// ============================================================================
// 3. DETERMINISTIC NARRATIVE HISTORY ENGINE
// ============================================================================

export class TimelineNarrativeEngine {
  public static renderNarrative(event: CreateTimelineEventInput): string {
    let meta: TimelineNarrativeMetadata = {};
    if (event.metadata_json) {
      try {
        const parsedJson = JSON.parse(event.metadata_json);
        const validated = TimelineNarrativeMetadataSchema.safeParse(parsedJson);
        meta = validated.success ? validated.data : parsedJson;
      } catch {
        meta = {};
      }
    }

    const formattedAmount = event.amount !== null && event.amount !== undefined
      ? (event.currency === 'INR' || !event.currency ? formatIndianCurrency(event.amount) : `${event.currency} ${event.amount.toLocaleString()}`)
      : '';

    switch (event.event_type) {
      case 'BUY':
      case 'ASSET_BUY':
        return `${meta.memberDisplayName || 'Family'} acquired ${meta.quantity ? `${meta.quantity} units of ` : ''}${meta.assetDisplayName || event.title}${formattedAmount ? ` for ${formattedAmount}` : ''}.`;
      
      case 'SELL':
      case 'ASSET_SELL':
        return `${meta.memberDisplayName || 'Family'} sold ${meta.quantity ? `${meta.quantity} units of ` : ''}${meta.assetDisplayName || event.title}${formattedAmount ? ` realizing ${formattedAmount}` : ''}.`;

      case 'DIVIDEND':
        return `${meta.memberDisplayName || 'Family'} received dividend of ${formattedAmount} from ${meta.assetDisplayName || event.title}.`;

      case 'INTEREST':
        return `Interest income of ${formattedAmount} credited for ${meta.assetDisplayName || event.title}.`;

      case 'POLICY_ACTIVATED':
        return `${meta.insurerDisplayName || ''} ${meta.policyType || ''} policy activated with ${formattedAmount} coverage (Policy ${meta.maskedIdentifier || '••••'}).`;

      case 'SCHEDULED_PREMIUM_DUE':
        return `Scheduled premium due for ${meta.insurerDisplayName || ''} policy: ${formattedAmount} on ${event.event_date}.`;

      case 'GOAL_CREATED':
        return `Financial goal established: "${event.title}" target of ${formattedAmount} for target year ${meta.targetYear || ''}.`;

      case 'GOAL_HALFWAY_FUNDED':
        return `Goal milestone: "${event.title}" achieved 50% target funding.`;

      case 'GOAL_ACHIEVED':
        return `Goal achieved: "${event.title}" reached 100% target funding.`;

      case 'WILL_REGISTERED':
        return `${meta.memberDisplayName || 'Primary Testator'} registered Will with Sub-Registrar.`;

      case 'TRUST_FORMED':
        return `Family Trust formed: "${event.title}".`;

      case 'NOMINEE_ASSIGNED':
        return `Beneficiary relationship recorded in FamilyWealthOS knowledge graph.`;

      case 'LIFE_EVENT_DECLARED':
        return `Life milestone declared: ${event.title}.`;

      case 'LIFE_EVENT_PROCESSED':
        return `Life milestone: ${event.title} effectively commenced on ${event.event_date}.`;

      case 'TRIGGER_ACKNOWLEDGED':
        return `Fiduciary action: Acknowledged recommendation "${event.title}".`;

      case 'TRIGGER_RESOLVED':
        return `Fiduciary milestone: Recommendation "${event.title}" resolved.`;

      case 'RECOMMENDATION_EXECUTED':
        return `Fiduciary execution: Implemented strategy "${event.title}".`;

      case 'REGIME_SELECTED':
        return `Tax profile updated: Preferred tax regime selected for FY ${meta.financialYear || ''}.`;

      case 'STATUTORY_DEDUCTION_CLAIMED':
        return `Tax deduction claimed under Section ${meta.sectionCode || ''}: ${formattedAmount}.`;

      default:
        return event.description || event.title;
    }
  }
}

// ============================================================================
// 4. CORE SERVICE IMPLEMENTATION
// ============================================================================

export class FamilyTimelineService {
  private database: Database.Database;
  private timelineRepo: SQLiteFamilyTimelineRepository;
  private insuranceRepo: InsuranceRepository;
  private estateRepo: SQLiteEstateRepository;
  private goalRepo: SQLiteGoalRepository;
  private lifeEventRepo: SQLiteLifeEventRepository;
  private proactiveTriggerRepo: SQLiteProactiveTriggerRepository;

  constructor(customDb?: Database.Database, customRepo?: SQLiteFamilyTimelineRepository) {
    this.database = customDb || db;
    this.timelineRepo = customRepo || familyTimelineRepository;
    this.insuranceRepo = new InsuranceRepository(this.database);
    this.estateRepo = new SQLiteEstateRepository(this.database);
    this.goalRepo = new SQLiteGoalRepository(this.database);
    this.lifeEventRepo = new SQLiteLifeEventRepository(this.database);
    this.proactiveTriggerRepo = new SQLiteProactiveTriggerRepository(this.database);
  }

  // --------------------------------------------------------------------------
  // DOMAIN EXTRACTOR 1: PORTFOLIO (transactions, assets)
  // --------------------------------------------------------------------------
  public extractPortfolioEvents(familyId: number, observedAt: string): CreateTimelineEventInput[] {
    const rows = this.database.prepare(`
      SELECT t.id, t.type, t.date, t.quantity, t.price, t.amount, t.narration, t.created_at,
             COALESCE(am.name, a.name, 'Portfolio Asset') as asset_name,
             COALESCE(am.asset_type, a.type, 'EQUITY') as asset_type,
             COALESCE(am.currency, 'INR') as asset_currency,
             t.asset_id,
             fm.id as family_member_id,
             fm.name as member_name
      FROM transactions t
      LEFT JOIN assets a ON t.asset_id = a.id
      LEFT JOIN holdings h ON t.holding_id = h.id
      LEFT JOIN assets_master am ON h.asset_id = am.id
      LEFT JOIN accounts acc ON h.account_id = acc.id
      LEFT JOIN entities e ON acc.entity_id = e.id
      LEFT JOIN family_members fm ON e.family_member_id = fm.id
      WHERE (fm.family_id = ? OR (? = 1 AND fm.family_id IS NULL))
      ORDER BY t.date DESC, t.id DESC
    `).all(familyId, familyId) as any[];

    const events: CreateTimelineEventInput[] = [];

    for (const r of rows) {
      const amount = Math.abs(r.amount);
      const currency = r.asset_currency || 'INR';

      let importanceTier: TimelineImportance = 'MEDIUM';
      if (currency === 'INR' && amount >= TIMELINE_RULE_REGISTRY.THRESHOLDS.PORTFOLIO_CRITICAL_AMOUNT.value) {
        importanceTier = 'CRITICAL';
      } else if (currency === 'INR' && amount >= TIMELINE_RULE_REGISTRY.THRESHOLDS.PORTFOLIO_HIGH_AMOUNT.value) {
        importanceTier = 'HIGH';
      }

      const eventDate = r.date || r.created_at.split('T')[0];
      const dateProvenance = r.date ? 'AUTHORITATIVE_EVENT_DATE' : 'FALLBACK_CREATION_DATE';

      const economicPayload = {
        transactionId: r.id,
        assetId: r.asset_id,
        type: r.type,
        quantity: r.quantity,
        price: r.price,
        amount: r.amount,
        currency
      };
      const sourceStateHash = computeSourceStateHash('transactions', economicPayload);

      const metadata: TimelineNarrativeMetadata = {
        memberDisplayName: r.member_name || undefined,
        assetDisplayName: r.asset_name,
        quantity: r.quantity,
        dateProvenance,
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AUTHORITATIVE_SOURCE'
      };

      const eventId = `evt_PORTFOLIO_transactions_${r.id}_${r.type}`;
      const title = `${r.type} ${r.asset_name}`;
      const description = r.narration || `${r.type} transaction for ${r.asset_name}`;

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: eventId,
        domain: 'PORTFOLIO',
        event_type: r.type,
        source_type: 'transactions',
        source_id: String(r.id),
        title,
        description,
        amount,
        amount_type: 'TRANSACTION',
        currency,
        family_member_id: r.family_member_id || null,
        event_date: eventDate,
        importance_tier: importanceTier,
        metadata_json: JSON.stringify(metadata),
        state_hash: sourceStateHash
      };

      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // DOMAIN EXTRACTOR 2: PROTECTION (insurance_policies)
  // --------------------------------------------------------------------------
  public extractProtectionEvents(familyId: number, observedAt: string): CreateTimelineEventInput[] {
    const policies = this.insuranceRepo.findByFamilyId(familyId);
    const events: CreateTimelineEventInput[] = [];

    for (const p of policies) {
      const masked = maskIdentifier(p.policy_number);
      const isCritical = p.sum_assured >= TIMELINE_RULE_REGISTRY.THRESHOLDS.PROTECTION_CRITICAL_COVER.value;
      const isHigh = p.policy_type === 'TERM' || p.policy_type === 'HEALTH';
      const importanceTier: TimelineImportance = isCritical ? 'CRITICAL' : (isHigh ? 'HIGH' : 'MEDIUM');

      const economicPayload = {
        policyId: p.id,
        policyNumber: p.policy_number,
        policyType: p.policy_type,
        sumAssured: p.sum_assured,
        premiumAmount: p.premium_amount,
        status: p.status
      };
      const sourceStateHash = computeSourceStateHash('insurance_policies', economicPayload);

      // Event 1: Policy Activation (HISTORICAL)
      const activationDate = p.start_date || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
      const activationMeta: TimelineNarrativeMetadata = {
        insurerDisplayName: p.insurer_name,
        policyType: p.policy_type,
        maskedIdentifier: masked,
        dateProvenance: p.start_date ? 'AUTHORITATIVE_EVENT_DATE' : 'FALLBACK_CREATION_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AUTHORITATIVE_SOURCE'
      };

      const activationEvent: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_PROTECTION_insurance_policies_${p.id}_ACTIVATED`,
        domain: 'PROTECTION',
        event_type: 'POLICY_ACTIVATED',
        source_type: 'insurance_policies',
        source_id: String(p.id),
        title: `${p.insurer_name} ${p.policy_type} Policy`,
        description: '',
        amount: p.sum_assured,
        amount_type: 'SUM_ASSURED', // Strictly coverage protection
        currency: 'INR',
        family_member_id: p.policy_holder_id || null,
        event_date: activationDate,
        importance_tier: importanceTier,
        metadata_json: JSON.stringify(activationMeta),
        state_hash: sourceStateHash
      };
      activationEvent.description = TimelineNarrativeEngine.renderNarrative(activationEvent);
      events.push(activationEvent);

      // Event 2: Scheduled Premium Due (SCHEDULED - Single Canonical In-Place Event)
      if (p.next_premium_due_date && p.status === 'ACTIVE') {
        const premiumMeta: TimelineNarrativeMetadata = {
          insurerDisplayName: p.insurer_name,
          policyType: p.policy_type,
          maskedIdentifier: masked,
          dateProvenance: 'AUTHORITATIVE_EVENT_DATE',
          sourceObservedAt: observedAt,
          sourceStateHash,
          provenance: 'AUTHORITATIVE_SOURCE'
        };

        const scheduledEvent: CreateTimelineEventInput = {
          family_id: familyId,
          event_id: `evt_PROTECTION_insurance_policies_${p.id}_SCHEDULED_PREMIUM_DUE`,
          domain: 'PROTECTION',
          event_type: 'SCHEDULED_PREMIUM_DUE',
          source_type: 'insurance_policies',
          source_id: String(p.id),
          title: `Premium Due: ${p.insurer_name}`,
          description: '',
          amount: p.premium_amount,
          amount_type: 'PREMIUM',
          currency: 'INR',
          family_member_id: p.policy_holder_id || null,
          event_date: p.next_premium_due_date,
          importance_tier: 'MEDIUM',
          metadata_json: JSON.stringify(premiumMeta),
          state_hash: sourceStateHash
        };
        scheduledEvent.description = TimelineNarrativeEngine.renderNarrative(scheduledEvent);
        events.push(scheduledEvent);
      }
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // DOMAIN EXTRACTOR 3: GOALS (financial_goals)
  // --------------------------------------------------------------------------
  public extractGoalEvents(familyId: number, observedAt: string): CreateTimelineEventInput[] {
    const goals = this.goalRepo.getGoals(familyId);
    const events: CreateTimelineEventInput[] = [];

    for (const g of goals) {
      const importanceTier: TimelineImportance = g.target_amount >= TIMELINE_RULE_REGISTRY.THRESHOLDS.GOAL_HIGH_TARGET.value
        ? 'HIGH'
        : 'MEDIUM';

      const economicPayload = {
        goalId: g.id,
        title: g.title,
        targetAmount: g.target_amount,
        targetYear: g.target_year,
        currentAllocated: g.current_allocated_amount,
        status: g.status
      };
      const sourceStateHash = computeSourceStateHash('financial_goals', economicPayload);
      const createdDate = g.created_at ? g.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

      // Event 1: Creation Milestone
      const createMeta: TimelineNarrativeMetadata = {
        targetYear: g.target_year,
        dateProvenance: 'FALLBACK_CREATION_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AUTHORITATIVE_SOURCE'
      };

      const createEvent: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_GOAL_financial_goals_${g.id}_CREATED`,
        domain: 'GOAL',
        event_type: 'GOAL_CREATED',
        source_type: 'financial_goals',
        source_id: String(g.id),
        title: g.title,
        description: '',
        amount: g.target_amount,
        amount_type: 'GOAL_TARGET',
        currency: 'INR',
        family_member_id: null,
        event_date: createdDate,
        importance_tier: importanceTier,
        metadata_json: JSON.stringify(createMeta),
        state_hash: sourceStateHash
      };
      createEvent.description = TimelineNarrativeEngine.renderNarrative(createEvent);
      events.push(createEvent);

      // Event 2: Funding Progress Milestones
      if (g.target_amount > 0) {
        const progressRatio = g.current_allocated_amount / g.target_amount;
        if (progressRatio >= 1.0 || g.status === 'ACHIEVED') {
          const achievedMeta: TimelineNarrativeMetadata = {
            targetYear: g.target_year,
            dateProvenance: 'FALLBACK_CREATION_DATE',
            sourceObservedAt: observedAt,
            sourceStateHash,
            provenance: 'AUTHORITATIVE_SOURCE'
          };
          const achievedEvent: CreateTimelineEventInput = {
            family_id: familyId,
            event_id: `evt_GOAL_financial_goals_${g.id}_ACHIEVED`,
            domain: 'GOAL',
            event_type: 'GOAL_ACHIEVED',
            source_type: 'financial_goals',
            source_id: String(g.id),
            title: g.title,
            description: '',
            amount: g.current_allocated_amount,
            amount_type: 'GOAL_TARGET',
            currency: 'INR',
            family_member_id: null,
            event_date: createdDate,
            importance_tier: 'HIGH',
            metadata_json: JSON.stringify(achievedMeta),
            state_hash: sourceStateHash
          };
          achievedEvent.description = TimelineNarrativeEngine.renderNarrative(achievedEvent);
          events.push(achievedEvent);
        } else if (progressRatio >= 0.5) {
          const halfMeta: TimelineNarrativeMetadata = {
            targetYear: g.target_year,
            dateProvenance: 'FALLBACK_CREATION_DATE',
            sourceObservedAt: observedAt,
            sourceStateHash,
            provenance: 'AUTHORITATIVE_SOURCE'
          };
          const halfwayEvent: CreateTimelineEventInput = {
            family_id: familyId,
            event_id: `evt_GOAL_financial_goals_${g.id}_HALFWAY_FUNDED`,
            domain: 'GOAL',
            event_type: 'GOAL_HALFWAY_FUNDED',
            source_type: 'financial_goals',
            source_id: String(g.id),
            title: g.title,
            description: '',
            amount: g.current_allocated_amount,
            amount_type: 'GOAL_TARGET',
            currency: 'INR',
            family_member_id: null,
            event_date: createdDate,
            importance_tier: 'MEDIUM',
            metadata_json: JSON.stringify(halfMeta),
            state_hash: sourceStateHash
          };
          halfwayEvent.description = TimelineNarrativeEngine.renderNarrative(halfwayEvent);
          events.push(halfwayEvent);
        }
      }
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // DOMAIN EXTRACTOR 4: LIFE EVENTS (life_events)
  // --------------------------------------------------------------------------
  public extractLifeEvents(familyId: number, observedAt: string): CreateTimelineEventInput[] {
    const lifeEvents = this.lifeEventRepo.findByFamilyId(familyId);
    const events: CreateTimelineEventInput[] = [];

    for (const le of lifeEvents) {
      if (le.status === 'DISMISSED') continue;

      const economicPayload = {
        lifeEventId: le.id,
        eventType: le.event_type,
        title: le.event_title,
        status: le.status,
        effectiveDate: le.effective_date
      };
      const sourceStateHash = computeSourceStateHash('life_events', economicPayload);

      const eventDate = le.effective_date || (le.declared_at ? le.declared_at.split('T')[0] : le.created_at.split('T')[0]);
      const dateProvenance = le.effective_date ? 'AUTHORITATIVE_EVENT_DATE' : 'FALLBACK_CREATION_DATE';

      const isProcessed = le.status === 'PROCESSED' || le.status === 'VERIFIED';
      const eventType = isProcessed ? 'LIFE_EVENT_PROCESSED' : 'LIFE_EVENT_DECLARED';
      const eventIdSuffix = isProcessed ? 'PROCESSED' : 'DECLARED';

      const meta: TimelineNarrativeMetadata = {
        dateProvenance,
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AUTHORITATIVE_SOURCE'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_LIFE_EVENT_life_events_${le.id}_${eventIdSuffix}`,
        domain: 'LIFE_EVENT',
        event_type: eventType,
        source_type: 'life_events',
        source_id: String(le.id),
        title: le.event_title,
        description: '',
        amount: null,
        amount_type: 'FINANCIAL_IMPACT',
        currency: 'INR',
        family_member_id: le.declared_by_member_id || null,
        event_date: eventDate,
        importance_tier: 'CRITICAL',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // DOMAIN EXTRACTOR 5: ESTATE (wills, trusts, graph_edges)
  // --------------------------------------------------------------------------
  public extractEstateEvents(familyId: number, observedAt: string): CreateTimelineEventInput[] {
    const events: CreateTimelineEventInput[] = [];

    // 1. Wills (AUTHORITATIVE_SOURCE)
    const wills = this.estateRepo.getWills(familyId);
    for (const w of wills) {
      const economicPayload = { willId: w.id, status: w.status, title: w.title };
      const sourceStateHash = computeSourceStateHash('wills', economicPayload);
      const eventDate = w.registered_at || (w.created_at ? w.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);

      const meta: TimelineNarrativeMetadata = {
        memberDisplayName: undefined,
        dateProvenance: w.registered_at ? 'AUTHORITATIVE_EVENT_DATE' : 'FALLBACK_CREATION_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AUTHORITATIVE_SOURCE'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_ESTATE_wills_${w.id}_REGISTERED`,
        domain: 'ESTATE',
        event_type: 'WILL_REGISTERED',
        source_type: 'wills',
        source_id: String(w.id),
        title: w.title || `Will Registration (${w.status})`,
        description: '',
        amount: null,
        amount_type: 'ESTATE_CORPUS',
        currency: 'INR',
        family_member_id: w.testator_id || null,
        event_date: eventDate,
        importance_tier: 'CRITICAL',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    // 2. Trusts (AUTHORITATIVE_SOURCE)
    const trusts = this.estateRepo.getTrusts(familyId);
    for (const t of trusts) {
      const economicPayload = { trustId: t.id, name: t.trust_name, corpus: t.corpus_amount };
      const sourceStateHash = computeSourceStateHash('trusts', economicPayload);
      const eventDate = t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

      const meta: TimelineNarrativeMetadata = {
        dateProvenance: 'FALLBACK_CREATION_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AUTHORITATIVE_SOURCE'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_ESTATE_trusts_${t.id}_FORMED`,
        domain: 'ESTATE',
        event_type: 'TRUST_FORMED',
        source_type: 'trusts',
        source_id: String(t.id),
        title: t.trust_name,
        description: '',
        amount: t.corpus_amount || null,
        amount_type: 'ESTATE_CORPUS',
        currency: 'INR',
        family_member_id: t.settlor_id || null,
        event_date: eventDate,
        importance_tier: 'HIGH',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    // 3. Knowledge Graph Nominee/Beneficiary Links (DERIVED)
    const edgeRows = this.database.prepare(`
      SELECT e.id, e.family_id, e.created_at, r.code as relationship_code,
             sn.label as source_label, tn.label as target_label
      FROM graph_edges e
      JOIN relationship_types r ON e.relationship_type_id = r.id
      JOIN graph_nodes sn ON e.source_node_id = sn.id
      JOIN graph_nodes tn ON e.target_node_id = tn.id
      WHERE (e.family_id = ? OR e.family_id = 1) AND e.status = 'ACTIVE'
        AND r.code IN ('NOMINEE', 'BENEFICIARY')
    `).all(familyId) as any[];

    for (const edge of edgeRows) {
      const economicPayload = { edgeId: edge.id, relationship: edge.relationship_code, source: edge.source_label, target: edge.target_label };
      const sourceStateHash = computeSourceStateHash('graph_edges', economicPayload);
      const eventDate = edge.created_at ? edge.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

      const meta: TimelineNarrativeMetadata = {
        dateProvenance: 'FALLBACK_CREATION_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'DERIVED'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_ESTATE_graph_edges_${edge.id}_NOMINEE`,
        domain: 'ESTATE',
        event_type: 'NOMINEE_ASSIGNED',
        source_type: 'graph_edges',
        source_id: String(edge.id),
        title: `Beneficiary Link: ${edge.source_label} → ${edge.target_label}`,
        description: '',
        amount: null,
        amount_type: null,
        currency: 'INR',
        family_member_id: null,
        event_date: eventDate,
        importance_tier: 'MEDIUM',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // DOMAIN EXTRACTOR 6: TAX (tax_profiles, tax_deductions -> CALCULATED)
  // --------------------------------------------------------------------------
  public extractTaxEvents(familyId: number, observedAt: string): CreateTimelineEventInput[] {
    const events: CreateTimelineEventInput[] = [];

    // Tax Profiles (Regime Selection)
    const profiles = this.database.prepare(`
      SELECT tp.id, tp.financial_year, tp.assessment_year, tp.preferred_regime, tp.created_at, tp.user_id
      FROM tax_profiles tp
      WHERE tp.family_id = ? AND tp.deleted_at IS NULL
    `).all(familyId) as any[];

    for (const p of profiles) {
      const economicPayload = { profileId: p.id, financialYear: p.financial_year, preferredRegime: p.preferred_regime };
      const sourceStateHash = computeSourceStateHash('tax_profiles', economicPayload);
      const eventDate = p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

      const meta: TimelineNarrativeMetadata = {
        financialYear: p.financial_year,
        dateProvenance: 'FALLBACK_CREATION_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'CALCULATED'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_TAX_tax_profiles_${p.id}_REGIME_${p.financial_year}`,
        domain: 'TAX',
        event_type: 'REGIME_SELECTED',
        source_type: 'tax_profiles',
        source_id: String(p.id),
        title: `Tax Regime (${p.preferred_regime}) FY ${p.financial_year}`,
        description: '',
        amount: null,
        amount_type: null,
        currency: 'INR',
        family_member_id: p.user_id || null,
        event_date: eventDate,
        importance_tier: 'HIGH',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    // Tax Deductions Claimed
    const deductions = this.database.prepare(`
      SELECT td.id, td.section, td.claimed_amount, td.created_at, tp.financial_year, tp.user_id
      FROM tax_deductions td
      JOIN tax_profiles tp ON td.tax_profile_id = tp.id
      WHERE td.family_id = ?
    `).all(familyId) as any[];

    for (const d of deductions) {
      const economicPayload = { deductionId: d.id, section: d.section, amount: d.claimed_amount, financialYear: d.financial_year };
      const sourceStateHash = computeSourceStateHash('tax_deductions', economicPayload);
      const eventDate = d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

      const meta: TimelineNarrativeMetadata = {
        sectionCode: d.section,
        financialYear: d.financial_year,
        dateProvenance: 'FALLBACK_CREATION_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'CALCULATED'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_TAX_tax_deductions_${d.id}_SECTION_${d.section}`,
        domain: 'TAX',
        event_type: 'STATUTORY_DEDUCTION_CLAIMED',
        source_type: 'tax_deductions',
        source_id: String(d.id),
        title: `Deduction Section ${d.section}`,
        description: '',
        amount: d.claimed_amount,
        amount_type: 'TAX_DEDUCTION',
        currency: 'INR',
        family_member_id: d.user_id || null,
        event_date: eventDate,
        importance_tier: 'MEDIUM',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // DOMAIN EXTRACTOR 7: AI DECISION (proactive_triggers, ai_audit_trail -> AI_AUDIT)
  // --------------------------------------------------------------------------
  public extractAIDecisionEvents(familyId: number, observedAt: string): CreateTimelineEventInput[] {
    const events: CreateTimelineEventInput[] = [];

    // 1. Acknowledged or Resolved Proactive Triggers
    const triggers = this.proactiveTriggerRepo.getTriggers(familyId);
    for (const trg of triggers) {
      if (trg.status !== 'ACKNOWLEDGED' && trg.status !== 'RESOLVED') continue;

      const economicPayload = {
        triggerId: trg.trigger_id,
        ruleCode: trg.rule_code,
        urgency: trg.urgency,
        status: trg.status,
        headline: trg.headline
      };
      const sourceStateHash = computeSourceStateHash('proactive_triggers', economicPayload);
      const isResolved = trg.status === 'RESOLVED';
      const eventType = isResolved ? 'TRIGGER_RESOLVED' : 'TRIGGER_ACKNOWLEDGED';
      const suffix = isResolved ? 'RESOLVED' : 'ACKNOWLEDGED';
      const eventDate = (isResolved && trg.resolved_at)
        ? trg.resolved_at.split('T')[0]
        : (trg.updated_at ? trg.updated_at.split('T')[0] : trg.created_at.split('T')[0]);

      const meta: TimelineNarrativeMetadata = {
        urgency: trg.urgency,
        dateProvenance: 'AUTHORITATIVE_EVENT_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AI_AUDIT'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_AI_DECISION_proactive_triggers_${trg.trigger_id}_${suffix}`,
        domain: 'AI_DECISION',
        event_type: eventType,
        source_type: 'proactive_triggers',
        source_id: trg.trigger_id,
        title: trg.headline,
        description: trg.rationale,
        amount: null,
        amount_type: 'ESTIMATED_EXPOSURE',
        currency: 'INR',
        family_member_id: null,
        event_date: eventDate,
        importance_tier: trg.urgency === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    // 2. Allow-Listed AI Decision Actions from Audit Trail
    const auditRows = this.database.prepare(`
      SELECT a.id, a.action_id, a.question, a.user_decision, a.created_at
      FROM ai_audit_trail a
      WHERE a.user_decision IN ('AUDITED', 'EXECUTED', 'APPROVED', 'RESOLVED')
      ORDER BY a.id DESC
      LIMIT 20
    `).all() as any[];

    for (const aud of auditRows) {
      const economicPayload = { actionId: aud.action_id, question: aud.question, decision: aud.user_decision };
      const sourceStateHash = computeSourceStateHash('ai_audit_trail', economicPayload);
      const eventDate = aud.created_at ? aud.created_at.split('T')[0] : new Date().toISOString().split('T')[0];

      const meta: TimelineNarrativeMetadata = {
        dateProvenance: 'AUTHORITATIVE_EVENT_DATE',
        sourceObservedAt: observedAt,
        sourceStateHash,
        provenance: 'AI_AUDIT'
      };

      const eventInput: CreateTimelineEventInput = {
        family_id: familyId,
        event_id: `evt_AI_DECISION_ai_audit_trail_${aud.action_id}_EXECUTED`,
        domain: 'AI_DECISION',
        event_type: 'RECOMMENDATION_EXECUTED',
        source_type: 'ai_audit_trail',
        source_id: aud.action_id,
        title: aud.question || 'Fiduciary Strategy Execution',
        description: `Decision: ${aud.user_decision}`,
        amount: null,
        amount_type: null,
        currency: 'INR',
        family_member_id: null,
        event_date: eventDate,
        importance_tier: 'HIGH',
        metadata_json: JSON.stringify(meta),
        state_hash: sourceStateHash
      };
      eventInput.description = TimelineNarrativeEngine.renderNarrative(eventInput);
      events.push(eventInput);
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // SYNCHRONIZATION ORCHESTRATION (Atomic Ingestion with Fail-Closed Behavior)
  // --------------------------------------------------------------------------
  public async syncFamilyTimeline(
    familyId: number
  ): Promise<{ syncedCount: number; durationMs: number }> {
    const startTime = Date.now();
    const observedAt = new Date().toISOString();

    // 1. Extraction Phase across 7 logical domains in-memory
    const currentEvents: CreateTimelineEventInput[] = [];

    try {
      currentEvents.push(...this.extractPortfolioEvents(familyId, observedAt));
      currentEvents.push(...this.extractProtectionEvents(familyId, observedAt));
      currentEvents.push(...this.extractGoalEvents(familyId, observedAt));
      currentEvents.push(...this.extractLifeEvents(familyId, observedAt));
      currentEvents.push(...this.extractEstateEvents(familyId, observedAt));
      currentEvents.push(...this.extractTaxEvents(familyId, observedAt));
      currentEvents.push(...this.extractAIDecisionEvents(familyId, observedAt));
    } catch (err: any) {
      // Fail-closed: Throw error without mutating database
      throw new ValidationError(`Timeline domain extraction failure: ${err.message || String(err)}`);
    }

    // 2. Reconciliation Phase (Single Atomic Transaction in Repository)
    const existingEventIds = this.timelineRepo.getAllEventIds(familyId);
    const currentEventIdSet = new Set(currentEvents.map(e => e.event_id));
    const obsoleteEventIds = existingEventIds.filter(id => !currentEventIdSet.has(id));

    this.timelineRepo.batchReconcileTimeline(familyId, obsoleteEventIds, currentEvents);

    const durationMs = Date.now() - startTime;
    return {
      syncedCount: currentEvents.length,
      durationMs
    };
  }

  // --------------------------------------------------------------------------
  // QUERY & RETRIEVAL ENGINE
  // --------------------------------------------------------------------------
  public getTimeline(
    familyId: number,
    filter?: TimelineQueryFilter
  ): { events: TimelineEvent[]; total: number; limit: number; offset: number } {
    const result = this.timelineRepo.getTimeline(familyId, filter);

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    const mappedEvents: TimelineEvent[] = result.events.map(row => {
      let parsedMeta = {};
      if (row.metadata_json) {
        try {
          parsedMeta = JSON.parse(row.metadata_json);
        } catch {
          parsedMeta = {};
        }
      }

      return {
        eventId: row.event_id,
        familyId: row.family_id,
        domain: row.domain as any,
        eventType: row.event_type,
        sourceType: row.source_type,
        sourceId: row.source_id,
        title: row.title,
        description: row.description,
        amount: row.amount,
        amountType: row.amount_type,
        currency: row.currency,
        familyMemberId: row.family_member_id,
        eventDate: row.event_date,
        eventStatus: row.event_type === 'SCHEDULED_PREMIUM_DUE' ? 'SCHEDULED' : 'HISTORICAL',
        importanceTier: row.importance_tier as any,
        metadata: parsedMeta,
        stateHash: row.state_hash,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return {
      events: mappedEvents,
      total: result.total,
      limit,
      offset
    };
  }
}

export const familyTimelineService = new FamilyTimelineService();
