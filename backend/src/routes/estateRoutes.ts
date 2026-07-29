import { Router } from 'express';
import { db } from '../db';
import { SQLiteEstateRepository } from '../repositories/SQLiteEstateRepository';
import { EstateHealthService } from '../services/EstateHealthService';
import { EstateSimulationService } from '../services/EstateSimulationService';
import { EmergencyModeService } from '../services/EmergencyModeService';
import { EstateController } from '../controllers/EstateController';

const estateRepo = new SQLiteEstateRepository(db);
const healthService = new EstateHealthService(estateRepo);
const simService = new EstateSimulationService(estateRepo, db);
const emergencyService = new EmergencyModeService(estateRepo, db);
const estateController = new EstateController(estateRepo, healthService, simService, emergencyService);

export const estateRouter = Router();

estateRouter.get('/dashboard', estateController.getDashboard);
estateRouter.get('/health', estateController.getHealth);
estateRouter.get('/wills', estateController.getWills);
estateRouter.get('/trusts', estateController.getTrusts);
estateRouter.get('/emergency', estateController.getEmergency);
estateRouter.get('/simulation/:scenario', estateController.getSimulation);
estateRouter.post('/will', estateController.createWill);
estateRouter.post('/trust', estateController.createTrust);
estateRouter.post('/simulation', estateController.getSimulation);
