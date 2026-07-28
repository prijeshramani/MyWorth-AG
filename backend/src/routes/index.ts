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
import { recommendationRouter } from './recommendationRoutes';
import { aiContextRouter } from './aiContextRoutes';
import { dxRouter } from './dxRoutes';

const router = Router();

router.use('/auth', authRouter);
router.use('/dx', dxRouter);
router.use('/ai', aiContextRouter);
router.use('/recommendations', recommendationRouter);
router.use('/planning', planningRouter);
router.use('/estate', estateRouter);
router.use('/graph', graphRouter);
router.use('/tax', taxRouter);
router.use('/portfolio', portfolioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportingRoutes);
router.use('/', insuranceRouter);

export default router;
