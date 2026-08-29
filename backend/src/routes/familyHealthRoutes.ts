import { Router } from 'express';
import { familyHealthController } from '../controllers/FamilyHealthController';
import { idempotencyMiddleware } from '../infrastructure/idempotency/idempotencyMiddleware';

const router = Router();

// GET /api/v1/family-office/health - Live calculation of Family Financial Health Index
router.get('/', (req, res, next) => familyHealthController.getHealth(req, res, next));

// GET /api/v1/family-office/health/history - Historical snapshots
router.get('/history', (req, res, next) => familyHealthController.getHistory(req, res, next));

// POST /api/v1/family-office/health/snapshot - Persists point-in-time snapshot with idempotency
router.post('/snapshot', idempotencyMiddleware, (req, res, next) => familyHealthController.createSnapshot(req, res, next));

export default router;
