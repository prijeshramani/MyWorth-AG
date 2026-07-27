import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();

router.get('/', HealthController.getOverallHealth);
router.get('/liveness', HealthController.getLiveness);
router.get('/readiness', HealthController.getReadiness);

export default router;
