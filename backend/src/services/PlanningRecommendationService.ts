import { SQLiteGoalRepository, GoalRecommendationRecord } from '../repositories/SQLiteGoalRepository';
import { RetirementPlanningService } from './RetirementPlanningService';
import { GoalPlanningService } from './GoalPlanningService';

export class PlanningRecommendationService {
  constructor(
    private goalRepo: SQLiteGoalRepository,
    private retirementService: RetirementPlanningService,
    private goalService: GoalPlanningService
  ) {}

  public generatePlanningRecommendations(familyId: number): GoalRecommendationRecord[] {
    const existingRecs = this.goalRepo.getRecommendations(familyId);
    if (existingRecs.length > 0) return existingRecs;

    const retirement = this.retirementService.getRetirementAnalysis(familyId);

    // Generate baseline actionable recommendations
    const rec1 = this.goalRepo.addRecommendation({
      family_id: familyId,
      recommendation_type: 'STEP_UP_SIP',
      title: 'Step Up Monthly Retirement SIP by 10% Annually',
      description: `Increasing retirement SIP by 10% annually closes the corpus shortfall of ₹${(retirement.corpusRequiredAtRetirement - retirement.corpusProjectedAtRetirement).toLocaleString('en-IN')} by age 60.`,
      priority: 'HIGH',
      confidence_pct: 95.0,
      time_horizon: 'SHORT_TERM',
      status: 'ACTIVE'
    });

    const rec2 = this.goalRepo.addRecommendation({
      family_id: familyId,
      recommendation_type: 'EMERGENCY_FUND',
      title: 'Maintain 6 Months Expenses in Liquid Mutual Funds',
      description: 'Allocate ₹7,20,000 to Liquid Arbitrage Funds to guarantee immediate emergency liquidity.',
      priority: 'HIGH',
      confidence_pct: 98.0,
      time_horizon: 'IMMEDIATE',
      status: 'ACTIVE'
    });

    return [rec1, rec2];
  }
}
