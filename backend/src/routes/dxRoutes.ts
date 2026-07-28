import { Router } from 'express';
import { db } from '../db';
import { BackupService } from '../services/BackupService';
import { SystemHealthService } from '../services/SystemHealthService';
import { OnboardingService } from '../services/OnboardingService';
import { DXController } from '../controllers/DXController';

const backupService = new BackupService();
const healthService = new SystemHealthService(backupService);
const onboardingService = new OnboardingService(db);
const controller = new DXController(healthService, backupService, onboardingService);

export const dxRouter = Router();

dxRouter.get('/health', controller.getHealth);
dxRouter.get('/onboarding/status', controller.getOnboardingStatus);
dxRouter.post('/onboarding/complete', controller.completeOnboarding);
dxRouter.get('/backups', controller.listBackups);
dxRouter.post('/backup', controller.createBackup);
dxRouter.post('/restore', controller.restoreBackup);
dxRouter.post('/feedback', controller.saveFeedback);
