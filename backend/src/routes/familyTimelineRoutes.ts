import { Router } from 'express';
import { familyTimelineController } from '../controllers/FamilyTimelineController';
import { idempotencyMiddleware } from '../infrastructure/idempotency/idempotencyMiddleware';

const router = Router();

// GET /api/v1/family-office/timeline
router.get('/', (req, res, next) => familyTimelineController.getTimeline(req, res, next));

// POST /api/v1/family-office/timeline/sync (Idempotent sync)
router.post('/sync', idempotencyMiddleware, (req, res, next) => familyTimelineController.syncTimeline(req, res, next));

export default router;
