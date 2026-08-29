import { z } from 'zod';

// ============================================================================
// 1. GENERIC EVENT & API ENVELOPE CONTRACTS
// ============================================================================

export const EventEnvelopeSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  familyId: z.number().int().positive(),
  correlationId: z.string().min(1),
  causationId: z.string().optional(),
  timestamp: z.string().datetime(),
  version: z.string().default('1.0.0'),
  payload: z.record(z.any())
});

export type EventEnvelope<T = Record<string, any>> = Omit<z.infer<typeof EventEnvelopeSchema>, 'payload'> & {
  payload: T;
};

export const ApiResponseEnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional(),
  metadata: z.record(z.any()).optional(),
  correlationId: z.string().min(1)
});

export type ApiResponseEnvelope<T = any> = Omit<z.infer<typeof ApiResponseEnvelopeSchema>, 'data'> & {
  data?: T;
};

// ============================================================================
// 2. DIGITAL TWIN DOMAIN CONTRACTS
// ============================================================================

export const LineageMemberSchema = z.object({
  id: z.number().int().positive(),
  familyId: z.number().int().positive(),
  name: z.string().min(1),
  relationship: z.string(),
  pan: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  isPrimaryTestator: z.boolean().default(false)
});

export const LegalEntitySchema = z.object({
  id: z.number().int().positive(),
  entityName: z.string().min(1),
  entityType: z.string(),
  registrationNumber: z.string().optional().nullable(),
  pan: z.string().optional().nullable()
});

export const GraphRelationshipSchema = z.object({
  id: z.number().int().positive(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  relationshipType: z.string(),
  properties: z.record(z.any()).optional()
});

export const LineageSchema = z.object({
  members: z.array(LineageMemberSchema),
  entities: z.array(LegalEntitySchema),
  relationships: z.array(GraphRelationshipSchema)
});

export const BalanceSheetSchema = z.object({
  grossAssets: z.number().nonnegative(),
  totalLiabilities: z.number().nonnegative(),
  netWorth: z.number(),
  liquidReserves: z.number().nonnegative(),
  emergencyFundMonths: z.number().nonnegative(),
  assetDistribution: z.record(z.number())
});

export const ProtectionShieldSchema = z.object({
  activeTermCover: z.number().nonnegative(),
  requiredHlvCover: z.number().nonnegative(),
  hlvGap: z.number().nonnegative(),
  healthCoverTotal: z.number().nonnegative(),
  isAdequate: z.boolean(),
  uninsuredMemberIds: z.array(z.number())
});

export const TrajectoryGoalSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  goalType: z.string(),
  targetAmount: z.number().positive(),
  targetYear: z.number().int(),
  currentAllocated: z.number().nonnegative(),
  probabilityScorePct: z.number().min(0).max(100),
  monthlySipRequired: z.number().nonnegative()
});

export const TrajectorySchema = z.object({
  activeGoals: z.array(TrajectoryGoalSchema),
  retirementTargetCorpus: z.number().nonnegative(),
  projectedRetirementAge: z.number().int().positive(),
  savingsRatePct: z.number().min(0).max(100)
});

export const GovernanceSchema = z.object({
  fy80CUtilized: z.number().nonnegative(),
  fy80CHeadroom: z.number().nonnegative(),
  projectedTaxLiability: z.number().nonnegative(),
  willRegistered: z.boolean(),
  estateHealthScore: z.number().min(0).max(100),
  unassignedNomineeAssetCount: z.number().int().nonnegative()
});

export const DigitalTwinStateSchema = z.object({
  familyId: z.number().int().positive(),
  timestamp: z.string().datetime(),
  version: z.string().default('1.0.0'),
  dataCompletenessScore: z.number().min(0).max(1.0),
  lineage: LineageSchema,
  balanceSheet: BalanceSheetSchema,
  protection: ProtectionShieldSchema,
  trajectory: TrajectorySchema,
  governance: GovernanceSchema
});

export type DigitalTwinState = z.infer<typeof DigitalTwinStateSchema>;

// ============================================================================
// 3. LIFE EVENTS CONTRACTS
// ============================================================================

export const LifeEventTypeEnum = z.enum([
  'CHILD_BIRTH',
  'MARRIAGE',
  'SALARY_INCREASE',
  'JOB_CHANGE',
  'HOME_PURCHASE',
  'HOME_LOAN_CLOSURE',
  'INSURANCE_MATURITY',
  'RETIREMENT',
  'DEATH_OF_MEMBER',
  'MAJOR_INHERITANCE'
]);

export type LifeEventType = z.infer<typeof LifeEventTypeEnum>;

export const LifeEventDeclarationInputSchema = z.object({
  familyId: z.number().int().positive(),
  eventType: LifeEventTypeEnum,
  eventTitle: z.string().min(1),
  eventDate: z.string(),
  evidenceDetails: z.record(z.any()).optional().default({}),
  declaredByMemberId: z.number().int().optional()
});

export type LifeEventDeclarationInput = z.input<typeof LifeEventDeclarationInputSchema>;

export const LifeEventCandidateSchema = z.object({
  candidateId: z.string().min(1),
  familyId: z.number().int().positive(),
  eventType: LifeEventTypeEnum,
  confidencePct: z.number().min(0).max(100),
  detectedAt: z.string().datetime(),
  triggerSource: z.string(),
  evidence: z.record(z.any()),
  status: z.enum(['DETECTED', 'VERIFIED', 'PROCESSED', 'DISMISSED']).default('DETECTED')
});

export type LifeEventCandidate = z.infer<typeof LifeEventCandidateSchema>;

export const LifeEventConsequenceSchema = z.object({
  consequenceId: z.string().optional(),
  eventId: z.string(),
  eventType: LifeEventTypeEnum,
  taxImpact: z.object({
    deductionHeadroomDelta: z.number().nullable(),
    taxLiabilityDelta: z.number().nullable(),
    regimeRecommendation: z.enum(['OLD', 'NEW', 'UNCHANGED']),
    status: z.enum(['CALCULATED', 'INSUFFICIENT_DATA', 'UNKNOWN']).default('CALCULATED')
  }),
  protectionImpact: z.object({
    additionalTermCoverRequired: z.number().nullable(),
    additionalHealthCoverRequired: z.number().nullable(),
    status: z.enum(['CALCULATED', 'INSUFFICIENT_DATA', 'UNKNOWN']).default('CALCULATED')
  }),
  cashflowImpact: z.object({
    monthlySurplusDelta: z.number().nullable(),
    recommendedSipAdjustment: z.number().nullable(),
    status: z.enum(['CALCULATED', 'INSUFFICIENT_DATA', 'UNKNOWN']).default('CALCULATED')
  }),
  goalImpact: z.object({
    newGoalsRecommended: z.array(z.string()),
    timelineShiftYears: z.number().nullable().default(0),
    status: z.enum(['CALCULATED', 'INSUFFICIENT_DATA', 'UNKNOWN']).default('CALCULATED')
  }),
  actionSummary: z.string(),
  suggestedActionPath: z.string().optional(),
  provenance: z.object({
    ruleVersion: z.string().default('2026.1'),
    jurisdiction: z.string().default('IN'),
    sourceReference: z.string().default('Income Tax Act 1961 / HLV Protection Standards')
  }).optional()
});

export type LifeEventConsequence = z.infer<typeof LifeEventConsequenceSchema>;

// ============================================================================
// 4. PROACTIVE AI & OBSERVER CONTRACTS
// ============================================================================

export const ObserverRuleCodeEnum = z.enum([
  'DRIFT_EQUITY_OVERWEIGHT',
  'CONCENTRATION_SINGLE_STOCK',
  'INSURANCE_RENEWAL_DUE',
  'PROTECTION_HLV_GAP',
  'EMERGENCY_FUND_DEFICIT',
  'EXCESS_IDLE_CASH',
  'GOAL_OFF_TRACK_DRIFT',
  'TAX_80C_OPPORTUNITY',
  'ESTATE_NOMINEE_GAP',
  // Backward-compatible aliases
  'NOMINEE_REGISTRATION_GAP',
  'ESTATE_WILL_LAPSED'
]);

export type ObserverRuleCode = z.infer<typeof ObserverRuleCodeEnum>;

export const ProactiveTriggerStatusEnum = z.enum([
  'ACTIVE',
  'ACKNOWLEDGED',
  'SNOOZED',
  'DISMISSED',
  'RESOLVED',
  'STALE',
  'EXPIRED'
]);

export type ProactiveTriggerStatus = z.infer<typeof ProactiveTriggerStatusEnum>;

export const ProactiveTriggerSchema = z.object({
  triggerId: z.string().min(1),
  familyId: z.number().int().positive(),
  ruleCode: ObserverRuleCodeEnum,
  ruleVersion: z.string().default('2026.1'),
  entityId: z.string().default('FAMILY'),
  urgency: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  priorityScore: z.number().int().min(0).max(100).default(50),
  confidencePct: z.number().min(0).max(100),
  dataCompletenessScore: z.number().min(0).max(1),
  headline: z.string().min(1),
  rationale: z.string().min(1),
  evidencePayload: z.record(z.any()),
  explainabilityLineage: z.record(z.any()).optional(),
  actionPayload: z.object({
    label: z.string(),
    targetRoute: z.string(),
    prefillData: z.record(z.any()).optional()
  }),
  stateHash: z.string(),
  asOfDate: z.string(),
  correlationId: z.string(),
  status: ProactiveTriggerStatusEnum.default('ACTIVE'),
  snoozedUntil: z.string().optional(),
  resolvedAt: z.string().optional(),
  resolvedReason: z.string().optional(),
  expiresAt: z.string().optional()
});

export type ProactiveTrigger = z.infer<typeof ProactiveTriggerSchema>;

export const ProactiveTriggerActionInputSchema = z.object({
  action: z.enum(['ACKNOWLEDGE', 'SNOOZE', 'DISMISS', 'RESOLVE']),
  snoozeDays: z.number().int().min(1).max(30).optional(),
  dismissReason: z.string().max(500).optional(),
  resolveReason: z.string().max(500).optional()
});

export type ProactiveTriggerActionInput = z.infer<typeof ProactiveTriggerActionInputSchema>;

export const CooldownRecordSchema = z.object({
  familyId: z.number().int().positive(),
  ruleCode: ObserverRuleCodeEnum,
  ruleVersion: z.string().default('2026.1'),
  entityId: z.string().default('FAMILY'),
  lastTriggeredAt: z.string(),
  cooldownUntil: z.string(),
  lastStateHash: z.string(),
  lastMetricValue: z.number().optional(),
  status: z.enum(['ACTIVE', 'COOLDOWN', 'DISMISSED', 'SNOOZED']).default('COOLDOWN'),
  snoozedUntil: z.string().optional(),
  dismissedAt: z.string().optional(),
  dismissReason: z.string().optional()
});

export type CooldownRecord = z.infer<typeof CooldownRecordSchema>;

// ============================================================================
// 5. EXPLAINABILITY & LINEAGE CONTRACTS
// ============================================================================

export const EvidenceItemSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  sourceTable: z.string(),
  sourceRecordId: z.number().optional(),
  lastUpdated: z.string()
});

export const ExplainabilityLineageSchema = z.object({
  recommendationId: z.number().int().positive(),
  ruleCode: z.string(),
  category: z.enum(['INVESTMENT', 'PROTECTION', 'TAX', 'ESTATE', 'PLANNING']),
  headline: z.string(),
  detailedWhy: z.string(),
  evidence: z.array(EvidenceItemSchema),
  engineName: z.string(),
  engineVersion: z.string().default('v1.0.0'),
  formulaDescription: z.string(),
  mathParameters: z.record(z.union([z.number(), z.string()])),
  confidencePct: z.number().min(0).max(100),
  dataFreshnessTimestamp: z.string(),
  isDeterministic: z.boolean().default(true),
  action: z.object({
    label: z.string(),
    targetRoute: z.string(),
    prefillPayload: z.record(z.any()).optional()
  })
});

export type ExplainabilityLineage = z.infer<typeof ExplainabilityLineageSchema>;

// ============================================================================
// 6. PHASE 8C: SHARED STATUS, PROVENANCE & VALUATION VOCABULARY
// ============================================================================

export const PillarStatusEnum = z.enum([
  'COMPLETE',
  'PARTIAL',
  'KNOWN_ZERO',
  'UNKNOWN',
  'INSUFFICIENT_DATA',
  'NOT_APPLICABLE',
  'STALE'
]);
export type PillarStatus = z.infer<typeof PillarStatusEnum>;

export const ProvenanceTypeEnum = z.enum([
  'AUTHORITATIVE_SOURCE',
  'CALCULATED',
  'DERIVED',
  'AI_AUDIT',
  'EXACT_HISTORICAL',
  'PRIOR_DATE_PROXY',
  'KNOWN_ACQUISITION_COST',
  'HISTORICAL_SOURCE_UNAVAILABLE',
  'UNKNOWN'
]);
export type ProvenanceType = z.infer<typeof ProvenanceTypeEnum>;

export const ValuationTypeEnum = z.enum([
  'MARKET_VALUE',
  'ACQUISITION_COST',
  'LEDGER_BALANCE',
  'SUM_ASSURED', // Note: SUM_ASSURED is coverage protection, NEVER interpreted as net worth
  'SURRENDER_VALUE',
  'NAV',
  'ACCRUED_VALUE',
  'BOOK_VALUE',
  'UNKNOWN'
]);
export type ValuationType = z.infer<typeof ValuationTypeEnum>;

// ============================================================================
// 7. PHASE 8C: FAMILY FINANCIAL HEALTH (FFH) CONTRACTS
// ============================================================================

export const LifeStageEnum = z.enum([
  'EARLY_CAREER',
  'FAMILY_EXPANSION',
  'WEALTH_PRESERVATION',
  'RETIREMENT'
]);
export type LifeStage = z.infer<typeof LifeStageEnum>;

export const FFHPillarScoreSchema = z.object({
  pillar: z.enum(['PROTECTION', 'LIQUIDITY', 'GOALS', 'ESTATE', 'TAX_AND_DATA']),
  score: z.number().min(0).max(100).nullable(),
  weight: z.number().min(0).max(1),
  weightedContribution: z.number().min(0).max(100),
  status: PillarStatusEnum,
  calculationVersion: z.string().default('2026.1'),
  authoritativeEngine: z.string(),
  metrics: z.record(z.any()).default({}),
  missingDataReason: z.string().optional()
});
export type FFHPillarScore = z.infer<typeof FFHPillarScoreSchema>;

export const FamilyFinancialHealthSchema = z.object({
  familyId: z.number().int().positive(),
  overallScore: z.number().min(0).max(100),
  overallStatus: PillarStatusEnum,
  completenessScore: z.number().min(0).max(1),
  lifeStage: LifeStageEnum,
  weights: z.object({
    protection: z.number().min(0).max(1),
    liquidity: z.number().min(0).max(1),
    goals: z.number().min(0).max(1),
    estate: z.number().min(0).max(1),
    taxAndData: z.number().min(0).max(1)
  }),
  pillars: z.object({
    protection: FFHPillarScoreSchema,
    liquidity: FFHPillarScoreSchema,
    goals: FFHPillarScoreSchema,
    estate: FFHPillarScoreSchema,
    taxAndData: FFHPillarScoreSchema
  }),
  deltas: z.object({
    absoluteDelta: z.number().optional().nullable(),
    percentDelta: z.number().optional().nullable(),
    comparisonPeriod: z.string().optional(),
    comparisonStatus: z.string().optional(),
    pillarAttribution: z.record(z.number()).optional()
  }).optional(),
  stateHash: z.string(),
  calculationVersion: z.string().default('2026.1'),
  asOfDate: z.string()
});
export type FamilyFinancialHealth = z.infer<typeof FamilyFinancialHealthSchema>;

export const FamilyHealthSnapshotRowSchema = z.object({
  id: z.number().int().positive().optional(),
  family_id: z.number().int().positive(),
  overall_score: z.number().min(0).max(100),
  pillar_scores_json: z.string(),
  life_stage: LifeStageEnum,
  weights_json: z.string(),
  completeness_score: z.number().min(0).max(1),
  state_hash: z.string(),
  calculation_version: z.string(),
  snapshot_period: z.string(), // YYYY-MM
  as_of_date: z.string(),
  created_at: z.string().optional()
});
export type FamilyHealthSnapshotRow = z.infer<typeof FamilyHealthSnapshotRowSchema>;

// ============================================================================
// 8. PHASE 8C: UNIFIED FAMILY TIMELINE LEDGER CONTRACTS
// ============================================================================

export const TimelineDomainEnum = z.enum([
  'PORTFOLIO',
  'PROTECTION',
  'TAX',
  'ESTATE',
  'GOAL',
  'LIFE_EVENT',
  'AI_DECISION'
]);
export type TimelineDomain = z.infer<typeof TimelineDomainEnum>;

export const TimelineImportanceEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'INFO']);
export type TimelineImportance = z.infer<typeof TimelineImportanceEnum>;

export const TimelineEventStatusEnum = z.enum(['HISTORICAL', 'SCHEDULED']);
export type TimelineEventStatus = z.infer<typeof TimelineEventStatusEnum>;

export const TimelineNarrativeMetadataSchema = z.object({
  memberDisplayName: z.string().optional(),
  assetDisplayName: z.string().optional(),
  insurerDisplayName: z.string().optional(),
  policyType: z.string().optional(),
  quantity: z.number().optional(),
  targetYear: z.number().optional(),
  financialYear: z.string().optional(),
  urgency: z.string().optional(),
  sectionCode: z.string().optional(),
  maskedIdentifier: z.string().optional(),
  fxRate: z.number().optional(),
  fxRateSource: z.string().optional(),
  fxRateDate: z.string().optional(),
  inrAmount: z.number().optional(),
  dateProvenance: z.enum(['AUTHORITATIVE_EVENT_DATE', 'FALLBACK_CREATION_DATE', 'UNKNOWN_DATE']).optional(),
  sourceObservedAt: z.string().optional(),
  sourceStateHash: z.string().optional(),
  provenance: ProvenanceTypeEnum.optional()
}).passthrough();
export type TimelineNarrativeMetadata = z.infer<typeof TimelineNarrativeMetadataSchema>;

export const TimelineEventSchema = z.object({
  eventId: z.string().min(1),
  familyId: z.number().int().positive(),
  domain: TimelineDomainEnum,
  eventType: z.string().min(1),
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  amount: z.number().optional().nullable(),
  amountType: z.string().optional().nullable(), // e.g. TRANSACTION, SUM_ASSURED, PREMIUM, GOAL_TARGET, TAX_DEDUCTION
  currency: z.string().default('INR'),
  familyMemberId: z.number().int().positive().optional().nullable(),
  eventDate: z.string(), // ISO-8601 UTC string or YYYY-MM-DD
  eventStatus: TimelineEventStatusEnum.default('HISTORICAL'),
  importanceTier: TimelineImportanceEnum.default('MEDIUM'),
  metadata: z.record(z.any()).default({}),
  stateHash: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const TimelineQueryFilterSchema = z.object({
  domain: TimelineDomainEnum.optional(),
  familyMemberId: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  importanceTier: TimelineImportanceEnum.optional(),
  minAmount: z.number().optional(),
  minAmountCurrency: z.string().optional(),
  search: z.string().optional(),
  includeScheduled: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0)
});
export type TimelineQueryFilter = z.input<typeof TimelineQueryFilterSchema>;

export const TimelineEventRowSchema = z.object({
  id: z.number().int().positive().optional(),
  family_id: z.number().int().positive(),
  event_id: z.string(),
  domain: TimelineDomainEnum,
  event_type: z.string(),
  source_type: z.string(),
  source_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  amount_type: z.string().nullable().optional(),
  currency: z.string().default('INR'),
  family_member_id: z.number().nullable().optional(),
  event_date: z.string(),
  importance_tier: TimelineImportanceEnum,
  metadata_json: z.string().nullable().optional(),
  state_hash: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type TimelineEventRow = z.infer<typeof TimelineEventRowSchema>;

// ============================================================================
// 9. PHASE 8C: FINANCIAL TIME MACHINE & WHAT-IF CONTRACTS
// ============================================================================

export const ReconstructedAssetHoldingSchema = z.object({
  assetId: z.number().int().positive(),
  assetName: z.string(),
  assetClass: z.string(),
  units: z.number(),
  unitPrice: z.number(),
  priceDate: z.string(),
  valuationType: ValuationTypeEnum,
  provenance: ProvenanceTypeEnum,
  totalMarketValue: z.number(),
  currency: z.string().default('INR'),
  isEstimate: z.boolean().default(false)
});
export type ReconstructedAssetHolding = z.infer<typeof ReconstructedAssetHoldingSchema>;

export const TimeMachineReconstructionSchema = z.object({
  familyId: z.number().int().positive(),
  targetDate: z.string(),
  netWorth: z.number(),
  grossAssets: z.number(),
  totalLiabilities: z.number(),
  holdings: z.array(ReconstructedAssetHoldingSchema),
  cashBalances: z.record(z.number()),
  liabilitiesBreakdown: z.record(z.number()),
  overallStatus: PillarStatusEnum,
  completenessScore: z.number().min(0).max(1),
  provenanceBreakdown: z.record(ProvenanceTypeEnum),
  calculationVersion: z.string().default('2026.1'),
  asOfTimestamp: z.string()
});
export type TimeMachineReconstruction = z.infer<typeof TimeMachineReconstructionSchema>;

export const WhatIfScenarioInputSchema = z.object({
  templateId: z.string().optional(),
  monthlySipAmount: z.number().min(0).max(5000000).optional(),
  sipStepUpPercent: z.number().min(0).max(100).optional(),
  targetRetirementAge: z.number().int().min(35).max(80).optional(),
  loanPrepaymentAmount: z.number().min(0).optional(),
  assetRebalanceEquityPercent: z.number().min(0).max(100).optional(),
  assetRebalanceDebtPercent: z.number().min(0).max(100).optional(),
  targetGoalId: z.number().int().positive().optional()
});
export type WhatIfScenarioInput = z.infer<typeof WhatIfScenarioInputSchema>;

export const WhatIfSimulationResultSchema = z.object({
  scenarioId: z.string(),
  familyId: z.number().int().positive(),
  baselineStateHash: z.string(),
  baselineAsOf: z.string(),
  appliedParameters: WhatIfScenarioInputSchema,
  corpusAtRetirement: z.number(),
  readinessPercent: z.number().min(0),
  gapDelta: z.number(),
  monthlyBenefitAmount: z.number(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH']),
  taxSavingsBenefit: z.number(),
  calculationVersion: z.string().default('2026.1'),
  generatedAt: z.string()
});
export type WhatIfSimulationResult = z.infer<typeof WhatIfSimulationResultSchema>;

