import { Router, Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';

const router = Router();

router.get('/list', async (req: Request, res: Response) => {
  try {
    const familyId = Number(req.query.familyId) || 1;
    const result = await notificationService.getNotifications(familyId);
    res.json({
      success: true,
      data: result.notifications,
      metadata: { unreadCount: result.unreadCount }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
