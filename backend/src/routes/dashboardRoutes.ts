import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { validateDashboardOverviewQuery } from '../middleware/validationMiddleware';

const router = Router();

router.get('/overview', validateDashboardOverviewQuery, DashboardController.getOverview);

export default router;
