import { Request, Response, NextFunction } from 'express';
import { familyTimelineService } from '../services/familyOffice/FamilyTimelineService';
import { CorrelationContext } from '../infrastructure/correlation/CorrelationContext';
import { TimelineQueryFilterSchema } from '../contracts/familyOfficeContracts';
import { ValidationError, AppError } from '../errors/AppError';

export class FamilyTimelineController {
  /**
   * GET /api/v1/family-office/timeline
   * Queries chronological timeline ledger with multi-dimensional filtering.
   */
  public async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = CorrelationContext.getFamilyId();
      if (!familyId) {
        throw new ValidationError('Authentication required: familyId missing from context');
      }

      const queryParams: any = { ...req.query };
      if (queryParams.familyMemberId) queryParams.familyMemberId = Number(queryParams.familyMemberId);
      if (queryParams.minAmount) queryParams.minAmount = Number(queryParams.minAmount);
      if (queryParams.limit) queryParams.limit = Number(queryParams.limit);
      if (queryParams.offset) queryParams.offset = Number(queryParams.offset);
      if (queryParams.includeScheduled !== undefined) {
        queryParams.includeScheduled = queryParams.includeScheduled === 'true' || queryParams.includeScheduled === true;
      }

      const parsedFilter = TimelineQueryFilterSchema.safeParse(queryParams);
      if (!parsedFilter.success) {
        throw new ValidationError(`Invalid query parameters: ${parsedFilter.error.message}`);
      }

      const result = familyTimelineService.getTimeline(familyId, parsedFilter.data);

      res.status(200).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/family-office/timeline/sync
   * Idempotent on-demand synchronization of multi-domain timeline events.
   */
  public async syncTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyId = CorrelationContext.getFamilyId();
      if (!familyId) {
        throw new ValidationError('Authentication required: familyId missing from context');
      }

      const result = await familyTimelineService.syncFamilyTimeline(familyId);

      res.status(200).json({
        status: 'SUCCESS',
        message: 'Timeline successfully synchronized',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const familyTimelineController = new FamilyTimelineController();
