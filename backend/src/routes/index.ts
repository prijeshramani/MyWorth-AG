import { Router } from 'express';
import portfolioRoutes from './portfolioRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportingRoutes from './reportingRoutes';

const router = Router();

router.use('/portfolio', portfolioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportingRoutes);

export default router;
