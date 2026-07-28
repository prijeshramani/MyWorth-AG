import { Router } from 'express';
import { db } from '../db';
import { SQLiteGoalRepository } from '../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from '../services/ProjectionEngineService';
import { GoalPlanningService } from '../services/GoalPlanningService';
import { RetirementPlanningService } from '../services/RetirementPlanningService';
import { CashflowProjectionService } from '../services/CashflowProjectionService';
import { PlanningRecommendationService } from '../services/PlanningRecommendationService';
import { PlanningController } from '../controllers/PlanningController';

const goalRepo = new SQLiteGoalRepository(db);
const projectionEngine = new ProjectionEngineService();
const goalService = new GoalPlanningService(goalRepo, projectionEngine);
const retirementService = new RetirementPlanningService(goalRepo, projectionEngine);
const cashflowService = new CashflowProjectionService(goalRepo, projectionEngine);
const recService = new PlanningRecommendationService(goalRepo, retirementService, goalService);
const planningController = new PlanningController(goalRepo, projectionEngine, goalService, retirementService, cashflowService, recService);

export const planningRouter = Router();

planningRouter.get('/dashboard', planningController.getDashboard);
planningRouter.get('/goals', planningController.getGoals);
planningRouter.get('/retirement', planningController.getRetirement);
planningRouter.get('/projections', planningController.getProjections);
planningRouter.post('/goal', planningController.createGoal);
planningRouter.post('/scenario', planningController.createScenario);
