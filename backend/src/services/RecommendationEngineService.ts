import { db } from '../db';
import { SQLiteRecommendationRepository, RecommendationRecord, RecommendationJourneyRecord } from '../repositories/SQLiteRecommendationRepository';
import { RecommendationOrchestrator } from './RecommendationOrchestrator';

export interface DashboardInsightsDTO {
  totalOpenImpactAmount: number;
  criticalCount: number;
  highCount: number;
  activeRecommendations: RecommendationRecord[];
  journeys: RecommendationJourneyRecord[];
  history: any[];
}

export class RecommendationEngineService {
  constructor(
    private recRepo: SQLiteRecommendationRepository,
    private orchestrator: RecommendationOrchestrator
  ) {}

  public getDashboardInsights(familyId: number): DashboardInsightsDTO {
    // Evaluate active rules against live data
    this.orchestrator.evaluateAndGenerateAll(familyId);

    const activeRecs = this.recRepo.getRecommendations(familyId, 'ACTIVE');

    let journeys = this.recRepo.getJourneys(familyId);
    if (journeys.length === 0) {
      const j1 = this.recRepo.saveJourney({
        family_id: familyId,
        journey_code: 'TAX_OPTIMISATION',
        title: 'FY2025-26 Tax Optimisation Plan',
        description: 'Maximize 80C deductions, NPS Tier-1 tax benefits, and tax-loss harvesting.',
        total_steps: 3,
        completed_steps: 1,
        status: 'IN_PROGRESS'
      });
      const j2 = this.recRepo.saveJourney({
        family_id: familyId,
        journey_code: 'WEALTH_PROTECTION',
        title: 'Comprehensive Family Wealth Shield',
        description: 'Close term life insurance gaps and establish 6-month liquid emergency reserves.',
        total_steps: 4,
        completed_steps: 2,
        status: 'IN_PROGRESS'
      });
      journeys = [j1, j2];
    }

    const totalOpenImpactAmount = activeRecs.reduce((acc, r) => acc + r.financial_impact_amount, 0);
    const criticalCount = activeRecs.filter(r => r.priority === 'CRITICAL').length;
    const highCount = activeRecs.filter(r => r.priority === 'HIGH').length;
    const history = this.recRepo.getHistory(familyId);

    return {
      totalOpenImpactAmount,
      criticalCount,
      highCount,
      activeRecommendations: activeRecs,
      journeys,
      history
    };
  }

  public refreshRecommendations(familyId: number): RecommendationRecord[] {
    db.prepare("DELETE FROM recommendations WHERE family_id = ?").run(familyId);
    return this.orchestrator.evaluateAndGenerateAll(familyId);
  }

  public updateRecommendationStatus(id: number, familyId: number, status: RecommendationRecord['status'], reason?: string): void {
    this.recRepo.updateStatus(id, familyId, status, reason);
  }

  // AI Advisor Context Helpers (Consumed by Phase 7 AI Advisor)
  public getTopRecommendations(familyId: number, limit: number = 5): RecommendationRecord[] {
    const activeRecs = this.recRepo.getRecommendations(familyId, 'ACTIVE');
    return activeRecs.slice(0, limit);
  }

  public explainRecommendation(id: number): any {
    const rec = this.recRepo.getRecommendationById(id);
    if (!rec) return null;
    return {
      recommendationId: rec.id,
      title: rec.title,
      description: rec.description,
      whyGenerated: `Triggered by rule ${rec.rule_code} under ${rec.category} category.`,
      sourceEngines: JSON.parse(rec.source_engines_json || '[]'),
      supportingEvidence: JSON.parse(rec.supporting_evidence_json || '{}'),
      nextAction: JSON.parse(rec.next_action_json || '{}'),
      aiContext: JSON.parse(rec.ai_context_json || '{}')
    };
  }
}
