import { GoogleGenerativeAI } from '@google/generative-ai';
import { AggregatedAIContext, EvidenceItem } from './AIContextAggregator';
import { AISkillDefinition } from './AISkillRegistry';

export class GeminiLLMService {
  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  public async generateAdvice(
    query: string,
    matchedSkills: AISkillDefinition[],
    context: AggregatedAIContext,
    evidence: EvidenceItem[],
    recommendations: any[]
  ): Promise<string | null> {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      return null; // Fallback to rule-based engine when key is missing
    }

    const cleanKey = apiKey.trim();
    const modelCandidates = ['gemini-3.6-flash', 'gemini-2.5-flash'];

    try {
      const genAI = new GoogleGenerativeAI(cleanKey);
      const systemPrompt = this.buildPrompt(query, matchedSkills, context, evidence, recommendations);

      for (const modelName of modelCandidates) {
        const text = await this.callWithExponentialBackoff(genAI, modelName, systemPrompt);
        if (text) {
          return text;
        }
        // Brief 400ms delay between model candidate fallbacks to prevent RPM burst spikes
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      return null;
    } catch (err: any) {
      console.error('Gemini API Integration Error:', err.message || err);
      return null; // Fallback to rule-based template on failure
    }
  }

  private async callWithExponentialBackoff(
    genAI: GoogleGenerativeAI,
    modelName: string,
    prompt: string,
    maxRetries = 3
  ): Promise<string | null> {
    let delayMs = 1000; // Start backoff at 1s, then 2s, then 4s

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        const errMsg = err.message || String(err);
        const isRateLimit = errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED');

        if (isRateLimit && attempt < maxRetries) {
          console.warn(`[Gemini API] 429 Rate limit on [${modelName}] (Attempt ${attempt}/${maxRetries}). Backing off for ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff (1s -> 2s -> 4s)
        } else {
          console.warn(`Gemini API model [${modelName}] attempt ${attempt} failed:`, errMsg);
          if (!isRateLimit) break; // Non-rate-limit error (e.g. 404), skip further retries for this model
        }
      }
    }

    return null;
  }

  private buildPrompt(
    query: string,
    skills: AISkillDefinition[],
    context: AggregatedAIContext,
    evidence: EvidenceItem[],
    recommendations: any[]
  ): string {
    const skillNames = skills.map(s => s.name).join(', ');
    const topHoldingsStr = context.assetSummary.topHoldings
      .map(h => `- ${h.name} (${h.type}): ₹${h.value.toLocaleString('en-IN')}`)
      .join('\n');

    let taxInfo = 'No detailed tax evidence available.';
    if (context.capitalGainsEvidence) {
      taxInfo = `
- Realized STCG (20% rate): ₹${context.capitalGainsEvidence.stcgTotal.toLocaleString('en-IN')}
- Realized LTCG (12.5% rate above ₹1.25L exemption): ₹${context.capitalGainsEvidence.ltcgTotal.toLocaleString('en-IN')}
- LTCG Exemption Used: ₹${context.capitalGainsEvidence.ltcgExemptionUsed.toLocaleString('en-IN')}
- Tax Loss Harvesting Opportunities: ${context.capitalGainsEvidence.taxLossHarvestingOpportunities.length} asset(s) with ₹${context.capitalGainsEvidence.harvestableLosses.toLocaleString('en-IN')} in unrealized losses
      `.trim();
    }

    let recsInfo = 'No active system warnings.';
    if (recommendations && recommendations.length > 0) {
      recsInfo = recommendations
        .slice(0, 5)
        .map(r => `- [${r.severity || 'INFO'}] ${r.title}: ${r.description}`)
        .join('\n');
    }

    return `
You are the AI Wealth Advisor for FamilyWealthOS (MyWorth), a personal financial OS for Indian families.
Your role is to act as a permission-aware, fiduciary wealth management advisor providing evidence-backed, highly practical financial guidance under Indian tax laws (Finance Act 2024) and Indian financial benchmarks.

### USER QUERY
"${query}"

### MATCHED SKILLS
Orchestrated Skills: ${skillNames}

### USER'S REAL FINANCIAL CONTEXT (AUTHENTIC DATABASE DATA)
- **Total Family Net Worth**: ₹${context.totalNetWorth.toLocaleString('en-IN')}
- **Equity Assets**: ₹${context.assetSummary.equityTotal.toLocaleString('en-IN')} (${context.totalNetWorth > 0 ? ((context.assetSummary.equityTotal / context.totalNetWorth) * 100).toFixed(1) : 0}%)
- **Debt Assets**: ₹${context.assetSummary.debtTotal.toLocaleString('en-IN')} (${context.totalNetWorth > 0 ? ((context.assetSummary.debtTotal / context.totalNetWorth) * 100).toFixed(1) : 0}%)
- **Cash / Savings**: ₹${context.assetSummary.cashTotal.toLocaleString('en-IN')} (${context.totalNetWorth > 0 ? ((context.assetSummary.cashTotal / context.totalNetWorth) * 100).toFixed(1) : 0}%)
- **Alternative Assets**: ₹${context.assetSummary.alternativeTotal.toLocaleString('en-IN')}
- **Total Asset Count**: ${context.assetSummary.totalAssets}

**Top Holdings**:
${topHoldingsStr || '- None'}

**Tax Intelligence (Finance Act 2024)**:
${taxInfo}

**Active System Recommendations / Alerts**:
${recsInfo}

**Family Knowledge Graph**:
- Active Nodes: ${context.graphEvidence?.totalNodes || 0}
- Unassigned Assets: ${context.graphEvidence?.unassignedAssetsCount || 0}

---

### INSTRUCTIONS FOR YOUR RESPONSE:
1. Format your response cleanly using Github-flavored Markdown.
2. IF THE USER QUERY IS A GREETING or general query (e.g. "hi", "hello", "hey", "who are you"):
   - Respond with a warm, professional greeting starting with "### 👋 Hello!"
   - Introduce yourself as the MyWorth AI Wealth Advisor.
   - Mention their total Net Worth (₹${context.totalNetWorth.toLocaleString('en-IN')}) briefly.
   - List key capabilities (Portfolio Analysis, Tax Planning under Finance Act 2024, Insurance Audit, Retirement/FIRE Projections, Estate Planning) and ask how you can assist them today.
3. FOR SPECIFIC FINANCIAL QUERIES:
   - Start with header "### 🧠 AI Wealth Advisor Analysis"
   - Use subheadings such as "#### 📊 Portfolio & Context Insights" and "#### 💡 Evidence-Backed Strategy".
   - Address the user's specific query directly and thoroughly using the provided financial data.
   - Reference Indian financial context accurately (e.g. Section 80C, Section 80D, STCG 20%, LTCG 12.5%, 10-15x annual income rule for term cover, emergency fund rule of 6 months expenses).
4. Be direct, encouraging, clear, and actionable.
5. Conclude with a governance line: "\n> 🛡️ *Governance Note*: Advice generated using Google Gemini AI, grounded in your real-time MyWorth database engines."
6. Do NOT make up fake financial figures outside of the numbers provided in the context above.
`.trim();
  }
}

export const geminiLLMService = new GeminiLLMService();
