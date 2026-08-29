import { Router } from 'express';
import { timeMachineController } from '../controllers/TimeMachineController';
import { idempotencyMiddleware } from '../infrastructure/idempotency/idempotencyMiddleware';

const router = Router();

// GET /api/v1/family-office/time-machine?asOfDate=YYYY-MM-DD
router.get('/', (req, res, next) => timeMachineController.getReconstruction(req, res, next));

// POST /api/v1/family-office/time-machine/what-if (Idempotent scenario simulation)
// Note: Idempotency caching is HTTP platform infrastructure; the in-memory simulation engine itself executes 0 domain database writes.
router.post('/what-if', idempotencyMiddleware, (req, res, next) => timeMachineController.simulateWhatIf(req, res, next));

export default router;
