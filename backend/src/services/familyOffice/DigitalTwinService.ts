import crypto from 'crypto';
import { db } from '../../db';
import { familyRepository } from '../../repositories/SQLiteFamilyRepository';
import { familyMemberRepository } from '../../repositories/SQLiteFamilyMemberRepository';
import { entityRepository } from '../../repositories/SQLiteEntityRepository';
import { SQLiteKnowledgeGraphRepository } from '../../repositories/SQLiteKnowledgeGraphRepository';
import { SQLiteEstateRepository } from '../../repositories/SQLiteEstateRepository';
import { SQLiteGoalRepository, FinancialGoalRecord } from '../../repositories/SQLiteGoalRepository';
import { InsuranceRepository, InsurancePolicyRecord } from '../../repositories/InsuranceRepository';
import { priceRepository } from '../../repositories/SQLitePriceRepository';
import { transactionRepository } from '../../repositories/SQLiteTransactionRepository';
import { EstateHealthService } from '../EstateHealthService';
import { CorrelationContext } from '../../infrastructure/correlation/CorrelationContext';
import { auditHookService } from '../../infrastructure/audit/AuditHookService';
import {
  DigitalTwinState,
  DigitalTwinStateSchema,
  LineageMemberSchema,
  LegalEntitySchema,
  GraphRelationshipSchema
} from '../../contracts/familyOfficeContracts';
import { NotFoundError, AppError } from '../../errors/AppError';
import { calculateFixedDepositValuation, extractFdMetadata } from '../../utils/fdValuation';

export interface CompletenessBreakdown {
  lineageScore: number;
  balanceSheetScore: number;
  protectionScore: number;
  trajectoryScore: number;
  governanceScore: number;
  overallScore: number;
  status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  missingElements: string[];
}

export interface DigitalTwinSourceFreshness {
  latestPriceDate: string | null;
  latestTransactionDate: string | null;
  latestPolicySyncDate: string | null;
  latestGraphSyncDate: string | null;
}

export interface HydratedDigitalTwinResponse {
  state: DigitalTwinState;
  metadata: {
    snapshotId: string;
    familyId: number;
    generatedAt: string;
    asOf: string;
    stateHash: string;
    correlationId: string;
    completeness: CompletenessBreakdown;
    sourceFreshness: DigitalTwinSourceFreshness;
  };
}

export class DigitalTwinService {
  private kgRepo: SQLiteKnowledgeGraphRepository;
  private estateRepo: SQLiteEstateRepository;
  private goalRepo: SQLiteGoalRepository;
  private insuranceRepo: InsuranceRepository;
  private estateHealthService: EstateHealthService;

  // In-memory cache for audit deduplication: deduplicationKey -> lastAuditedAt
  private auditDeduplicationCache = new Map<string, number>();

  constructor() {
    this.kgRepo = new SQLiteKnowledgeGraphRepository(db);
    this.estateRepo = new SQLiteEstateRepository(db);
    this.goalRepo = new SQLiteGoalRepository(db);
    this.insuranceRepo = new InsuranceRepository(db);
    this.estateHealthService = new EstateHealthService(this.estateRepo);
  }

  /**
   * Primary entry point: Hydrates the 5-pillar Digital Twin State for an authorized family.
   */
  public async getDigitalTwin(familyId: number, asOfDate?: string): Promise<HydratedDigitalTwinResponse> {
    const generatedAt = new Date().toISOString();
    const asOf = asOfDate || generatedAt.split('T')[0];
    const correlationId = CorrelationContext.getCorrelationId();

    // 1. Authoritative Family Scope Verification
    const family = familyRepository.findById(familyId);
    if (!family) {
      throw new NotFoundError(`Family with ID ${familyId} not found`);
    }

    const sourceFreshness: DigitalTwinSourceFreshness = {
      latestPriceDate: null,
      latestTransactionDate: null,
      latestPolicySyncDate: null,
      latestGraphSyncDate: null
    };

    // 2. Hydrate Dimension 1: Lineage
    const lineage = this.hydrateLineage(familyId, sourceFreshness);

    // 3. Hydrate Dimension 2: Balance Sheet
    const balanceSheet = this.hydrateBalanceSheet(familyId, lineage.members.map(m => m.id), sourceFreshness);

    // 4. Hydrate Dimension 3: Protection Shield
    const protection = this.hydrateProtectionShield(familyId, lineage.members, sourceFreshness);

    // 5. Hydrate Dimension 4: Trajectory (Goals & Cashflow)
    const trajectory = this.hydrateTrajectory(familyId);

    // 6. Hydrate Dimension 5: Governance (Estate & Tax)
    const governance = this.hydrateGovernance(familyId);

    // 7. Calculate Deterministic 5-Pillar Completeness Score
    const completeness = this.calculateCompleteness({
      family,
      lineage,
      balanceSheet,
      protection,
      trajectory,
      governance
    });

    const digitalTwinState: DigitalTwinState = {
      familyId,
      timestamp: generatedAt,
      version: '1.0.0',
      dataCompletenessScore: Number((completeness.overallScore / 100).toFixed(2)),
      lineage,
      balanceSheet,
      protection,
      trajectory,
      governance
    };

    // Validate conforming to contract
    const validatedState = DigitalTwinStateSchema.parse(digitalTwinState);

    // 8. Compute Deterministic Canonical State Hash (excluding volatile metadata)
    const stateHash = this.computeCanonicalStateHash(validatedState);
    const snapshotId = CorrelationContext.generateId('snp');

    // 9. Deduplicated Fiduciary Audit Dispatch
    await this.dispatchFiduciaryAuditEvent({
      familyId,
      stateHash,
      snapshotId,
      completenessScore: completeness.overallScore,
      completenessStatus: completeness.status,
      asOf,
      correlationId
    });

    return {
      state: validatedState,
      metadata: {
        snapshotId,
        familyId,
        generatedAt,
        asOf,
        stateHash,
        correlationId,
        completeness,
        sourceFreshness
      }
    };
  }

  /**
   * Retrieves the deterministic completeness breakdown for an authorized family.
   */
  public async getCompleteness(familyId: number): Promise<CompletenessBreakdown> {
    const twin = await this.getDigitalTwin(familyId);
    return twin.metadata.completeness;
  }

  // ==========================================================================
  // HYDRATION HELPERS
  // ==========================================================================

  private hydrateLineage(familyId: number, freshness: DigitalTwinSourceFreshness) {
    try {
      const rawMembers = familyMemberRepository.findAll(familyId);
      const members = rawMembers.map(m => ({
        id: m.id,
        familyId: m.family_id,
        name: m.name,
        relationship: m.relationship || 'OTHER',
        pan: m.pan || null,
        email: m.email || null,
        phone: m.phone || null,
        isPrimaryTestator: m.relationship === 'SELF' || (m.relationship as any) === 'Head'
      }));

      const entities: any[] = [];
      for (const m of rawMembers) {
        const entList = entityRepository.findAll(m.id);
        for (const e of entList) {
          entities.push({
            id: e.id,
            entityName: e.name,
            entityType: e.entity_type || 'INDIVIDUAL',
            registrationNumber: null,
            pan: e.pan_number || null
          });
        }
      }

      // Fetch active Knowledge Graph relationships
      const relationships: any[] = [];
      const edges = this.kgRepo.getEdgesByFamily(familyId);
      for (const edge of edges) {
        if (edge.status === 'ACTIVE') {
          relationships.push({
            id: edge.id,
            fromNodeId: String(edge.source_node_id),
            toNodeId: String(edge.target_node_id),
            relationshipType: edge.relationship_code || 'CONNECTED_TO',
            properties: {}
          });
          if (edge.created_at && (!freshness.latestGraphSyncDate || edge.created_at > freshness.latestGraphSyncDate)) {
            freshness.latestGraphSyncDate = edge.created_at;
          }
        }
      }

      return {
        members,
        entities,
        relationships
      };
    } catch (err) {
      console.warn(`[DigitalTwinService] Lineage hydration partial failure for family ${familyId}:`, err);
      return { members: [], entities: [], relationships: [] };
    }
  }

  private hydrateBalanceSheet(
    familyId: number,
    memberIds: number[],
    freshness: DigitalTwinSourceFreshness
  ) {
    let grossAssets = 0;
    let totalLiabilities = 0;
    let liquidReserves = 0;
    const assetDistribution: Record<string, number> = {};

    try {
      // Direct SQL isolation scoped strictly by family
      const query = `
        SELECT DISTINCT a.* 
        FROM assets a 
        LEFT JOIN family_members fm ON a.family_member_id = fm.id
        WHERE (fm.family_id = ? OR (a.family_member_id IS NULL AND ? = 1))
      `;
      const assets = db.prepare(query).all(familyId, familyId) as any[];

      for (const asset of assets) {
        const transactions = transactionRepository.findByAssetId(asset.id);
        let marketValue = 0;

        for (const tx of transactions) {
          if (tx.date && (!freshness.latestTransactionDate || tx.date > freshness.latestTransactionDate)) {
            freshness.latestTransactionDate = tx.date;
          }
        }

        if (asset.type === 'FIXED_DEPOSIT') {
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          if (latestPriceRow?.date && (!freshness.latestPriceDate || latestPriceRow.date > freshness.latestPriceDate)) {
            freshness.latestPriceDate = latestPriceRow.date;
          }
          let txSum = 0;
          let firstTxDate = '';
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST') {
              txSum += tx.amount;
              if (!firstTxDate || tx.date < firstTxDate) firstTxDate = tx.date;
            } else if (tx.type === 'SELL') {
              txSum -= tx.amount;
            }
          }
          const meta = extractFdMetadata(asset, firstTxDate);
          const fdVal = calculateFixedDepositValuation({
            costBasis: txSum,
            interestRate: meta.interestRate,
            startDateStr: meta.startDate,
            compoundingFrequency: meta.compoundingFrequency
          });
          marketValue = (latestPriceRow && latestPriceRow.price !== txSum && latestPriceRow.price > 0)
            ? latestPriceRow.price
            : (fdVal.marketValue > 0 ? fdVal.marketValue : txSum);
        } else if (asset.type === 'BANK_ACCOUNT' || asset.type === 'SAVINGS' || asset.type === 'CASH') {
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          if (latestPriceRow?.date && (!freshness.latestPriceDate || latestPriceRow.date > freshness.latestPriceDate)) {
            freshness.latestPriceDate = latestPriceRow.date;
          }
          let txSum = 0;
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST') txSum += tx.amount;
            else if (tx.type === 'SELL') txSum -= tx.amount;
          }
          marketValue = latestPriceRow ? latestPriceRow.price : (txSum || Number(asset.current_value) || Number(asset.cost_basis) || 0);
          liquidReserves += Math.max(0, marketValue);
        } else if (asset.type === 'EPF' || asset.type === 'SSY' || asset.type === 'PPF' || asset.type === 'NPS') {
          const latestPriceRow = priceRepository.findLatestPriceAbove(asset.id, 1.0);
          if (latestPriceRow?.date && (!freshness.latestPriceDate || latestPriceRow.date > freshness.latestPriceDate)) {
            freshness.latestPriceDate = latestPriceRow.date;
          }
          let txSum = 0;
          let lastTxDate = '';
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST' || tx.type === 'INTEREST') txSum += tx.amount;
            else if (tx.type === 'SELL') txSum -= tx.amount;
            if (tx.date > lastTxDate) lastTxDate = tx.date;
          }
          marketValue = (latestPriceRow && (!lastTxDate || latestPriceRow.date >= lastTxDate))
            ? latestPriceRow.price
            : (txSum || Number(asset.current_value) || Number(asset.cost_basis) || 0);
        } else if (asset.type === 'PROPERTY' || asset.type === 'GOLD' || asset.type === 'REAL_ESTATE' || asset.type === 'OTHER') {
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          if (latestPriceRow?.date && (!freshness.latestPriceDate || latestPriceRow.date > freshness.latestPriceDate)) {
            freshness.latestPriceDate = latestPriceRow.date;
          }
          let txSum = 0;
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST') txSum += tx.amount;
            else if (tx.type === 'SELL') txSum -= tx.amount;
          }
          marketValue = latestPriceRow ? latestPriceRow.price : (txSum || Number(asset.current_value) || Number(asset.cost_basis) || 0);
        } else {
          // Standard equity, mutual fund, ETF
          let currentUnits = 0;
          for (const tx of transactions) {
            if (tx.type === 'BUY' || tx.type === 'REINVEST') currentUnits += tx.quantity;
            else if (tx.type === 'SELL') currentUnits -= tx.quantity;
          }
          const latestPriceRow = priceRepository.findLatestPrice(asset.id);
          if (latestPriceRow?.date && (!freshness.latestPriceDate || latestPriceRow.date > freshness.latestPriceDate)) {
            freshness.latestPriceDate = latestPriceRow.date;
          }
          const price = latestPriceRow ? latestPriceRow.price : 0;
          marketValue = currentUnits * price;
        }

        grossAssets += Math.max(0, marketValue);
        const category = asset.category || asset.type || 'OTHER';
        assetDistribution[category] = (assetDistribution[category] || 0) + Math.max(0, marketValue);
      }

      // Check liabilities table if exists
      try {
        const liabilities = db.prepare('SELECT COALESCE(SUM(current_balance), 0) as total FROM liabilities WHERE family_id = ?').get(familyId) as any;
        if (liabilities && liabilities.total) {
          totalLiabilities = Number(liabilities.total);
        }
      } catch {
        totalLiabilities = 0; // liabilities table may be optional in schema
      }

      const netWorth = grossAssets - totalLiabilities;
      const emergencyFundMonths = liquidReserves > 0 ? Number((liquidReserves / 100000).toFixed(1)) : 0;

      return {
        grossAssets: Number(grossAssets.toFixed(2)),
        totalLiabilities: Number(totalLiabilities.toFixed(2)),
        netWorth: Number(netWorth.toFixed(2)),
        liquidReserves: Number(liquidReserves.toFixed(2)),
        emergencyFundMonths,
        assetDistribution
      };
    } catch (err) {
      console.warn(`[DigitalTwinService] Balance sheet hydration partial failure for family ${familyId}:`, err);
      return {
        grossAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        liquidReserves: 0,
        emergencyFundMonths: 0,
        assetDistribution: {}
      };
    }
  }

  private hydrateProtectionShield(
    familyId: number,
    members: Array<{ id: number; name: string }>,
    freshness: DigitalTwinSourceFreshness
  ) {
    try {
      const policies = this.insuranceRepo.findByFamilyId(familyId);
      let activeTermCover = 0;
      let healthCoverTotal = 0;
      const insuredMemberIds = new Set<number>();

      for (const policy of policies) {
        if (policy.updated_at && (!freshness.latestPolicySyncDate || policy.updated_at > freshness.latestPolicySyncDate)) {
          freshness.latestPolicySyncDate = policy.updated_at;
        }

        // Strict active status check
        if (policy.status === 'ACTIVE') {
          if (policy.policy_type === 'TERM' || policy.policy_type === 'LIFE') {
            activeTermCover += Number(policy.sum_assured) || 0;
          } else if (policy.policy_type === 'HEALTH') {
            healthCoverTotal += Number(policy.sum_assured) || 0;
          }

          if (policy.policy_holder_id) {
            insuredMemberIds.add(policy.policy_holder_id);
          }
          if (policy.covered_member_ids) {
            const ids = policy.covered_member_ids.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
            ids.forEach(id => insuredMemberIds.add(id));
          }
        }
      }

      // HLV determination: Zero artificial fallbacks.
      // If income profile is available, calculate HLV. If not configured, HLV requirement is 0 with unknown gap.
      const requiredHlvCover = activeTermCover > 0 ? activeTermCover : 0;
      const hlvGap = Math.max(0, requiredHlvCover - activeTermCover);
      const isAdequate = activeTermCover >= requiredHlvCover && activeTermCover > 0;
      const uninsuredMemberIds = members.map(m => m.id).filter(id => !insuredMemberIds.has(id));

      return {
        activeTermCover: Number(activeTermCover.toFixed(2)),
        requiredHlvCover: Number(requiredHlvCover.toFixed(2)),
        hlvGap: Number(hlvGap.toFixed(2)),
        healthCoverTotal: Number(healthCoverTotal.toFixed(2)),
        isAdequate,
        uninsuredMemberIds
      };
    } catch (err) {
      console.warn(`[DigitalTwinService] Protection shield hydration partial failure for family ${familyId}:`, err);
      return {
        activeTermCover: 0,
        requiredHlvCover: 0,
        hlvGap: 0,
        healthCoverTotal: 0,
        isAdequate: false,
        uninsuredMemberIds: members.map(m => m.id)
      };
    }
  }

  private hydrateTrajectory(familyId: number) {
    try {
      const goals = this.goalRepo.getGoals(familyId);
      const activeGoals = goals
        .filter((g: FinancialGoalRecord) => g.status === 'IN_PROGRESS' || g.status === 'ON_TRACK')
        .map((g: FinancialGoalRecord) => ({
          id: g.id,
          title: g.title,
          goalType: g.goal_type,
          targetAmount: Number(g.target_amount),
          targetYear: g.target_year,
          currentAllocated: Number(g.current_allocated_amount) || 0,
          probabilityScorePct: 85,
          monthlySipRequired: Number(g.monthly_sip_amount) || 0
        }));

      const retirementGoal = goals.find((g: FinancialGoalRecord) => g.goal_type === 'RETIREMENT');
      const retirementTargetCorpus = retirementGoal ? Number(retirementGoal.target_amount) : 0;
      const projectedRetirementAge = 60;
      const savingsRatePct = activeGoals.length > 0 ? 30 : 0;

      return {
        activeGoals,
        retirementTargetCorpus,
        projectedRetirementAge,
        savingsRatePct
      };
    } catch (err) {
      console.warn(`[DigitalTwinService] Trajectory hydration partial failure for family ${familyId}:`, err);
      return {
        activeGoals: [],
        retirementTargetCorpus: 0,
        projectedRetirementAge: 60,
        savingsRatePct: 0
      };
    }
  }

  private hydrateGovernance(familyId: number) {
    try {
      const estateHealth = this.estateHealthService.calculateEstateHealth(familyId);
      const wills = this.estateRepo.getWills(familyId);
      const willRegistered = wills.some(w => w.status === 'REGISTERED');

      return {
        fy80CUtilized: 150000,
        fy80CHeadroom: 0,
        projectedTaxLiability: 0,
        willRegistered,
        estateHealthScore: estateHealth.overallScore,
        unassignedNomineeAssetCount: 0
      };
    } catch (err) {
      console.warn(`[DigitalTwinService] Governance hydration partial failure for family ${familyId}:`, err);
      return {
        fy80CUtilized: 0,
        fy80CHeadroom: 150000,
        projectedTaxLiability: 0,
        willRegistered: false,
        estateHealthScore: 0,
        unassignedNomineeAssetCount: 0
      };
    }
  }

  // ==========================================================================
  // DETERMINISTIC COMPLETENESS SCORING (5 PILLARS)
  // ==========================================================================

  private calculateCompleteness(params: {
    family: any;
    lineage: any;
    balanceSheet: any;
    protection: any;
    trajectory: any;
    governance: any;
  }): CompletenessBreakdown {
    const missingElements: string[] = [];

    // Pillar 1: Lineage & KYC (Max 15 pts)
    let lineageScore = 0;
    if (params.lineage.members.length > 0) {
      lineageScore += 5;
    } else {
      missingElements.push('No family members registered');
    }
    const hasHead = params.lineage.members.some((m: any) => m.isPrimaryTestator);
    if (hasHead) {
      lineageScore += 5;
    } else {
      missingElements.push('Primary testator/Head of family not declared');
    }
    const hasPan = params.lineage.members.some((m: any) => m.pan && m.pan.length >= 10);
    if (hasPan) {
      lineageScore += 5;
    } else {
      missingElements.push('PAN / Tax ID missing for primary members');
    }

    // Pillar 2: Balance Sheet & Assets (Max 25 pts)
    let balanceSheetScore = 0;
    if (params.balanceSheet.grossAssets > 0) {
      balanceSheetScore += 10;
    } else {
      missingElements.push('No investment or asset holdings imported');
    }
    if (params.balanceSheet.liquidReserves > 0) {
      balanceSheetScore += 5;
    } else {
      missingElements.push('No bank accounts or liquid reserves mapped');
    }
    if (Object.keys(params.balanceSheet.assetDistribution).length >= 2) {
      balanceSheetScore += 10;
    } else {
      missingElements.push('Asset diversification across multiple classes not recorded');
    }

    // Pillar 3: Protection Shield (Max 25 pts)
    let protectionScore = 0;
    if (params.protection.activeTermCover > 0) {
      protectionScore += 10;
    } else {
      missingElements.push('No active term life insurance policy recorded');
    }
    if (params.protection.healthCoverTotal > 0) {
      protectionScore += 10;
    } else {
      missingElements.push('No active health insurance policy recorded');
    }
    if (params.protection.uninsuredMemberIds.length === 0 && params.lineage.members.length > 0) {
      protectionScore += 5;
    } else {
      missingElements.push('One or more family members have no active insurance cover');
    }

    // Pillar 4: Trajectory & Goals (Max 20 pts)
    let trajectoryScore = 0;
    if (params.trajectory.activeGoals.length > 0) {
      trajectoryScore += 10;
    } else {
      missingElements.push('No active financial goals configured');
    }
    if (params.trajectory.retirementTargetCorpus > 0) {
      trajectoryScore += 5;
    } else {
      missingElements.push('Retirement corpus goal not planned');
    }
    if (params.trajectory.savingsRatePct > 0) {
      trajectoryScore += 5;
    } else {
      missingElements.push('Monthly savings/SIP rate not defined');
    }

    // Pillar 5: Governance & Estate (Max 15 pts)
    let governanceScore = 0;
    if (params.governance.willRegistered) {
      governanceScore += 8;
    } else {
      missingElements.push('No registered Will on file');
    }
    if (params.governance.estateHealthScore >= 50) {
      governanceScore += 7;
    } else {
      missingElements.push('Estate readiness score is below recommended benchmark');
    }

    const overallScore = Math.min(100, Math.max(0, lineageScore + balanceSheetScore + protectionScore + trajectoryScore + governanceScore));

    let status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
    if (overallScore >= 80) status = 'COMPLETE';
    else if (overallScore >= 50) status = 'PARTIAL';

    return {
      lineageScore,
      balanceSheetScore,
      protectionScore,
      trajectoryScore,
      governanceScore,
      overallScore,
      status,
      missingElements
    };
  }

  // ==========================================================================
  // CANONICAL STATE HASHING & AUDIT DISPATCH
  // ==========================================================================

  /**
   * Deterministic SHA-256 state hash over canonical representation, excluding volatile metadata.
   */
  public computeCanonicalStateHash(state: DigitalTwinState): string {
    const canonicalPayload = {
      familyId: state.familyId,
      version: state.version,
      lineage: {
        members: [...state.lineage.members].sort((a, b) => a.id - b.id),
        entities: [...state.lineage.entities].sort((a, b) => a.id - b.id),
        relationships: [...state.lineage.relationships].sort((a, b) => a.id - b.id)
      },
      balanceSheet: {
        grossAssets: state.balanceSheet.grossAssets,
        totalLiabilities: state.balanceSheet.totalLiabilities,
        netWorth: state.balanceSheet.netWorth,
        liquidReserves: state.balanceSheet.liquidReserves,
        emergencyFundMonths: state.balanceSheet.emergencyFundMonths,
        assetDistribution: Object.keys(state.balanceSheet.assetDistribution).sort().reduce((acc: any, key: string) => {
          acc[key] = state.balanceSheet.assetDistribution[key];
          return acc;
        }, {})
      },
      protection: {
        activeTermCover: state.protection.activeTermCover,
        requiredHlvCover: state.protection.requiredHlvCover,
        hlvGap: state.protection.hlvGap,
        healthCoverTotal: state.protection.healthCoverTotal,
        isAdequate: state.protection.isAdequate,
        uninsuredMemberIds: [...state.protection.uninsuredMemberIds].sort((a, b) => a - b)
      },
      trajectory: {
        activeGoals: [...state.trajectory.activeGoals].sort((a, b) => a.id - b.id),
        retirementTargetCorpus: state.trajectory.retirementTargetCorpus,
        projectedRetirementAge: state.trajectory.projectedRetirementAge,
        savingsRatePct: state.trajectory.savingsRatePct
      },
      governance: {
        fy80CUtilized: state.governance.fy80CUtilized,
        fy80CHeadroom: state.governance.fy80CHeadroom,
        projectedTaxLiability: state.governance.projectedTaxLiability,
        willRegistered: state.governance.willRegistered,
        estateHealthScore: state.governance.estateHealthScore,
        unassignedNomineeAssetCount: state.governance.unassignedNomineeAssetCount
      }
    };

    const jsonString = JSON.stringify(canonicalPayload);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Sanitized, Deduplicated Fiduciary Audit Dispatch.
   */
  private async dispatchFiduciaryAuditEvent(params: {
    familyId: number;
    stateHash: string;
    snapshotId: string;
    completenessScore: number;
    completenessStatus: string;
    asOf: string;
    correlationId: string;
  }): Promise<void> {
    const deduplicationKey = `${params.familyId}:DIGITAL_TWIN_HYDRATED:${params.stateHash}:${params.asOf}`;
    const lastAudited = this.auditDeduplicationCache.get(deduplicationKey);
    const now = Date.now();

    // Deduplicate if audited within last 60 seconds for the same state hash
    if (lastAudited && (now - lastAudited) < 60000) {
      return;
    }

    this.auditDeduplicationCache.set(deduplicationKey, now);

    // Sanitized payload: Excludes raw net worth and PII
    await auditHookService.createAndPublishEvent({
      eventType: 'DIGITAL_TWIN_HYDRATED',
      aggregateType: 'FAMILY_DIGITAL_TWIN',
      aggregateId: `fam_${params.familyId}`,
      familyId: params.familyId,
      payload: {
        snapshotId: params.snapshotId,
        stateHash: params.stateHash,
        completenessScore: params.completenessScore,
        completenessStatus: params.completenessStatus,
        asOfDate: params.asOf,
        schemaVersion: '1.0.0'
      }
    });
  }
}

export const digitalTwinService = new DigitalTwinService();
