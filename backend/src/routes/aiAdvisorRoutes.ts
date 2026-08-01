import { Router, Request, Response } from 'express';
import { aiAdvisorService } from '../services/ai/AIAdvisorService';
import { aiSkillRegistry } from '../services/ai/AISkillRegistry';
import { aiContextAggregator } from '../services/ai/AIContextAggregator';

const router = Router();

// POST /api/v1/ai/advisor/chat - Process user query via AI Advisor pipeline
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { query, familyId } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const fid = familyId ? parseInt(familyId as string) : 1;
    const response = await aiAdvisorService.processUserQuery(query, fid);
    res.json(response);
  } catch (error: any) {
    console.error('AI Advisor Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI Advisor query.' });
  }
});

// GET /api/v1/ai/advisor/skills - Retrieve registered AI Wealth Skills
router.get('/skills', (req: Request, res: Response) => {
  try {
    const skills = aiSkillRegistry.getAllSkills();
    res.json({ skills });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/ai/advisor/context - Retrieve aggregated AI context & evidence snapshot
router.get('/context', async (req: Request, res: Response) => {
  try {
    const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : 1;
    const context = await aiContextAggregator.getContextForFamily(familyId);
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
