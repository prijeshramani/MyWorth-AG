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

insuranceRouter.get('/', insuranceController.getProtectionSummary);
insuranceRouter.get('/overview', insuranceController.getProtectionSummary);
insuranceRouter.get('/protection/summary', insuranceController.getProtectionSummary);
insuranceRouter.get('/summary', insuranceController.getProtectionSummary);
insuranceRouter.get('/insurance/policies', insuranceController.getPolicies);
insuranceRouter.get('/policies', insuranceController.getPolicies);
insuranceRouter.post('/insurance/policies', insuranceController.createPolicy);
insuranceRouter.post('/policies', insuranceController.createPolicy);
insuranceRouter.delete('/insurance/policies/:id', insuranceController.deletePolicy);
insuranceRouter.delete('/policies/:id', insuranceController.deletePolicy);
insuranceRouter.put('/insurance/policies/:id', insuranceController.updatePolicy);
insuranceRouter.put('/policies/:id', insuranceController.updatePolicy);
