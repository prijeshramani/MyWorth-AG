import { Router } from 'express';
import { PortfolioController } from '../controllers/PortfolioController';
import { validatePortfolioSummaryQuery } from '../middleware/validationMiddleware';

const router = Router();

router.get('/summary', validatePortfolioSummaryQuery, PortfolioController.getSummary);

export default router;
