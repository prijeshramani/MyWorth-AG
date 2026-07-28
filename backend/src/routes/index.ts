import { Router } from 'express';
import portfolioRoutes from './portfolioRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportingRoutes from './reportingRoutes';
import { insuranceRouter } from './insuranceRoutes';
import { authRouter } from './authRoutes';
import { taxRouter } from './taxRoutes';
import { graphRouter } from './graphRoutes';
import { estateRouter } from './estateRoutes';
import { planningRouter } from './planningRoutes';

const router = Router();

router.use('/auth', authRouter);
router.use('/planning', planningRouter);
router.use('/estate', estateRouter);
router.use('/graph', graphRouter);
router.use('/tax', taxRouter);
router.use('/portfolio', portfolioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportingRoutes);
router.use('/', insuranceRouter);

export default router;
