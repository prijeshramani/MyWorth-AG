import { db } from '../db';
import { SQLiteRecommendationRuleRepository } from '../repositories/SQLiteRecommendationRuleRepository';
import { SQLiteRecommendationRepository, RecommendationRecord } from '../repositories/SQLiteRecommendationRepository';
import { InsightScoringService } from './InsightScoringService';
import { TaxCalculationEngine } from '../engines/tax/TaxCalculationEngine';
import { EstateHealthService } from './EstateHealthService';
import { GoalPlanningService } from './GoalPlanningService';

export class RecommendationOrchestrator {
  constructor(
    private ruleRepo: SQLiteRecommendationRuleRepository,
    private recRepo: SQLiteRecommendationRepository,
    private scoringService: InsightScoringService,
    private taxEngine: TaxCalculationEngine,
    private estateHealthService: EstateHealthService,
    private goalService: GoalPlanningService
  ) {}

  public evaluateAndGenerateAll(familyId: number): RecommendationRecord[] {
    const rules = this.ruleRepo.getActiveRules();
    const generatedRecs: RecommendationRecord[] = [];

    // 1. Evaluate PROTECTION / TERM INSURANCE (Dynamic HLV vs Actual Cover)
    const protRule = rules.find(r => r.rule_code === 'PROTECTION_TERM_UNDERINSURED');
    if (protRule) {
      const termRow = db.prepare(`
        SELECT COALESCE(SUM(sum_assured), 0) as totalTermCover
        FROM insurance_policies
        WHERE family_id = ?
          AND (policy_type IN ('TERM_INSURANCE', 'TERM_LIFE', 'TERM'))
          AND status = 'ACTIVE'
          AND deleted_at IS NULL
      `).get(familyId) as any;

      const currentCover = Number(termRow?.totalTermCover) || 0;
      const requiredCover = 25000000; // ₹2.5 Cr standard HLV target
      const gap = requiredCover - currentCover;

      if (gap > 0) {
        // Protection gap exists
        const title = protRule.title_template;
        const description = protRule.description_template
          .replace('{currentCover}', (currentCover / 10000000).toFixed(2) + ' Cr')
          .replace('{requiredCover}', (requiredCover / 10000000).toFixed(2) + ' Cr')
          .replace('{gap}', (gap / 10000000).toFixed(2) + ' Cr');

        const rec = this.recRepo.saveRecommendation({
          family_id: familyId,
          rule_id: protRule.id,
          rule_code: protRule.rule_code,
          category: 'PROTECTION',
          journey_id: protRule.journey_id,
          title,
          description,
          priority: protRule.priority_default,
          confidence_pct: 96.0,
          financial_impact_amount: gap,
          urgency: 'IMMEDIATE',
          status: 'ACTIVE',
          source_engines_json: JSON.stringify(['ProtectionEngineService']),
          supporting_evidence_json: JSON.stringify({ currentCover, requiredCover, gap }),
          next_action_json: JSON.stringify({ label: 'Get Term Life Insurance Quotes', path: '/protection' }),
          ai_context_json: JSON.stringify({
            summary: `Increase term life insurance by ₹${(gap / 10000000).toFixed(2)} Cr to cover family liabilities and income replacement.`,
            technicalExplanation: `Human Life Value (HLV) analysis indicates a protection gap of ₹${(gap / 10000000).toFixed(2)} Cr.`,
            sourceEngines: ['ProtectionEngineService'],
            suggestedNextActions: ['Review term life policies', 'Calculate claim settlement ratio']
          })
        });
        generatedRecs.push(rec);
      } else {
        // Fully insured! Generate Optimal Protection confirmation card
        const currentCrFormatted = (currentCover / 10000000).toFixed(2);
        const requiredCrFormatted = (requiredCover / 10000000).toFixed(2);
        const rec = this.recRepo.saveRecommendation({
          family_id: familyId,
          rule_id: protRule.id,
          rule_code: 'PROTECTION_TERM_OPTIMAL',
          category: 'PROTECTION',
          journey_id: protRule.journey_id,
          title: 'Term Life Insurance Target Achieved',
          description: `Your active term life insurance cover of ₹${currentCrFormatted} Cr fully satisfies your Human Life Value (HLV) requirement of ₹${requiredCrFormatted} Cr.`,
          priority: 'LOW',
          confidence_pct: 99.0,
          financial_impact_amount: 0,
          urgency: 'LOW',
          status: 'ACTIVE',
          source_engines_json: JSON.stringify(['ProtectionEngineService']),
          supporting_evidence_json: JSON.stringify({ currentCover, requiredCover, gap: 0 }),
          next_action_json: JSON.stringify({ label: 'View Protection Dashboard', path: '/protection' }),
          ai_context_json: JSON.stringify({
            summary: `Active term coverage of ₹${currentCrFormatted} Cr is optimal.`,
            technicalExplanation: 'Human Life Value (HLV) protection target fully satisfied.',
            sourceEngines: ['ProtectionEngineService'],
            suggestedNextActions: ['Ensure annual premium payment on time']
          })
        });
        generatedRecs.push(rec);
      }
    }

    // 2. Evaluate TAX_80C_OPTIMIZATION rule (Dynamic 80C Asset Accumulation)
    const taxRule = rules.find(r => r.rule_code === 'TAX_80C_OPTIMIZATION');
    if (taxRule) {
      const tax80CRow = db.prepare(`
        SELECT COALESCE(SUM((SELECT price FROM asset_prices WHERE asset_id = a.id ORDER BY date DESC LIMIT 1)), 0) as total80C
        FROM assets a
        LEFT JOIN family_members fm ON a.family_member_id = fm.id
        WHERE (fm.family_id = ? OR a.family_member_id IS NULL)
          AND a.type IN ('EPF', 'PPF', 'SSY', 'ELSS')
      `).get(familyId) as any;

      const total80C = Number(tax80CRow?.total80C) || 0;
      const limit80C = 150000;
      const unutilizedAmount = Math.max(0, limit80C - total80C);
      const taxSaving = Math.round(unutilizedAmount * 0.312);

      if (unutilizedAmount > 0) {
        const title = taxRule.title_template.replace('{taxSaving}', taxSaving.toLocaleString('en-IN'));
        const description = taxRule.description_template
          .replace('{unutilizedAmount}', unutilizedAmount.toLocaleString('en-IN'))
          .replace('{taxSaving}', taxSaving.toLocaleString('en-IN'));

        const rec = this.recRepo.saveRecommendation({
          family_id: familyId,
          rule_id: taxRule.id,
          rule_code: taxRule.rule_code,
          category: 'TAX',
          journey_id: taxRule.journey_id,
          title,
          description,
          priority: taxRule.priority_default,
          confidence_pct: 98.0,
          financial_impact_amount: taxSaving,
          urgency: 'HIGH',
          status: 'ACTIVE',
          source_engines_json: JSON.stringify(['TaxCalculationEngine']),
          supporting_evidence_json: JSON.stringify({ total80C, unutilized80C: unutilizedAmount }),
          next_action_json: JSON.stringify({ label: 'Invest in ELSS Funds', path: '/investments' }),
          ai_context_json: JSON.stringify({ summary: title })
        });
        generatedRecs.push(rec);
      } else {
        // Section 80C is fully utilized!
        const rec = this.recRepo.saveRecommendation({
          family_id: familyId,
          rule_id: taxRule.id,
          rule_code: 'TAX_80C_OPTIMAL',
          category: 'TAX',
          journey_id: taxRule.journey_id,
          title: 'Section 80C Limit Fully Maximized',
          description: `Your household has allocated ₹${total80C.toLocaleString('en-IN')} across EPF, PPF & tax-saving instruments, fully maximizing the ₹1,50,000 Section 80C limit.`,
          priority: 'LOW',
          confidence_pct: 99.0,
          financial_impact_amount: 46800,
          urgency: 'LOW',
          status: 'ACTIVE',
          source_engines_json: JSON.stringify(['TaxCalculationEngine']),
          supporting_evidence_json: JSON.stringify({ total80C, limit80C }),
          next_action_json: JSON.stringify({ label: 'Explore NPS Section 80CCD(1B)', path: '/tax' }),
          ai_context_json: JSON.stringify({ summary: 'Section 80C tax deduction fully utilized.' })
        });
        generatedRecs.push(rec);
      }
    }

    // 3. Evaluate ESTATE_WILL_MISSING rule (Dynamic Net Estate Valuation)
    const estateRule = rules.find(r => r.rule_code === 'ESTATE_WILL_MISSING');
    if (estateRule) {
      const estateHealth = this.estateHealthService.calculateEstateHealth(familyId);
      if (estateHealth.willScore < 20) {
        const netWorthRow = db.prepare(`
          SELECT COALESCE(SUM((SELECT price FROM asset_prices WHERE asset_id = a.id ORDER BY date DESC LIMIT 1)), 0) as totalNetWorth
          FROM assets a
          LEFT JOIN family_members fm ON a.family_member_id = fm.id
          WHERE (fm.family_id = ? OR a.family_member_id IS NULL)
        `).get(familyId) as any;

        const estateValue = Number(netWorthRow?.totalNetWorth) || 5000000;
        const formattedCr = (estateValue / 10000000).toFixed(2);
        const title = estateRule.title_template;
        const description = estateRule.description_template.replace('{estateValue}', formattedCr + ' Cr');

        const rec = this.recRepo.saveRecommendation({
          family_id: familyId,
          rule_id: estateRule.id,
          rule_code: estateRule.rule_code,
          category: 'ESTATE',
          journey_id: estateRule.journey_id,
          title,
          description,
          priority: estateRule.priority_default,
          confidence_pct: 95.0,
          financial_impact_amount: estateValue,
          urgency: 'HIGH',
          status: 'ACTIVE',
          source_engines_json: JSON.stringify(['EstateHealthService', 'KnowledgeGraphQueryService']),
          supporting_evidence_json: JSON.stringify({ willScore: estateHealth.willScore, registeredWillOnRecord: false }),
          next_action_json: JSON.stringify({ label: 'Draft Will & Nominate Executors', path: '/estate' }),
          ai_context_json: JSON.stringify({
            summary: `Register primary testator Will to secure ₹${formattedCr} Cr net estate succession.`,
            technicalExplanation: 'No registered Will on record. Intestate succession laws apply.',
            sourceEngines: ['EstateHealthService'],
            suggestedNextActions: ['Consult estate lawyer', 'Nominate primary executor']
          })
        });
        generatedRecs.push(rec);
      }
    }

    return generatedRecs;
  }
}

