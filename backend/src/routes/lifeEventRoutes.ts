import { Router } from 'express';
import { lifeEventController } from '../controllers/LifeEventController';
import { idempotencyMiddleware } from '../infrastructure/idempotency/idempotencyMiddleware';

export const lifeEventRouter = Router();

// POST /api/v1/family-office/life-events/declare
lifeEventRouter.post('/declare', idempotencyMiddleware, (req, res) => lifeEventController.declareLifeEvent(req, res));

// GET /api/v1/family-office/life-events/candidates
lifeEventRouter.get('/candidates', (req, res) => lifeEventController.getCandidates(req, res));

// GET /api/v1/family-office/life-events
lifeEventRouter.get('/', (req, res) => lifeEventController.getLifeEvents(req, res));

// GET /api/v1/family-office/life-events/:id/consequences
lifeEventRouter.get('/:id/consequences', (req, res) => lifeEventController.getConsequences(req, res));

// POST /api/v1/family-office/life-events/:id/process
lifeEventRouter.post('/:id/process', idempotencyMiddleware, (req, res) => lifeEventController.processEvent(req, res));

// POST /api/v1/family-office/life-events/:id/dismiss
lifeEventRouter.post('/:id/dismiss', idempotencyMiddleware, (req, res) => lifeEventController.dismissEvent(req, res));

export default lifeEventRouter;
