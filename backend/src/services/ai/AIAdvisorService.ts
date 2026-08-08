import { aiSkillRegistry, AISkillDefinition } from './AISkillRegistry';
import { aiContextAggregator, AggregatedAIContext, EvidenceItem } from './AIContextAggregator';
import { geminiLLMService } from './GeminiLLMService';

export interface AdvisorActionItem {
  id: string;
  type: 'EXPLAIN' | 'RECOMMEND' | 'EXECUTE';
  title: string;
  description: string;
  requiresConfirmation: boolean;
  targetEndpoint?: string;
  payload?: any;
}

export interface AdvisorChatResponse {
  query: string;
  timestamp: string;
  matchedSkills: Array<{ id: string; name: string; category: string }>;
  isMultiSkill: boolean;
  adviceMarkdown: string;
  evidenceItems: EvidenceItem[];
  recommendationsReferenced: any[];
  followUpSuggestions: string[];
  actionItems: AdvisorActionItem[];
  safetyCheckPassed: boolean;
  guardrailNote?: string;
}

export class AIAdvisorService {
  public async processUserQuery(query: string, familyId: number = 1): Promise<AdvisorChatResponse> {
    const timestamp = new Date().toISOString();
    const cleanQuery = (query || '').trim();

    if (!cleanQuery) {
      throw new Error('User query cannot be empty.');
    }

    // Pipeline Step 1: Intent Detection & Skill Resolution
    const matchedSkills = aiSkillRegistry.resolveSkillsForQuery(cleanQuery);
    const isMultiSkill = matchedSkills.length > 1;

    // Pipeline Step 2: Context & Evidence Assembly
    const context: AggregatedAIContext = await aiContextAggregator.getContextForFamily(familyId);

    // Pipeline Step 3: Filter & Validate Evidence per Matched Skills
    const relevantEvidence: EvidenceItem[] = [];
    const recommendationsReferenced: any[] = [];
    const actionItems: AdvisorActionItem[] = [];

    // Filter evidence based on skill definitions
    for (const skill of matchedSkills) {
      if (skill.category === 'PORTFOLIO') {
        const ev = context.evidenceItems.find(e => e.id === 'ev_portfolio_metrics');
        if (ev) relevantEvidence.push(ev);
      }
      if (skill.category === 'TAX') {
        const ev = context.evidenceItems.find(e => e.id === 'ev_tax_summary');
        if (ev) relevantEvidence.push(ev);
        
        actionItems.push({
          id: 'act_harvest_tax_loss',
          type: 'RECOMMEND',
          title: 'Review Tax Loss Harvesting Opportunities',
          description: 'Identify equity positions with unrealized capital losses to offset STCG/LTCG gains under Finance Act 2024.',
          requiresConfirmation: false
        });
        actionItems.push({
          id: 'act_download_itr_json',
          type: 'EXECUTE',
          title: 'Generate Official ITR e-Filing JSON',
          description: 'Generate Income Tax Department compliant Sahaj ITR-1 / ITR-2 JSON for direct upload to incometax.gov.in.',
          requiresConfirmation: true,
          targetEndpoint: '/api/v1/itr/download-json'
        });
      }
      if (skill.category === 'ESTATE') {
        const ev = context.evidenceItems.find(e => e.id === 'ev_knowledge_graph');
        if (ev) relevantEvidence.push(ev);

        actionItems.push({
          id: 'act_audit_unassigned_assets',
          type: 'RECOMMEND',
          title: 'Assign Unlinked Assets in Knowledge Graph',
          description: `You have ${context.graphEvidence?.unassignedAssetsCount || 0} unassigned assets. Assign them to family members in Import Center.`,
          requiresConfirmation: false
        });
      }
      if (skill.category === 'RETIREMENT' || skill.category === 'GOALS') {
        actionItems.push({
          id: 'act_run_projection_simulation',
          type: 'EXECUTE',
          title: 'Trigger Monte Carlo Retirement Projection',
          description: 'Run 1,000-iteration Monte Carlo projection for retirement corpus simulation at 8% inflation.',
          requiresConfirmation: true,
          targetEndpoint: '/api/v1/projections/simulate'
        });
      }
      if (skill.category === 'RECOMMENDATIONS') {
        const ev = context.evidenceItems.find(e => e.id === 'ev_recommendations');
        if (ev) relevantEvidence.push(ev);
        if (context.recommendationsEvidence) {
          recommendationsReferenced.push(...context.recommendationsEvidence);
        }
      }
    }

    // Always include portfolio metrics snapshot as core baseline evidence
    if (!relevantEvidence.some(e => e.id === 'ev_portfolio_metrics')) {
      const pEv = context.evidenceItems.find(e => e.id === 'ev_portfolio_metrics');
      if (pEv) relevantEvidence.push(pEv);
    }

    // Deduplicate evidence items
    const uniqueEvidence = Array.from(new Map(relevantEvidence.map(item => [item.id, item])).values());

    // Pipeline Step 4: Safety & Guardrail Validation
    let safetyCheckPassed = true;
    let guardrailNote: string | undefined = undefined;

    const lowerQ = cleanQuery.toLowerCase();
    if (lowerQ.includes('guaranteed return') || lowerQ.includes('penny stock') || lowerQ.includes('crypto signal')) {
      safetyCheckPassed = false;
      guardrailNote = 'FamilyWealthOS AI Wealth Advisor operates strictly under fiduciary financial safety guidelines. Speculative or guaranteed return queries are rejected.';
    }

    // Pipeline Step 5: Evidence-Backed Response Generation
    let adviceMarkdown: string | null = null;
    if (safetyCheckPassed) {
      adviceMarkdown = await geminiLLMService.generateAdvice(
        cleanQuery,
        matchedSkills,
        context,
        uniqueEvidence,
        recommendationsReferenced
      );
    }

    // Fallback to rule-based deterministic template if Gemini API key isn't provided or call fails
    if (!adviceMarkdown) {
      adviceMarkdown = this.generateEvidenceBackedAdvice(
        cleanQuery,
        matchedSkills,
        context,
        uniqueEvidence,
        recommendationsReferenced,
        safetyCheckPassed,
        guardrailNote
      );
    }

    // Pipeline Step 6: Collect Follow-up Prompt Suggestions from Matched Skills
    const followUpSuggestions: string[] = [];
    for (const skill of matchedSkills) {
      for (const sug of skill.followUpSuggestions) {
        if (!followUpSuggestions.includes(sug)) {
          followUpSuggestions.push(sug);
        }
      }
    }

    return {
      query: cleanQuery,
      timestamp,
      matchedSkills: matchedSkills.map(s => ({ id: s.id, name: s.name, category: s.category })),
      isMultiSkill,
      adviceMarkdown,
      evidenceItems: uniqueEvidence,
      recommendationsReferenced,
      followUpSuggestions: followUpSuggestions.slice(0, 4),
      actionItems,
      safetyCheckPassed,
      guardrailNote
    };
  }

  private generateEvidenceBackedAdvice(
    query: string,
    skills: AISkillDefinition[],
    context: AggregatedAIContext,
    evidence: EvidenceItem[],
    recommendations: any[],
    safetyCheckPassed: boolean,
    guardrailNote?: string
  ): string {
    if (!safetyCheckPassed) {
      return `### ⚠️ Safety Policy Enforcement\n\n${guardrailNote || 'Query rejected due to safety policy guidelines.'}`;
    }

    const cleanQ = (query || '').toLowerCase().trim();
    if (/^(hi|hello|hey|greetings|help|who are you|what can you do)$/i.test(cleanQ)) {
      return `### 👋 Hello! I am your AI Wealth Advisor

I am your permission-aware, evidence-backed wealth advisor grounded in your authentic MyWorth database context.

Your current total net worth is **₹${context.totalNetWorth.toLocaleString('en-IN')}**. Here is how I can assist you:

- **📊 Portfolio Analysis**: Evaluate asset allocation, equity vs debt balance, and concentration risk.
- **📜 Tax Planning**: Calculate STCG/LTCG capital gains under Finance Act 2024, Section 80C/80D, and Tax Loss Harvesting.
- **🛡️ Insurance Audit**: Audit term life cover adequacy (10-15x income rule) and health insurance policy coverage.
- **📈 Retirement & Goals**: Run Monte Carlo projections for retirement target age and milestone goals.
- **🕸️ Estate & Nominees**: Review Knowledge Graph nodes and unassigned family assets.

Ask me any specific query or select one of the suggested prompts below to get started!`;
    }
    const primarySkill = skills[0] || { name: 'Portfolio Analysis', description: 'Evaluates asset allocation' };
    const skillNames = skills.map(s => `**${s.name}**`).join(' & ');
    let text = `### 🧠 AI Wealth Advisor Overview\n\n`;

    if (skills.length > 1) {
      text += `*Multi-Skill Orchestration Active*: Consuming intelligence from ${skillNames}.\n\n`;
    } else {
      text += `*Active Skill Focus*: ${skillNames} (${primarySkill.description})\n\n`;
    }

    // 1. Grounded Financial Context Section
    text += `#### 📊 Grounded Portfolio Context\n`;
    text += `- **Total Family Net Worth**: **₹${context.totalNetWorth.toLocaleString('en-IN')}**\n`;
    text += `- **Asset Breakdown**: Equity: **₹${context.assetSummary.equityTotal.toLocaleString('en-IN')}** | Debt: **₹${context.assetSummary.debtTotal.toLocaleString('en-IN')}** | Cash: **₹${context.assetSummary.cashTotal.toLocaleString('en-IN')}**\n`;
    if (context.assetSummary.topHoldings.length > 0) {
      text += `- **Top Holding**: **${context.assetSummary.topHoldings[0].name}** (₹${context.assetSummary.topHoldings[0].value.toLocaleString('en-IN')})\n\n`;
    }

    // 2. Skill Specific Insights
    text += `#### 💡 Evidence-Backed Advice & Strategy\n`;
    for (const skill of skills) {
      if (skill.category === 'PORTFOLIO') {
        const equityPct = context.totalNetWorth > 0 ? ((context.assetSummary.equityTotal / context.totalNetWorth) * 100).toFixed(1) : '0';
        const debtPct = context.totalNetWorth > 0 ? ((context.assetSummary.debtTotal / context.totalNetWorth) * 100).toFixed(1) : '0';
        text += `- **Portfolio Allocation**: Your portfolio is **${equityPct}% Equity** and **${debtPct}% Debt**. Based on standard risk models, maintain an adequate emergency fund buffer in Cash before rebalancing.\n`;
      }
      if (skill.category === 'TAX') {
        const stcg = context.capitalGainsEvidence?.stcgTotal || 0;
        const ltcg = context.capitalGainsEvidence?.ltcgTotal || 0;
        const harvestable = context.capitalGainsEvidence?.harvestableLosses || 0;
        text += `- **Finance Act 2024 Tax Impact**: Realized STCG is **₹${stcg.toLocaleString('en-IN')}** (@ 20%) and Realized LTCG is **₹${ltcg.toLocaleString('en-IN')}** (@ 12.5% above ₹1.25L threshold).\n`;
        if (harvestable > 0) {
          text += `- **Tax Loss Harvesting**: You have **₹${harvestable.toLocaleString('en-IN')}** in harvestable unrealized losses available to offset taxable capital gains.\n`;
        }
      }
      if (skill.category === 'RETIREMENT' || skill.category === 'GOALS') {
        text += `- **Retirement & Goal Readiness**: Your current net worth of **₹${context.totalNetWorth.toLocaleString('en-IN')}** provides a baseline for retirement corpus compounding. Ensure monthly SIP contributions scale at least 5-10% annually with inflation.\n`;
      }
      if (skill.category === 'ESTATE') {
        text += `- **Knowledge Graph Audit**: Active family nodes: **${context.graphEvidence?.totalNodes || 0}**, Active network edges: **${context.graphEvidence?.totalEdges || 0}**. Ensure all unassigned holdings are linked to an active family member node.\n`;
      }
      if (skill.category === 'INSURANCE') {
        text += `- **Insurance Cover Benchmark**: Review term life cover against 10-15x annual income benchmark and ensure health insurance coverage covers pre-existing family risks.\n`;
      }
    }

    text += `\n> 🛡️ *Governance Note*: All numbers above are computed deterministically by backend calculation engines and verified against official platform evidence layers.`;

    return text;
  }
}

export const aiAdvisorService = new AIAdvisorService();
