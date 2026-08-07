import { Router, Request, Response } from 'express';
import { aiMorningBriefingService } from '../services/ai/AIMorningBriefingService';

const router = Router();

router.get('/morning-briefing', async (req: Request, res: Response) => {
  try {
    const familyId = Number(req.query.familyId) || 1;
    const briefing = await aiMorningBriefingService.generateBriefing(familyId);
    res.json({
      success: true,
      data: briefing,
      metadata: { apiVersion: 'v1.0' }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
