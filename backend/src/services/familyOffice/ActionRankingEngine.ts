import {
  ActionImpactLevel,
  ActionPriorityCategory,
  NextBestAction,
  DigitalTwinState
} from '../../contracts/familyOfficeContracts';

export interface ActionGapInput {
  digitalTwin: DigitalTwinState;
  activeAssetCount: number;
  activePolicyCount: number;
  liquidAssetCount: number;
  taxProfilesCount: number;
  activeGoalsCount: number;
}

export class ActionRankingEngine {
  private static readonly CATEGORY_ORDER: Record<ActionPriorityCategory, number> = {
    DATA_INTEGRITY: 1,
    MISSING_FOUNDATION: 2,
    INTELLIGENCE_ENRICHMENT: 3,
    OPTIONAL_ENRICHMENT: 4
  };

  private static readonly IMPACT_ORDER: Record<ActionImpactLevel, number> = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3
  };

  /**
   * Deterministically evaluates authoritative twin state and record counts
   * to produce the unranked list of active NextBestActions.
   */
  public static analyzeGaps(input: ActionGapInput): NextBestAction[] {
    const actions: NextBestAction[] = [];
    const { digitalTwin, activeAssetCount, activePolicyCount, liquidAssetCount, taxProfilesCount, activeGoalsCount } = input;

    // 1. ACT_LIN_01: Missing Primary Family / Testator Anchor (Correction 1)
    const hasPrimaryHead = digitalTwin.lineage.members.some(m => m.isPrimaryTestator);
    if (digitalTwin.lineage.members.length === 0 || !hasPrimaryHead) {
      actions.push({
        actionId: 'ACT_LIN_01',
        title: 'Add Primary Family Member',
        description: 'Declare the head of family / primary testator and household members.',
        category: 'MISSING_FOUNDATION',
        impactLevel: 'HIGH',
        whyItMatters: 'Life-stage calibration, dependency profiles, and succession planning cannot be evaluated without a primary family anchor.',
        affectedCapabilities: ['FAMILY_FINANCIAL_HEALTH', 'DIGITAL_TWIN', 'ESTATE_SUCCESSION'],
        targetRoute: '/family/members',
        targetDomain: 'LINEAGE'
      });
    }

    // 2. ACT_AST_01: Missing Investment Assets (Grounded in record count)
    if (activeAssetCount === 0) {
      actions.push({
        actionId: 'ACT_AST_01',
        title: 'Import or Add Investment Assets',
        description: 'Upload CAS/CAMS statement or connect broker holdings to build your balance sheet.',
        category: 'MISSING_FOUNDATION',
        impactLevel: 'HIGH',
        whyItMatters: 'Net worth, asset allocation, and wealth growth projections cannot be calculated without asset holdings.',
        affectedCapabilities: ['FINANCIAL_TIME_MACHINE', 'PORTFOLIO_ANALYTICS', 'DIGITAL_TWIN'],
        targetRoute: '/import',
        targetDomain: 'PORTFOLIO'
      });
    }

    // 3. ACT_INS_01: Missing Protection Floor
    if (activePolicyCount === 0) {
      actions.push({
        actionId: 'ACT_INS_01',
        title: 'Add Protection Information',
        description: 'Record active term life or family health insurance policies to establish a safety net.',
        category: 'MISSING_FOUNDATION',
        impactLevel: 'HIGH',
        whyItMatters: 'Family protection shield is unconfigured; untimely earner loss leaves dependents financially exposed.',
        affectedCapabilities: ['PROTECTION_SHIELD', 'FAMILY_FINANCIAL_HEALTH', 'DIGITAL_TWIN'],
        targetRoute: '/protection',
        targetDomain: 'PROTECTION'
      });
    }

    // 4. ACT_LIQ_01: Missing Liquid Reserves
    if (liquidAssetCount === 0) {
      actions.push({
        actionId: 'ACT_LIQ_01',
        title: 'Map Bank Accounts & Cash Reserves',
        description: 'Add primary bank accounts or cash savings to track your liquid reserves.',
        category: 'MISSING_FOUNDATION',
        impactLevel: 'HIGH',
        whyItMatters: 'Emergency liquidity runway in months cannot be calculated without liquid cash balances.',
        affectedCapabilities: ['LIQUIDITY_RUNWAY', 'FAMILY_FINANCIAL_HEALTH', 'PROACTIVE_OBSERVER'],
        targetRoute: '/assets/new',
        targetDomain: 'LIQUIDITY'
      });
    }

    // 5. ACT_TAX_01: Missing Current FY Tax Profile
    if (taxProfilesCount === 0) {
      actions.push({
        actionId: 'ACT_TAX_01',
        title: 'Select Tax Regime & Setup Profile',
        description: 'Configure your current financial year tax regime (Old vs New) and income baseline.',
        category: 'MISSING_FOUNDATION',
        impactLevel: 'MEDIUM',
        whyItMatters: 'Tax What-If optimization and take-home income projections rely on unverified system assumptions.',
        affectedCapabilities: ['TAX_OPTIMIZATION', 'WHAT_IF_SIMULATION'],
        targetRoute: '/tax/planner',
        targetDomain: 'TAX'
      });
    }

    // 6. ACT_EST_01: Missing Will / Succession Declaration
    if (!digitalTwin.governance.willRegistered) {
      actions.push({
        actionId: 'ACT_EST_01',
        title: 'Declare Will / Estate Status',
        description: 'Record whether a registered will or family trust exists to ensure smooth succession.',
        category: 'INTELLIGENCE_ENRICHMENT',
        impactLevel: 'MEDIUM',
        whyItMatters: 'Succession readiness remains unallocated, leaving assets exposed to intestate succession disputes.',
        affectedCapabilities: ['ESTATE_SUCCESSION', 'FAMILY_FINANCIAL_HEALTH'],
        targetRoute: '/estate/wills',
        targetDomain: 'ESTATE'
      });
    }

    // 7. ACT_GOL_01: Missing Financial Goals
    if (activeGoalsCount === 0) {
      actions.push({
        actionId: 'ACT_GOL_01',
        title: 'Set Target Financial Goals',
        description: 'Define your retirement target age or family milestone goals with target horizons.',
        category: 'INTELLIGENCE_ENRICHMENT',
        impactLevel: 'MEDIUM',
        whyItMatters: 'Goal readiness, SIP adequacy, and retirement milestone feasibility cannot be tracked.',
        affectedCapabilities: ['GOAL_TRAJECTORY', 'WHAT_IF_SIMULATION'],
        targetRoute: '/planning/goals',
        targetDomain: 'GOALS'
      });
    }

    return actions;
  }

  /**
   * Pure deterministic 5-Tier Lexicographical Comparator.
   * 1. Priority Category Precedence (A > B > C > D)
   * 2. Impact Level (HIGH > MEDIUM > LOW)
   * 3. Multi-Pillar Scope (Blocks composite health score first)
   * 4. Total Affected Capabilities Count (Descending)
   * 5. Stable Deterministic Tie-Breaker (Alphabetical ASC on actionId)
   */
  public static rankActions(actions: NextBestAction[]): NextBestAction[] {
    return [...actions].sort((a, b) => {
      // Tier 1: Priority Category (A > B > C > D)
      const catDiff = this.CATEGORY_ORDER[a.category] - this.CATEGORY_ORDER[b.category];
      if (catDiff !== 0) return catDiff;

      // Tier 2: Qualitative Impact Level (HIGH > MEDIUM > LOW)
      const impactDiff = this.IMPACT_ORDER[a.impactLevel] - this.IMPACT_ORDER[b.impactLevel];
      if (impactDiff !== 0) return impactDiff;

      // Tier 3: Multi-Pillar Scope (Affects composite health score first)
      const aMulti = a.affectedCapabilities.includes('FAMILY_FINANCIAL_HEALTH') ? 1 : 0;
      const bMulti = b.affectedCapabilities.includes('FAMILY_FINANCIAL_HEALTH') ? 1 : 0;
      if (bMulti !== aMulti) return bMulti - aMulti;

      // Tier 4: Total Affected Capabilities Count (Descending)
      const capDiff = b.affectedCapabilities.length - a.affectedCapabilities.length;
      if (capDiff !== 0) return capDiff;

      // Tier 5: Stable Deterministic Tie-Breaker (Alphabetical ASC on actionId)
      return a.actionId.localeCompare(b.actionId);
    });
  }
}
