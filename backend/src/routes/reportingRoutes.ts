import { Router } from 'express';
import { ReportingController } from '../controllers/ReportingController';
import { validateReportGenerationBody } from '../middleware/validationMiddleware';

const router = Router();

router.post('/generate', validateReportGenerationBody, ReportingController.generateReport);

export default router;
