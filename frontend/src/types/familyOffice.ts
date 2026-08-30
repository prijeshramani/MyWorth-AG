/**
 * Authoritative Frontend Types for Family Office Intelligence (Sprint 8C.4)
 * Directly aligned with backend Zod contracts in backend/src/contracts/familyOfficeContracts.ts.
 */

// ============================================================================
// 1. STATUS & PROVENANCE ENUMS
// ============================================================================

export type PillarStatus = 
  | 'COMPLETE'
  | 'PARTIAL'
  | 'INSUFFICIENT_DATA'
  | 'UNKNOWN'
  | 'KNOWN_ZERO'
  | 'NOT_APPLICABLE'
  | 'STALE';

export type LifeStage = 
  | 'EARLY_CAREER'
  | 'WEALTH_ACCUMULATION'
  | 'FAMILY_EXPANSION'
  | 'PRE_RETIREMENT'
  | 'RETIREMENT'
  | 'LEGACY_PLANNING';

export type ProvenanceType = 
  | 'EXACT_HISTORICAL'
  | 'PROXY_HISTORICAL'
  | 'KNOWN_ACQUISITION_COST'
  | 'CALCULATED'
  | 'HISTORICAL_SOURCE_UNAVAILABLE';

export type HistoricalValuationType = 
  | 'MARKET_VALUE'
  | 'NAV'
  | 'ACQUISITION_COST'
  | 'ACCRUED_VALUE'
  | 'LEDGER_BALANCE'
  | 'UNKNOWN';

export type ReconstructionMode = 
  | 'HISTORICAL_ECONOMIC_STATE'
  | 'SYSTEM_TIME_RECONSTRUCTION';

export type KnowledgeTimeStatus = 
  | 'FULLY_RECONSTRUCTABLE'
  | 'NOT_FULLY_RECONSTRUCTABLE'
  | 'UNKNOWN';

export type ReconstructionDomain = 
  | 'PORTFOLIO'
  | 'PROTECTION'
  | 'LIQUIDITY'
  | 'GOALS'
  | 'ESTATE'
  | 'TAX';

export type TimelineDomain = 
  | 'PORTFOLIO'
  | 'PROTECTION'
  | 'TAX'
  | 'ESTATE'
  | 'GOAL'
  | 'LIFE_EVENT'
  | 'AI_DECISION';

export type TimelineImportance = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type TimelineEventStatus = 'HISTORICAL' | 'SCHEDULED';

export type WhatIfScenarioType = 
  | 'RECURRING_SIP_STEP_UP'
  | 'ONE_TIME_LUMP_SUM_INVESTMENT'
  | 'RETIREMENT_AGE_ADJUSTMENT'
  | 'GOAL_CONTRIBUTION_REALLOCATION'
  | 'TAX_REGIME_OPTIMIZATION_SCENARIO';

export type AssumptionProvenance = 
  | 'USER_PROVIDED'
  | 'FAMILY_PROFILE'
  | 'SYSTEM_ASSUMPTION';

export type ProactiveTriggerStatus = 
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'SNOOZED'
  | 'DISMISSED'
  | 'RESOLVED'
  | 'STALE';

export type TriggerUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// ============================================================================
// 2. FAMILY FINANCIAL HEALTH TYPES
// ============================================================================

export interface FFHPillarScore {
  pillar: 'PROTECTION' | 'LIQUIDITY' | 'GOALS' | 'ESTATE' | 'TAX_AND_DATA' | string;
  score: number | null; // 0..100
  weight: number; // 0..1
  weightedContribution: number; // 0..100
  status: PillarStatus;
  calculationVersion?: string;
  authoritativeEngine: string;
  metrics: Record<string, any>;
  missingDataReason?: string | null;
}

export interface FamilyFinancialHealth {
  familyId: number;
  overallScore: number; // 0..100
  overallStatus: PillarStatus;
  completenessScore: number; // 0..1
  lifeStage: LifeStage;
  weights: {
    protection: number;
    liquidity: number;
    goals: number;
    estate: number;
    taxAndData: number;
  };
  pillars: {
    protection: FFHPillarScore;
    liquidity: FFHPillarScore;
    goals: FFHPillarScore;
    estate: FFHPillarScore;
    taxAndData: FFHPillarScore;
  };
  deltas?: {
    absoluteDelta?: number | null;
    percentDelta?: number | null;
    comparisonPeriod?: string;
    comparisonStatus?: string;
    pillarAttribution?: Record<string, number>;
  };
  stateHash: string;
  calculationVersion: string;
  asOfDate: string;
}

export interface FamilyHealthSnapshotRow {
  id?: number;
  family_id: number;
  overall_score: number;
  pillar_scores_json: string;
  pillar_scores?: Record<string, FFHPillarScore>;
  life_stage: LifeStage;
  weights_json: string;
  weights?: Record<string, number>;
  completeness_score: number;
  state_hash: string;
  calculation_version: string;
  snapshot_period: string; // YYYY-MM
  as_of_date: string;
  created_at?: string;
}

// ============================================================================
// 3. TIMELINE LEDGER TYPES
// ============================================================================

export interface TimelineEvent {
  eventId: string;
  familyId: number;
  domain: TimelineDomain;
  eventType: string;
  sourceType: string;
  sourceId: string;
  title: string;
  description?: string | null;
  amount?: number | null;
  amountType?: string | null;
  currency: string;
  familyMemberId?: number | null;
  eventDate: string;
  eventStatus: TimelineEventStatus;
  importanceTier: TimelineImportance;
  metadata: Record<string, any>;
  stateHash?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimelineQueryFilter {
  domain?: TimelineDomain;
  familyMemberId?: number;
  startDate?: string;
  endDate?: string;
  importanceTier?: TimelineImportance;
  minAmount?: number;
  search?: string;
  includeScheduled?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// 4. FINANCIAL TIME MACHINE & WHAT-IF TYPES
// ============================================================================

export interface ReconstructedAssetHolding {
  assetId: number;
  assetName: string;
  assetClass: string;
  units: number;
  unitPrice?: number | null;
  costBasis?: number | null;
  priceDate?: string | null;
  valuationType: HistoricalValuationType;
  provenance: ProvenanceType;
  daysOfProxyLag: number;
  totalMarketValue: number | null;
  unrealizedGainLoss?: number | null;
  currency: string;
  status: PillarStatus;
  lifecycleStatus?: string | null;
  missingDataReason?: string | null;
  isEstimate: boolean;
}

export interface DomainReconstructionStatus {
  domain: ReconstructionDomain;
  status: PillarStatus;
  coveragePct: number;
  missingDataReasons: string[];
  sourceTables: string[];
}

export interface ProtectionShieldSummary {
  totalSumAssured: number;
  activePolicyCount: number;
  policies: Array<{
    policyId: number;
    policyName: string;
    policyType: string;
    sumAssured: number;
    startDate: string;
    status: string;
  }>;
}

export interface TimeMachineReconstruction {
  familyId: number;
  asOfDate: string;
  reconstructionMode: ReconstructionMode;
  knowledgeTimeStatus: KnowledgeTimeStatus;
  netWorth: number;
  grossAssets: number;
  totalLiabilities: number;
  containsNonMarketValuations: boolean;
  completenessScore: number;
  overallStatus: PillarStatus;
  holdings: ReconstructedAssetHolding[];
  cashBalances: Record<string, number>;
  liabilitiesBreakdown: Record<string, number>;
  protectionShield: ProtectionShieldSummary;
  domains: {
    portfolio: DomainReconstructionStatus;
    protection: DomainReconstructionStatus;
    liquidity: DomainReconstructionStatus;
    goals: DomainReconstructionStatus;
    estate: DomainReconstructionStatus;
    tax: DomainReconstructionStatus;
  };
  provenanceBreakdown: Record<string, number>;
  stateHash: string;
  ruleVersion: string;
  calculationVersion: string;
  reconstructedAt: string;
}

export interface WhatIfScenarioInput {
  scenarioType: WhatIfScenarioType;
  baselineAsOf?: string;
  // RECURRING_SIP_STEP_UP
  monthlySipAmount?: number;
  sipStepUpPercent?: number;
  years?: number;
  // ONE_TIME_LUMP_SUM_INVESTMENT
  lumpSumAmount?: number;
  investmentHorizonYears?: number;
  assumedReturnPct?: number;
  // RETIREMENT_AGE_ADJUSTMENT
  targetRetirementAge?: number;
  // GOAL_CONTRIBUTION_REALLOCATION
  targetGoalId?: number;
  reallocatedMonthlySip?: number;
  // TAX_REGIME_OPTIMIZATION_SCENARIO
  hypothetical80CAmount?: number;
  hypothetical80CCDAmount?: number;
  salaryIncome?: number;
}

export interface WhatIfSimulationResult {
  scenarioId: string;
  scenarioType: WhatIfScenarioType;
  familyId: number;
  baselineStateHash: string;
  baselineAsOf: string;
  appliedParameters: WhatIfScenarioInput;
  status: PillarStatus;
  corpusAtRetirement?: number | null;
  readinessPercent?: number | null;
  gapDelta?: number | null;
  monthlyBenefitAmount?: number | null;
  projectedValue?: number | null;
  estimatedWealthGain?: number | null;
  taxSavingsBenefit?: number | null;
  optimalRegime?: 'OLD' | 'NEW' | null;
  effectiveTaxRate?: number | null;
  yearlySchedule?: Array<{
    year: number;
    investedAmount: number;
    corpusValue: number;
    annualGain?: number;
  }>;
  assumptionsUsed: Record<string, { value: any; provenance: AssumptionProvenance; description?: string }>;
  missingDataReason?: string | null;
  calculationVersion: string;
  ruleVersion: string;
  generatedAt: string;
}

// ============================================================================
// 5. PROACTIVE AI OBSERVER TYPES
// ============================================================================

export interface ProactiveTrigger {
  triggerId: string;
  ruleId: string;
  familyId: number;
  domain: string;
  urgency: TriggerUrgency;
  confidenceScore: number;
  title: string;
  narrativeText: string;
  explainabilityDetails: Record<string, any>;
  recommendedActions: Array<{
    actionType: string;
    label: string;
    targetDomain: string;
    payload?: Record<string, any>;
  }>;
  status: ProactiveTriggerStatus;
  snoozedUntil?: string | null;
  dismissedReason?: string | null;
  resolvedReason?: string | null;
  acknowledgedAt?: string | null;
  stateHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProactiveEvaluationResult {
  familyId: number;
  evaluatedRulesCount: number;
  triggeredCount: number;
  activeTriggers: ProactiveTrigger[];
  evaluationTimestamp: string;
}

// ============================================================================
// 6. ACTIONABLE COMPLETENESS & NEXT-BEST-ACTION (Sprint 9.1)
// ============================================================================

export type ActionPriorityCategory =
  | 'DATA_INTEGRITY'
  | 'MISSING_FOUNDATION'
  | 'INTELLIGENCE_ENRICHMENT'
  | 'ROUTINE_HYGIENE';

export type ActionImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface NextBestAction {
  actionId: string;
  title: string;
  description: string;
  category: ActionPriorityCategory;
  impactLevel: ActionImpactLevel;
  whyItMatters: string;
  affectedCapabilities: string[];
  targetRoute: string;
  targetDomain: string;
}

export interface DomainReadinessItem {
  isReady: boolean;
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' | 'INCOMPLETE' | 'DEFERRED';
  missingSummary?: string;
}

export interface ActionableCompletenessResponse {
  familyId: number;
  overallCompleteness: number; // 0..1
  completenessScore: number; // 0..100
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  rankedActions: NextBestAction[];
  domainReadiness: {
    lineage: DomainReadinessItem;
    balanceSheet: DomainReadinessItem;
    protection: DomainReadinessItem;
    liquidity: DomainReadinessItem;
    tax: DomainReadinessItem;
    estate: DomainReadinessItem;
    goals: DomainReadinessItem;
  };
  calculatedAt: string;
}

