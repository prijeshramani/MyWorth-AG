import { Router } from 'express';
import { proactiveObserverController } from '../controllers/ProactiveObserverController';
import { idempotencyMiddleware } from '../infrastructure/idempotency/idempotencyMiddleware';

const router = Router();

// GET /api/v1/family-office/proactive/triggers - Lists triggers
router.get('/triggers', (req, res) => proactiveObserverController.getTriggers(req, res));

// POST /api/v1/family-office/proactive/evaluate - Targeted rule evaluation
router.post('/evaluate', (req, res) => proactiveObserverController.evaluate(req, res));

// POST /api/v1/family-office/proactive/triggers/:id/acknowledge - Acknowledge trigger
router.post('/triggers/:id/acknowledge', idempotencyMiddleware, (req, res) => proactiveObserverController.acknowledge(req, res));

// POST /api/v1/family-office/proactive/triggers/:id/snooze - Snooze trigger (1..30d)
router.post('/triggers/:id/snooze', idempotencyMiddleware, (req, res) => proactiveObserverController.snooze(req, res));

// POST /api/v1/family-office/proactive/triggers/:id/dismiss - Dismiss trigger
router.post('/triggers/:id/dismiss', idempotencyMiddleware, (req, res) => proactiveObserverController.dismiss(req, res));

// POST /api/v1/family-office/proactive/triggers/:id/resolve - Resolve trigger
router.post('/triggers/:id/resolve', idempotencyMiddleware, (req, res) => proactiveObserverController.resolve(req, res));

export default router;
