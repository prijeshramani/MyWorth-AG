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
