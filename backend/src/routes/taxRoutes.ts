import { Router } from 'express';
import { db } from '../db';
import { SQLiteTaxRepository } from '../repositories/SQLiteTaxRepository';
import { familyRepository } from '../repositories/SQLiteFamilyRepository';
import { TaxApplicationService } from '../services/TaxApplicationService';
import { TaxController } from '../controllers/TaxController';
import { TaxRuleSeedLoader } from '../engines/tax/TaxRuleSeedLoader';

// Seed Baseline Rules
TaxRuleSeedLoader.seedTaxRules(db);

const taxRepo = new SQLiteTaxRepository(db);
const taxAppService = new TaxApplicationService(taxRepo, familyRepository);
const taxController = new TaxController(taxAppService);

export const taxRouter = Router();

taxRouter.get('/summary', taxController.getTaxSummary);
taxRouter.get('/regime-comparison', taxController.getTaxSummary);
taxRouter.get('/capital-gains', taxController.getTaxSummary);
taxRouter.get('/deductions', taxController.getTaxSummary);
taxRouter.get('/recommendations', taxController.getTaxSummary);
taxRouter.get('/calendar', taxController.getTaxSummary);
