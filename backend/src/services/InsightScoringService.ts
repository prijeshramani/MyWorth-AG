import { RecommendationRecord } from '../repositories/SQLiteRecommendationRepository';

export interface RecommendationScoreDTO {
  priorityScore: number;
  impactScore: number;
  urgencyScore: number;
  overallRankScore: number;
}

export class InsightScoringService {
  /**
   * Multi-Dimensional Ranking Algorithm
   * RankScore = 0.35 * ImpactScore + 0.30 * PriorityScore + 0.20 * UrgencyScore + 0.15 * ConfidenceScore
   */
  public calculateScores(rec: Partial<RecommendationRecord>): RecommendationScoreDTO {
    let priorityScore = 50;
    if (rec.priority === 'CRITICAL') priorityScore = 100;
    else if (rec.priority === 'HIGH') priorityScore = 80;
    else if (rec.priority === 'MEDIUM') priorityScore = 60;
    else priorityScore = 40;

    let urgencyScore = 50;
    if (rec.urgency === 'IMMEDIATE') urgencyScore = 100;
    else if (rec.urgency === 'HIGH') urgencyScore = 80;
    else if (rec.urgency === 'MEDIUM') urgencyScore = 60;
    else urgencyScore = 40;

    const impact = rec.financial_impact_amount || 0;
    // Logarithmic impact score normalized to 100 max
    const impactScore = Math.min(100, Math.round(Math.log10(Math.max(1, impact)) * 16.6));

    const confidence = rec.confidence_pct || 90;
    const overallRankScore = Math.round(
      0.35 * impactScore + 0.30 * priorityScore + 0.20 * urgencyScore + 0.15 * confidence
    );

    return {
      priorityScore,
      impactScore,
      urgencyScore,
      overallRankScore
    };
  }
}
