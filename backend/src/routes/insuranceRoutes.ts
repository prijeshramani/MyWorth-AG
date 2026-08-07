import { Router } from 'express';
import { db } from '../db';
import { InsuranceRepository } from '../repositories/InsuranceRepository';
import { familyRepository } from '../repositories/SQLiteFamilyRepository';
import { InsuranceApplicationService } from '../services/InsuranceApplicationService';
import { InsuranceController } from '../controllers/InsuranceController';

const insuranceRepo = new InsuranceRepository(db);
const insuranceAppService = new InsuranceApplicationService(insuranceRepo, familyRepository);
const insuranceController = new InsuranceController(insuranceAppService);

export const insuranceRouter = Router();

insuranceRouter.get('/protection/summary', insuranceController.getProtectionSummary);
insuranceRouter.get('/insurance/policies', insuranceController.getPolicies);
insuranceRouter.get('/policies', insuranceController.getPolicies);
insuranceRouter.post('/insurance/policies', insuranceController.createPolicy);
insuranceRouter.post('/policies', insuranceController.createPolicy);
