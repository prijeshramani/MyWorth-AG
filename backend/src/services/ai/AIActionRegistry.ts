export interface AIActionDefinition {
  id: string;
  name: string;
  ownerEngine: string; // e.g. "AssetMasterEngine", "CapitalGainsCalculator", "KnowledgeGraphRepository", "RuleEngine"
  category: 'PORTFOLIO' | 'TAX' | 'ESTATE' | 'RETIREMENT' | 'RECOMMENDATIONS' | 'SIMULATION';
  description: string;
  preconditions: string[];
  blockingConditions: string[];
  requiredContext: string[];
  requiredEvidence: string[];
  requiredPermissions: string[];
  requiresConfirmation: boolean;
  supportsUndo: boolean;
  rollbackStrategy: string;
  recoverySteps: string;
  backupRequired: boolean;
  auditEvent: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedDuration: string; // e.g. "< 100ms", "1-2 seconds"
  targetEndpoint?: string;
}

export class AIActionRegistry {
  private actions: Map<string, AIActionDefinition> = new Map();

  constructor() {
    this.registerDefaultActions();
  }

  private registerDefaultActions(): void {
    // 1. Refresh Portfolio Valuation
    this.registerAction({
      id: 'REFRESH_PORTFOLIO',
      name: 'Refresh Live Portfolio Prices',
      ownerEngine: 'AssetMasterEngine',
      category: 'PORTFOLIO',
      description: 'Fetches latest market prices from Yahoo Finance / AMFI for equity, mutual funds, and bullion assets.',
      preconditions: ['Internet connectivity available', 'Asset master populated'],
      blockingConditions: ['Sync lock active'],
      requiredContext: ['AssetMetricsContext'],
      requiredEvidence: ['AssetRepository', 'PriceRepository'],
      requiredPermissions: ['READ_PORTFOLIO'],
      requiresConfirmation: false,
      supportsUndo: true,
      rollbackStrategy: 'Restore previous asset_prices cache entries',
      recoverySteps: 'Re-run price sync or restore price table backup',
      backupRequired: false,
      auditEvent: 'EVENT_PORTFOLIO_PRICES_REFRESHED',
      riskLevel: 'LOW',
      expectedDuration: '< 500ms',
      targetEndpoint: '/api/v1/assets'
    });

    // 2. Recalculate Tax & Tax Loss Harvesting
    this.registerAction({
      id: 'RECALCULATE_TAX',
      name: 'Recalculate Capital Gains Tax',
      ownerEngine: 'CapitalGainsCalculator',
      category: 'TAX',
      description: 'Re-runs FIFO transaction lot matching under Finance Act 2024 (20% STCG, 12.5% LTCG) and identifies loss harvesting opportunities.',
      preconditions: ['Transactions table populated', 'Financial year selected'],
      blockingConditions: [],
      requiredContext: ['CapitalGainsContext', 'TaxSummaryContext'],
      requiredEvidence: ['CapitalGainsCalculator'],
      requiredPermissions: ['READ_TAX_DATA'],
      requiresConfirmation: false,
      supportsUndo: false,
      rollbackStrategy: 'N/A (Read-only deterministic calculation)',
      recoverySteps: 'Re-run tax engine calculation',
      backupRequired: false,
      auditEvent: 'EVENT_TAX_RECALCULATED',
      riskLevel: 'LOW',
      expectedDuration: '< 200ms',
      targetEndpoint: '/api/v1/tax/summary'
    });

    // 3. Refresh Knowledge Graph Nodes & Edges
    this.registerAction({
      id: 'REFRESH_GRAPH',
      name: 'Sync Knowledge Graph Relationships',
      ownerEngine: 'KnowledgeGraphRepository',
      category: 'ESTATE',
      description: 'Audits family members, bank accounts, holdings, and policies to synchronize active network graph nodes and edges.',
      preconditions: ['Knowledge graph schema active'],
      blockingConditions: [],
      requiredContext: ['KnowledgeGraphContext'],
      requiredEvidence: ['KnowledgeGraphRepository'],
      requiredPermissions: ['READ_ESTATE_DATA'],
      requiresConfirmation: false,
      supportsUndo: true,
      rollbackStrategy: 'Restore graph_nodes and graph_edges status flags',
      recoverySteps: 'Re-run graph relationship sync',
      backupRequired: false,
      auditEvent: 'EVENT_GRAPH_SYNCED',
      riskLevel: 'LOW',
      expectedDuration: '< 300ms',
      targetEndpoint: '/api/v1/graph/sync'
    });

    // 4. Generate Official ITR e-Filing JSON
    this.registerAction({
      id: 'GENERATE_ITR_JSON',
      name: 'Generate Official ITR e-Filing JSON',
      ownerEngine: 'ITRSchemaBuilder',
      category: 'TAX',
      description: 'Generates Income Tax Department compliant Sahaj ITR-1 / ITR-2 JSON payload for direct upload to incometax.gov.in.',
      preconditions: ['PAN number valid', 'Family member selected', 'Tax profile complete'],
      blockingConditions: ['Missing Form 16 / TDS records'],
      requiredContext: ['TaxSummaryContext', 'Form16Context'],
      requiredEvidence: ['CapitalGainsCalculator', 'Form16Parser'],
      requiredPermissions: ['GENERATE_ITR'],
      requiresConfirmation: true,
      supportsUndo: false,
      rollbackStrategy: 'Delete generated local JSON file artifact',
      recoverySteps: 'Re-generate ITR JSON with updated family profile',
      backupRequired: false,
      auditEvent: 'EVENT_ITR_JSON_GENERATED',
      riskLevel: 'MEDIUM',
      expectedDuration: '1-2 seconds',
      targetEndpoint: '/api/v1/itr/download-json'
    });

    // 5. Refresh AI Context & Evidence Snapshots
    this.registerAction({
      id: 'REFRESH_AI_CONTEXT',
      name: 'Refresh AI Evidence Snapshots',
      ownerEngine: 'AIContextAggregator',
      category: 'PORTFOLIO',
      description: 'Re-aggregates permission-aware evidence snapshots across portfolio metrics, tax summaries, projections, and recommendations.',
      preconditions: ['Database active'],
      blockingConditions: [],
      requiredContext: ['AggregatedAIContext'],
      requiredEvidence: ['AssetRepository', 'CapitalGainsCalculator', 'RecommendationEngine'],
      requiredPermissions: ['READ_PORTFOLIO'],
      requiresConfirmation: false,
      supportsUndo: false,
      rollbackStrategy: 'N/A (Read-only context refresh)',
      recoverySteps: 'Re-run AI context aggregator',
      backupRequired: false,
      auditEvent: 'EVENT_AI_CONTEXT_REFRESHED',
      riskLevel: 'LOW',
      expectedDuration: '< 200ms',
      targetEndpoint: '/api/v1/ai/advisor/context'
    });

    // 6. Run Monte Carlo Retirement Simulation
    this.registerAction({
      id: 'RUN_RETIREMENT_SIMULATION',
      name: 'Run Retirement Monte Carlo Simulation',
      ownerEngine: 'ProjectionEngine',
      category: 'RETIREMENT',
      description: 'Executes 1,000-iteration Monte Carlo simulation for retirement corpus readiness assuming 8% inflation and variable equity growth.',
      preconditions: ['Projection engine active', 'Target retirement age set'],
      blockingConditions: [],
      requiredContext: ['ProjectionEngineContext'],
      requiredEvidence: ['ProjectionEngine'],
      requiredPermissions: ['READ_PROJECTIONS'],
      requiresConfirmation: true,
      supportsUndo: true,
      rollbackStrategy: 'Delete transient simulation snapshot',
      recoverySteps: 'Re-run simulation with baseline parameters',
      backupRequired: false,
      auditEvent: 'EVENT_RETIREMENT_SIMULATION_EXECUTED',
      riskLevel: 'LOW',
      expectedDuration: '1-3 seconds',
      targetEndpoint: '/api/v1/projections/simulate'
    });

    // 7. Refresh Rule Engine Recommendations
    this.registerAction({
      id: 'REFRESH_RECOMMENDATIONS',
      name: 'Re-evaluate Rule Engine Rules',
      ownerEngine: 'RecommendationEngine',
      category: 'RECOMMENDATIONS',
      description: 'Re-evaluates active rule triggers (emergency fund, rebalancing, tax harvesting) and generates updated action recommendations.',
      preconditions: ['RuleEngine active'],
      blockingConditions: [],
      requiredContext: ['RuleEngineContext'],
      requiredEvidence: ['RuleEngine', 'RecommendationEngine'],
      requiredPermissions: ['READ_RECOMMENDATIONS'],
      requiresConfirmation: false,
      supportsUndo: false,
      rollbackStrategy: 'Re-evaluate rules',
      recoverySteps: 'Reset recommendation status flags',
      backupRequired: false,
      auditEvent: 'EVENT_RECOMMENDATIONS_REFRESHED',
      riskLevel: 'LOW',
      expectedDuration: '< 300ms',
      targetEndpoint: '/api/v1/recommendations'
    });

    // 8. Apply Asset Allocation Rebalancing Plan
    this.registerAction({
      id: 'APPLY_REBALANCING_PLAN',
      name: 'Apply Portfolio Rebalancing Target Plan',
      ownerEngine: 'RebalancingEngine',
      category: 'PORTFOLIO',
      description: 'Generates target buy/sell rebalancing orders to bring equity/debt ratio back to target asset allocation.',
      preconditions: ['Target asset allocation defined', 'Holdings active'],
      blockingConditions: ['Unsettled transactions pending'],
      requiredContext: ['AssetMetricsContext', 'AccountHoldingsContext'],
      requiredEvidence: ['AssetRepository', 'RuleEngine'],
      requiredPermissions: ['EXECUTE_REBALANCING'],
      requiresConfirmation: true,
      supportsUndo: true,
      rollbackStrategy: 'Revert draft rebalancing order items',
      recoverySteps: 'Revert rebalancing order state',
      backupRequired: true,
      auditEvent: 'EVENT_REBALANCING_PLAN_APPLIED',
      riskLevel: 'HIGH',
      expectedDuration: '1-2 seconds',
      targetEndpoint: '/api/v1/planning/rebalance'
    });

    // 9. Audit Unassigned Assets in Graph
    this.registerAction({
      id: 'AUDIT_UNASSIGNED_ASSETS',
      name: 'Link Unassigned Assets to Family Nodes',
      ownerEngine: 'KnowledgeGraphRepository',
      category: 'ESTATE',
      description: 'Identifies unassigned assets and links them to primary family member nodes in the Knowledge Graph.',
      preconditions: ['Family members exist'],
      blockingConditions: [],
      requiredContext: ['KnowledgeGraphContext'],
      requiredEvidence: ['FamilyRepository', 'AssetRepository'],
      requiredPermissions: ['UPDATE_ESTATE'],
      requiresConfirmation: true,
      supportsUndo: true,
      rollbackStrategy: 'Unlink modified asset family_member_id references',
      recoverySteps: 'Re-assign asset to default head member',
      backupRequired: false,
      auditEvent: 'EVENT_UNASSIGNED_ASSETS_AUDITED',
      riskLevel: 'MEDIUM',
      expectedDuration: '< 400ms',
      targetEndpoint: '/api/v1/graph/auto-assign'
    });
  }

  public registerAction(action: AIActionDefinition): void {
    this.actions.set(action.id, action);
  }

  public getAction(id: string): AIActionDefinition | undefined {
    return this.actions.get(id);
  }

  public getAllActions(): AIActionDefinition[] {
    return Array.from(this.actions.values());
  }

  public resolveActionsForCategory(category: string): AIActionDefinition[] {
    return this.getAllActions().filter(a => a.category.toLowerCase() === category.toLowerCase());
  }
}

export const aiActionRegistry = new AIActionRegistry();
