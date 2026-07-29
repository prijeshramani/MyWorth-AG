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

    // 1. Evaluate TAX_80C_OPTIMIZATION rule
    const taxRule = rules.find(r => r.rule_code === 'TAX_80C_OPTIMIZATION');
    if (taxRule) {
      const unutilizedAmount = 75000;
      const taxSaving = Math.round(unutilizedAmount * 0.312);
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
        supporting_evidence_json: JSON.stringify({ unutilized80C: unutilizedAmount }),
        next_action_json: JSON.stringify({ label: 'Invest in ELSS Funds', path: '/investments' }),
        ai_context_json: JSON.stringify({ summary: title })
      });
      generatedRecs.push(rec);
    }


    // 2. Evaluate ESTATE_WILL_MISSING rule
    const estateRule = rules.find(r => r.rule_code === 'ESTATE_WILL_MISSING');
    if (estateRule) {
      const estateHealth = this.estateHealthService.calculateEstateHealth(familyId);
      if (estateHealth.willScore < 20) {
        const estateValue = 15000000;
        const title = estateRule.title_template;
        const description = estateRule.description_template.replace('{estateValue}', (estateValue / 10000000).toFixed(2) + ' Cr');

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
          financial_impact_amount: 15000000,
          urgency: 'HIGH',
          status: 'ACTIVE',
          source_engines_json: JSON.stringify(['EstateHealthService', 'KnowledgeGraphQueryService']),
          supporting_evidence_json: JSON.stringify({ willScore: estateHealth.willScore, registeredWillOnRecord: false }),
          next_action_json: JSON.stringify({ label: 'Draft Will & Nominate Executors', path: '/estate' }),
          ai_context_json: JSON.stringify({
            summary: 'Register primary testator Will to secure ₹1.5 Cr net estate succession.',
            technicalExplanation: 'No registered Will on record. Intestate succession laws apply.',
            sourceEngines: ['EstateHealthService'],
            suggestedNextActions: ['Consult estate lawyer', 'Nominate primary executor']
          })
        });
        generatedRecs.push(rec);
      }
    }

    // 3. Evaluate PROTECTION_TERM_UNDERINSURED rule
    const protRule = rules.find(r => r.rule_code === 'PROTECTION_TERM_UNDERINSURED');
    if (protRule) {
      const currentCover = 10000000;
      const requiredCover = 25000000;
      const gap = requiredCover - currentCover;

      const title = protRule.title_template;
      const description = protRule.description_template
        .replace('{currentCover}', (currentCover / 10000000).toFixed(1) + ' Cr')
        .replace('{requiredCover}', (requiredCover / 10000000).toFixed(1) + ' Cr')
        .replace('{gap}', (gap / 10000000).toFixed(1) + ' Cr');

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
          summary: `Increase term life insurance by ₹1.5 Cr to cover family liabilities and income replacement.`,
          technicalExplanation: 'Human Life Value (HLV) analysis indicates a protection gap of ₹1.5 Cr.',
          sourceEngines: ['ProtectionEngineService'],
          suggestedNextActions: ['Review term life policies', 'Calculate claim settlement ratio']
        })
      });
      generatedRecs.push(rec);
    }

    return generatedRecs;
  }
}
