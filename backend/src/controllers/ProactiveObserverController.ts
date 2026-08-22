import { Request, Response } from 'express';
import { proactiveObserverService } from '../services/familyOffice/ProactiveObserverService';
import { proactiveTriggerRepository } from '../repositories/SQLiteProactiveTriggerRepository';
import { CorrelationContext } from '../infrastructure/correlation/CorrelationContext';
import { ProactiveTriggerActionInputSchema, ProactiveTriggerStatusEnum } from '../contracts/familyOfficeContracts';
import { AppError } from '../errors/AppError';

export class ProactiveObserverController {
  private resolveAuthorizedFamilyId(req: Request): number {
    const contextFamilyId = CorrelationContext.getFamilyId();
    const headerFamilyId = req.headers['x-family-id'] ? Number(req.headers['x-family-id']) : undefined;
    const queryFamilyId = req.query.familyId ? Number(req.query.familyId) : undefined;
    const bodyFamilyId = req.body && req.body.familyId ? Number(req.body.familyId) : undefined;

    const authorizedFamilyId = contextFamilyId || headerFamilyId || 1;

    if (queryFamilyId !== undefined && queryFamilyId !== authorizedFamilyId) {
      throw new AppError(`Unauthorized access to family ID ${queryFamilyId}. Active authorized family is ${authorizedFamilyId}.`, 403, 'FORBIDDEN');
    }
    if (bodyFamilyId !== undefined && bodyFamilyId !== authorizedFamilyId) {
      throw new AppError(`Unauthorized access to family ID ${bodyFamilyId}. Active authorized family is ${authorizedFamilyId}.`, 403, 'FORBIDDEN');
    }

    return authorizedFamilyId;
  }

  /**
   * GET /api/v1/family-office/proactive/triggers
   */
  public async getTriggers(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const statusParam = req.query.status as string | undefined;
      const statusFilter = statusParam && ProactiveTriggerStatusEnum.safeParse(statusParam).success
        ? (statusParam as any)
        : undefined;

      const triggers = statusFilter
        ? proactiveTriggerRepository.getTriggers(familyId, statusFilter)
        : proactiveTriggerRepository.getActiveTriggers(familyId);

      res.status(200).json({
        success: true,
        data: triggers,
        metadata: {
          count: triggers.length,
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.errorCode || 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch proactive triggers'
        }
      });
    }
  }

  /**
   * POST /api/v1/family-office/proactive/evaluate
   */
  public async evaluate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const targetRules = req.body.targetRules;

      const result = await proactiveObserverService.evaluateProactiveRules(familyId, { targetRules });

      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.errorCode || 'INTERNAL_ERROR',
          message: err.message || 'Failed to evaluate proactive rules'
        }
      });
    }
  }

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/acknowledge
   */
  public async acknowledge(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const triggerId = req.params.id;

      const result = await proactiveObserverService.acknowledgeTrigger(triggerId, familyId);

      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.errorCode || 'INTERNAL_ERROR',
          message: err.message || 'Failed to acknowledge trigger'
        }
      });
    }
  }

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/snooze
   */
  public async snooze(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const triggerId = req.params.id;
      
      const snoozeDays = req.body.snoozeDays !== undefined 
        ? ProactiveTriggerActionInputSchema.shape.snoozeDays.unwrap().parse(req.body.snoozeDays) 
        : 7;

      const result = await proactiveObserverService.snoozeTrigger(triggerId, familyId, snoozeDays);

      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
      res.status(status).json({
        success: false,
        error: {
          code: err.errorCode || 'VALIDATION_ERROR',
          message: err.message || 'Failed to snooze trigger'
        }
      });
    }
  }

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/dismiss
   */
  public async dismiss(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const triggerId = req.params.id;
      const reason = req.body.reason || req.body.dismissReason || 'User dismissed recommendation';

      const result = await proactiveObserverService.dismissTrigger(triggerId, familyId, reason);

      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.errorCode || 'INTERNAL_ERROR',
          message: err.message || 'Failed to dismiss trigger'
        }
      });
    }
  }

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/resolve
   */
  public async resolve(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const triggerId = req.params.id;
      const reason = req.body.reason || req.body.resolveReason || 'Manual resolution by user';

      const result = await proactiveObserverService.resolveTrigger(triggerId, familyId, reason);

      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        success: false,
        error: {
          code: err.errorCode || 'INTERNAL_ERROR',
          message: err.message || 'Failed to resolve trigger'
        }
      });
    }
  }
}

export const proactiveObserverController = new ProactiveObserverController();
