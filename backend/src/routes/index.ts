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

import aiAdvisorRoutes from './aiAdvisorRoutes';
import aiActionRoutes from './aiActionRoutes';
import { platformRouter } from './platformRoutes';
import itrRoutes from './itrRoutes';

import briefingRoutes from './briefingRoutes';
import searchRoutes from './searchRoutes';
import notificationRoutes from './notificationRoutes';

import { digitalTwinRouter } from './digitalTwinRoutes';
import { lifeEventRouter } from './lifeEventRoutes';
import proactiveObserverRouter from './proactiveObserverRoutes';
import familyHealthRouter from './familyHealthRoutes';
import familyTimelineRouter from './familyTimelineRoutes';

const router = Router();

router.use('/family-office/health', familyHealthRouter);
router.use('/family-office/timeline', familyTimelineRouter);
router.use('/family-office/digital-twin', digitalTwinRouter);
router.use('/family-office/life-events', lifeEventRouter);
router.use('/family-office/proactive', proactiveObserverRouter);
router.use('/auth', authRouter);
router.use('/dx', dxRouter);
router.use('/platform', platformRouter);
router.use('/briefing', briefingRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai/actions', aiActionRoutes);
router.use('/ai/advisor', aiAdvisorRoutes);
router.use('/ai', aiContextRouter);
router.use('/recommendations', recommendationRouter);
router.use('/planning', planningRouter);
router.use('/estate', estateRouter);
router.use('/graph', graphRouter);
router.use('/tax', taxRouter);
router.use('/itr', itrRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportingRoutes);
router.use('/insurance', insuranceRouter);
router.use('/protection', insuranceRouter);

export default router;
