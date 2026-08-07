import { Router, Request, Response } from 'express';
import { searchService } from '../services/SearchService';

const router = Router();

router.get('/query', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');
    const familyId = Number(req.query.familyId) || 1;
    const results = await searchService.search(q, familyId);
    res.json({
      success: true,
      data: results,
      metadata: { totalItems: results.length }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
