import { SQLiteGoalRepository, FinancialGoalRecord } from '../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from './ProjectionEngineService';

export interface GoalHealthDTO {
  overallScore: number;
  ratingLabel: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  goalsCount: number;
  goalsOnTrackCount: number;
  goalsDelayedCount: number;
  totalTargetCorpus: number;
  totalProjectedCorpus: number;
}

export class GoalPlanningService {
  constructor(
    private goalRepo: SQLiteGoalRepository,
    private projectionEngine: ProjectionEngineService
  ) {}

  public getGoalsSummary(familyId: number): { goals: FinancialGoalRecord[]; health: GoalHealthDTO } {
    const goals = this.goalRepo.getGoals(familyId);
    const assumptions = this.goalRepo.getOrCreateAssumptions(familyId);

    let totalTarget = 0;
    let totalProjected = 0;
    let onTrackCount = 0;

    for (const g of goals) {
      totalTarget += g.target_amount;
      const years = Math.max(1, g.target_year - new Date().getFullYear());
      
      const proj = this.projectionEngine.projectCorpus({
        initialLumpSum: g.current_allocated_amount,
        monthlySip: g.monthly_sip_amount,
        sipStepUpPct: assumptions.sip_step_up_pct,
        expectedReturnPct: g.expected_return_pct,
        inflationPct: g.inflation_pct,
        years
      });

      totalProjected += proj.totalProjectedCorpus;
      if (proj.totalProjectedCorpus >= g.target_amount) {
        onTrackCount++;
      }
    }

    const healthScore = goals.length === 0 ? 0 : Math.min(100, Math.round((totalProjected / (totalTarget || 1)) * 100));
    let ratingLabel: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' = goals.length === 0 ? 'NEEDS_ATTENTION' : 'GOOD';
    if (healthScore >= 90) ratingLabel = 'OPTIMAL';
    else if (healthScore >= 75) ratingLabel = 'GOOD';
    else if (healthScore >= 50) ratingLabel = 'NEEDS_ATTENTION';
    else ratingLabel = 'CRITICAL';

    return {
      goals,
      health: {
        overallScore: healthScore,
        ratingLabel,
        goalsCount: goals.length,
        goalsOnTrackCount: onTrackCount,
        goalsDelayedCount: goals.length - onTrackCount,
        totalTargetCorpus: Math.round(totalTarget),
        totalProjectedCorpus: Math.round(totalProjected)
      }
    };
  }

  public createGoal(familyId: number, goalData: Omit<FinancialGoalRecord, 'id' | 'created_at'>): FinancialGoalRecord {
    return this.goalRepo.createGoal({ ...goalData, family_id: familyId });
  }
}
