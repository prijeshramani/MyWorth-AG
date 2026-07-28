import { Router } from 'express';
import { db } from '../db';
import { SQLiteAIContextRepository } from '../repositories/SQLiteAIContextRepository';
import { EvidenceService } from '../services/EvidenceService';
import { AIMemoryService } from '../services/AIMemoryService';
import { AISafetyService } from '../services/AISafetyService';
import { PromptBuilderService } from '../services/PromptBuilderService';
import { AIContextService } from '../services/AIContextService';
import { TaxCalculationEngine } from '../engines/tax/TaxCalculationEngine';
import { TaxRuleSeedLoader } from '../engines/tax/TaxRuleSeedLoader';
import { SQLiteEstateRepository } from '../repositories/SQLiteEstateRepository';
import { EstateHealthService } from '../services/EstateHealthService';
import { SQLiteGoalRepository } from '../repositories/SQLiteGoalRepository';
import { ProjectionEngineService } from '../services/ProjectionEngineService';
import { GoalPlanningService } from '../services/GoalPlanningService';
import { SQLiteRecommendationRuleRepository } from '../repositories/SQLiteRecommendationRuleRepository';
import { SQLiteRecommendationRepository } from '../repositories/SQLiteRecommendationRepository';
import { InsightScoringService } from '../services/InsightScoringService';
import { RecommendationOrchestrator } from '../services/RecommendationOrchestrator';
import { RecommendationEngineService } from '../services/RecommendationEngineService';
import { AIContextController } from '../controllers/AIContextController';

const aiRepo = new SQLiteAIContextRepository(db);
const evidenceService = new EvidenceService(aiRepo);
const memoryService = new AIMemoryService(aiRepo);
const safetyService = new AISafetyService();
const promptBuilder = new PromptBuilderService(aiRepo);

const taxLoader = new TaxRuleSeedLoader();
const taxEngine = new TaxCalculationEngine();

const estateRepo = new SQLiteEstateRepository(db);
const estateService = new EstateHealthService(estateRepo);

const goalRepo = new SQLiteGoalRepository(db);
const projectionEngine = new ProjectionEngineService();
const goalService = new GoalPlanningService(goalRepo, projectionEngine);

const recRuleRepo = new SQLiteRecommendationRuleRepository(db);
const recRepo = new SQLiteRecommendationRepository(db);
const scoringService = new InsightScoringService();
const orchestrator = new RecommendationOrchestrator(recRuleRepo, recRepo, scoringService, taxEngine, estateService, goalService);
const recService = new RecommendationEngineService(recRepo, orchestrator);

const contextService = new AIContextService(aiRepo, evidenceService, taxEngine, estateService, goalService, recService);
const controller = new AIContextController(contextService, memoryService, evidenceService, promptBuilder, safetyService);

export const aiContextRouter = Router();

aiContextRouter.get('/context', controller.getContext);
aiContextRouter.get('/evidence/:id', controller.getEvidence);
aiContextRouter.get('/memory', controller.getMemory);
aiContextRouter.post('/context/refresh', controller.refreshContext);
aiContextRouter.post('/memory', controller.addMemory);
aiContextRouter.post('/prompt/compile', controller.compilePrompt);
