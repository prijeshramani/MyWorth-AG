import { Router, Request, Response } from 'express';
import { searchService } from '../services/SearchService';

const router = Router();

router.get('/query', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '');
    const familyIdStr = req.query.familyId as string;
    const familyId = familyIdStr ? parseInt(familyIdStr, 10) : (req as any).user?.family_id;
    if (!familyId) {
      return res.status(400).json({ success: false, error: 'familyId is required in request or user session' });
    }
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
