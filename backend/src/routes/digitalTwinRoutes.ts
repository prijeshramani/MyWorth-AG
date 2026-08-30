import { Router } from 'express';
import { digitalTwinController } from '../controllers/DigitalTwinController';

export const digitalTwinRouter = Router();

// GET /api/v1/family-office/digital-twin
digitalTwinRouter.get('/', (req, res) => digitalTwinController.getDigitalTwin(req, res));

// GET /api/v1/family-office/digital-twin/completeness
digitalTwinRouter.get('/completeness', (req, res) => digitalTwinController.getCompleteness(req, res));

// GET /api/v1/family-office/digital-twin/actions
// GET /api/v1/family-office/digital-twin/completeness/actions
digitalTwinRouter.get('/actions', (req, res) => digitalTwinController.getActionableCompleteness(req, res));
digitalTwinRouter.get('/completeness/actions', (req, res) => digitalTwinController.getActionableCompleteness(req, res));

export default digitalTwinRouter;

