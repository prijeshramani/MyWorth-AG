import { Router } from 'express';
import portfolioRoutes from './portfolioRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportingRoutes from './reportingRoutes';
import { insuranceRouter } from './insuranceRoutes';
import { authRouter } from './authRoutes';
import { taxRouter } from './taxRoutes';

const router = Router();

router.use('/auth', authRouter);
router.use('/tax', taxRouter);
router.use('/portfolio', portfolioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportingRoutes);
router.use('/', insuranceRouter);

export default router;
