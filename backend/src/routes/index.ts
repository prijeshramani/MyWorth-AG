import { Router } from 'express';
import portfolioRoutes from './portfolioRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportingRoutes from './reportingRoutes';
import { insuranceRouter } from './insuranceRoutes';

const router = Router();

router.use('/portfolio', portfolioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportingRoutes);
router.use('/', insuranceRouter);

export default router;
