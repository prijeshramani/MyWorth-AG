import { Router } from 'express';
import { db } from '../db';
import { SQLiteRecommendationRuleRepository } from '../repositories/SQLiteRecommendationRuleRepository';
import { SQLiteRecommendationRepository } from '../repositories/SQLiteRecommendationRepository';
import { InsightScoringService } from '../services/InsightScoringService';
import { RecommendationOrchestrator } from '../services/RecommendationOrchestrator';
import { RecommendationEngineService } from '../services/RecommendationEngineService';
import { TaxCalculationEngine } from '../engines/tax/TaxCalculationEngine';
import { TaxRuleSeedLoader } from '../engines/tax/TaxRuleSeedLoader';
import { SQLiteEstateRepository } from '../repositories/SQLiteEstateRepository';
import { EstateHealthService } from '../services/EstateHealthService';
import { SQLiteGoalRepository } from '../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from '../services/ProjectionEngineService';
import { GoalPlanningService } from '../services/GoalPlanningService';
import { RecommendationController } from '../controllers/RecommendationController';

const ruleRepo = new SQLiteRecommendationRuleRepository(db);
const recRepo = new SQLiteRecommendationRepository(db);
const scoringService = new InsightScoringService();

const taxLoader = new TaxRuleSeedLoader();
const taxEngine = new TaxCalculationEngine();

const estateRepo = new SQLiteEstateRepository(db);
const estateHealthService = new EstateHealthService(estateRepo);

const goalRepo = new SQLiteGoalRepository(db);
const projectionEngine = new ProjectionEngineService();
const goalService = new GoalPlanningService(goalRepo, projectionEngine);

const orchestrator = new RecommendationOrchestrator(ruleRepo, recRepo, scoringService, taxEngine, estateHealthService, goalService);
const engineService = new RecommendationEngineService(recRepo, orchestrator);
const controller = new RecommendationController(recRepo, engineService);

export const recommendationRouter = Router();

recommendationRouter.get('/dashboard', controller.getDashboard);
recommendationRouter.get('/', controller.getRecommendations);
recommendationRouter.get('/:id', controller.getRecommendationById);
recommendationRouter.post('/refresh', controller.refreshRecommendations);
recommendationRouter.post('/:id/accept', controller.acceptRecommendation);
recommendationRouter.post('/:id/dismiss', controller.dismissRecommendation);
recommendationRouter.post('/:id/complete', controller.completeRecommendation);
