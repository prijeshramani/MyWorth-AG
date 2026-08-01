export interface AISkillDefinition {
  id: string;
  name: string;
  category: 'PORTFOLIO' | 'TAX' | 'ESTATE' | 'RETIREMENT' | 'GOALS' | 'RECOMMENDATIONS' | 'INSURANCE';
  description: string;
  supportedIntents: string[];
  contextProviders: string[];
  evidenceProviders: string[];
  permissions: string[];
  promptTemplate: string;
  responseTemplate: string;
  followUpSuggestions: string[];
  safetyPolicy: string;
}

export class AISkillRegistry {
  private skills: Map<string, AISkillDefinition> = new Map();

  constructor() {
    this.registerDefaultSkills();
  }

  private registerDefaultSkills(): void {
    // 1. Portfolio Analysis Skill
    this.registerSkill({
      id: 'portfolio_analysis',
      name: 'Portfolio Analysis',
      category: 'PORTFOLIO',
      description: 'Evaluates asset allocation, equity/debt balance, concentration risk, and net worth distribution.',
      supportedIntents: ['portfolio_summary', 'asset_allocation', 'risk_analysis', 'holding_breakdown', 'net_worth_inquiry'],
      contextProviders: ['AssetMetricsContext', 'AccountHoldingsContext'],
      evidenceProviders: ['AssetRepository', 'PriceRepository'],
      permissions: ['READ_PORTFOLIO'],
      promptTemplate: 'Analyze portfolio distribution, asset categories, and concentration risks based on current asset metrics.',
      responseTemplate: 'Grounded summary of portfolio distribution, risk exposure, and equity vs debt balance.',
      followUpSuggestions: [
        'How can I rebalance my equity and debt allocation?',
        'Which family member holds the highest equity proportion?',
        'What are my top 3 largest asset holdings?'
      ],
      safetyPolicy: 'Only consume aggregated asset metrics. Do not provide stock-picking advice or speculate on future asset prices.'
    });

    // 2. Tax Assistant Skill
    this.registerSkill({
      id: 'tax_assistant',
      name: 'Tax Assistant',
      category: 'TAX',
      description: 'Provides insights on STCG/LTCG capital gains tax under Finance Act 2024, Tax Loss Harvesting, and Section 80C/80D deductions.',
      supportedIntents: ['capital_gains_inquiry', 'tax_loss_harvesting', 'itr_filing_guidance', 'form16_summary', 'deduction_check'],
      contextProviders: ['TaxSummaryContext', 'CapitalGainsContext', 'Form16Context'],
      evidenceProviders: ['CapitalGainsCalculator', 'Form16Parser'],
      permissions: ['READ_TAX_DATA'],
      promptTemplate: 'Provide evidence-backed tax guidance based on Finance Act 2024 STCG (20%) and LTCG (12.5%) limits.',
      responseTemplate: 'Structured tax summary detailing STCG, LTCG exemption usage, harvestable losses, and ITR readiness.',
      followUpSuggestions: [
        'How much LTCG exemption limit (₹1.25L) have I utilized?',
        'What is my recommended Tax Loss Harvesting opportunity?',
        'Generate my official ITR-1 Sahaj JSON payload for e-filing.'
      ],
      safetyPolicy: 'Ground all calculations in official Finance Act 2024 rules. Do not fabricate tax exemptions or filing codes.'
    });

    // 3. Estate Advisor Skill
    this.registerSkill({
      id: 'estate_advisor',
      name: 'Estate Advisor',
      category: 'ESTATE',
      description: 'Reviews family node relationships, asset ownership, nomination gaps, and legacy wealth distribution.',
      supportedIntents: ['estate_summary', 'nomination_audit', 'family_wealth_distribution', 'legacy_planning'],
      contextProviders: ['KnowledgeGraphContext', 'FamilyMemberContext'],
      evidenceProviders: ['KnowledgeGraphRepository', 'FamilyRepository'],
      permissions: ['READ_ESTATE_DATA'],
      promptTemplate: 'Analyze family member nodes, ownership edges, and nomination completeness across accounts and assets.',
      responseTemplate: 'Comprehensive breakdown of family node ownership, unassigned assets, and nomination health.',
      followUpSuggestions: [
        'Which assets are currently unassigned to any family member?',
        'Show me the Knowledge Graph network map for my family.',
        'How is wealth distributed between primary and secondary holders?'
      ],
      safetyPolicy: 'Respect family permissions. Only reference verified Knowledge Graph nodes and edges.'
    });

    // 4. Retirement Coach Skill
    this.registerSkill({
      id: 'retirement_coach',
      name: 'Retirement Coach',
      category: 'RETIREMENT',
      description: 'Evaluates retirement corpus readiness, monthly savings gap, FIRE targets, and inflation-adjusted projections.',
      supportedIntents: ['retirement_readiness', 'fire_target_check', 'corpus_projection', 'savings_gap_analysis'],
      contextProviders: ['ProjectionEngineContext', 'RetirementMetricsContext'],
      evidenceProviders: ['ProjectionEngine'],
      permissions: ['READ_PROJECTIONS'],
      promptTemplate: 'Assess retirement readiness using ProjectionEngine Monte Carlo outputs, inflation rates, and target age.',
      responseTemplate: 'Clear retirement roadmap detailing projected corpus at target age vs required target corpus.',
      followUpSuggestions: [
        'Am I on track to retire at age 55?',
        'How much additional monthly SIP is needed to bridge the retirement gap?',
        'Run a stress-test projection assuming 8% inflation.'
      ],
      safetyPolicy: 'Always cite ProjectionEngine simulation parameters (growth rate, inflation rate, confidence level).'
    });

    // 5. Goal Planner Skill
    this.registerSkill({
      id: 'goal_planner',
      name: 'Goal Planner',
      category: 'GOALS',
      description: 'Tracks milestone goals (education, home purchase, travel), target completion dates, and SIP allocation.',
      supportedIntents: ['goal_status_check', 'goal_sip_calculation', 'milestone_projection', 'goal_prioritization'],
      contextProviders: ['GoalMetricsContext', 'ProjectionEngineContext'],
      evidenceProviders: ['GoalRepository', 'ProjectionEngine'],
      permissions: ['READ_GOALS'],
      promptTemplate: 'Evaluate active goal milestones, current savings progress, and estimated target completion dates.',
      responseTemplate: 'Structured goal progress card detailing completed %, target amount, and required monthly contribution.',
      followUpSuggestions: [
        'Which goals are currently underfunded?',
        'How does increasing my SIP by ₹5,000 impact my home purchase goal?',
        'Show me all active goal target dates.'
      ],
      safetyPolicy: 'Base all goal milestone projections on verified user asset allocations and ProjectionEngine calculations.'
    });

    // 6. Recommendation Explainer Skill
    this.registerSkill({
      id: 'recommendation_explainer',
      name: 'Recommendation Explainer',
      category: 'RECOMMENDATIONS',
      description: 'Explains generated RuleEngine recommendations, trigger conditions, severity, and evidence rationale.',
      supportedIntents: ['explain_recommendation', 'recommendation_audit', 'action_item_inquiry'],
      contextProviders: ['RecommendationEngineContext', 'RuleEngineContext'],
      evidenceProviders: ['RecommendationEngine', 'RuleEngine'],
      permissions: ['READ_RECOMMENDATIONS'],
      promptTemplate: 'Explain why specific recommendations were generated by the RuleEngine and detail their evidence rationale.',
      responseTemplate: 'Transparent explanation of rule triggers, severity levels, underlying calculations, and recommended steps.',
      followUpSuggestions: [
        'Why was an emergency fund warning generated?',
        'Explain the rebalancing recommendation for my equity portfolio.',
        'Show all high-priority recommendations.'
      ],
      safetyPolicy: 'Must cite exact RuleEngine rule IDs, trigger thresholds, and calculation versions. Never invent rules.'
    });

    // 7. Insurance Advisor Skill
    this.registerSkill({
      id: 'insurance_advisor',
      name: 'Insurance Advisor',
      category: 'INSURANCE',
      description: 'Audits term life cover adequacy (10-15x income rule), health insurance protection gaps, and policy status.',
      supportedIntents: ['insurance_audit', 'term_cover_check', 'health_insurance_gap', 'policy_summary'],
      contextProviders: ['InsuranceMetricsContext', 'FamilyIncomeContext'],
      evidenceProviders: ['InsurancePolicyRepository'],
      permissions: ['READ_INSURANCE'],
      promptTemplate: 'Audit family insurance policies against standard protection benchmarks (10-15x annual income for term life).',
      responseTemplate: 'Detailed protection audit specifying active sum assured, gap analysis, and policy renewal dates.',
      followUpSuggestions: [
        'Is my current term life cover adequate for my family size?',
        'Do I have sufficient health insurance coverage?',
        'List all active insurance policies.'
      ],
      safetyPolicy: 'Only assess cover adequacy against established financial benchmarks. Do not endorse specific insurance products.'
    });
  }

  public registerSkill(skill: AISkillDefinition): void {
    this.skills.set(skill.id, skill);
  }

  public getSkill(id: string): AISkillDefinition | undefined {
    return this.skills.get(id);
  }

  public getAllSkills(): AISkillDefinition[] {
    return Array.from(this.skills.values());
  }

  public resolveSkillsForQuery(query: string): AISkillDefinition[] {
    const q = query.toLowerCase();
    const matchedSkills: AISkillDefinition[] = [];

    for (const skill of this.skills.values()) {
      const matchesIntent = skill.supportedIntents.some(intent => q.includes(intent.replace(/_/g, ' ')));
      const matchesCategory = q.includes(skill.category.toLowerCase()) || q.includes(skill.name.toLowerCase());
      
      // Additional keyword matching for rich multi-skill detection
      let keywordMatch = false;
      if (skill.category === 'TAX' && (q.includes('tax') || q.includes('stcg') || q.includes('ltcg') || q.includes('itr') || q.includes('capital gain') || q.includes('80c'))) {
        keywordMatch = true;
      } else if (skill.category === 'RETIREMENT' && (q.includes('retire') || q.includes('fire') || q.includes('corpus') || q.includes('pension'))) {
        keywordMatch = true;
      } else if (skill.category === 'PORTFOLIO' && (q.includes('portfolio') || q.includes('asset') || q.includes('stock') || q.includes('net worth') || q.includes('equity') || q.includes('debt'))) {
        keywordMatch = true;
      } else if (skill.category === 'ESTATE' && (q.includes('estate') || q.includes('nominee') || q.includes('family') || q.includes('graph') || q.includes('legacy'))) {
        keywordMatch = true;
      } else if (skill.category === 'GOALS' && (q.includes('goal') || q.includes('sip') || q.includes('milestone') || q.includes('education') || q.includes('house'))) {
        keywordMatch = true;
      } else if (skill.category === 'INSURANCE' && (q.includes('insurance') || q.includes('term') || q.includes('health') || q.includes('policy') || q.includes('cover'))) {
        keywordMatch = true;
      } else if (skill.category === 'RECOMMENDATIONS' && (q.includes('recommend') || q.includes('alert') || q.includes('rule') || q.includes('advice') || q.includes('why'))) {
        keywordMatch = true;
      }

      if (matchesIntent || matchesCategory || keywordMatch) {
        matchedSkills.push(skill);
      }
    }

    // Default to Portfolio Analysis if no specific skill keywords matched
    if (matchedSkills.length === 0) {
      const defaultSkill = this.skills.get('portfolio_analysis');
      if (defaultSkill) matchedSkills.push(defaultSkill);
    }

    return matchedSkills;
  }
}

export const aiSkillRegistry = new AISkillRegistry();
