import { Request, Response } from 'express';
import { lifeEventEngineService } from '../services/familyOffice/LifeEventEngineService';
import { lifeEventRepository } from '../repositories/SQLiteLifeEventRepository';
import { CorrelationContext } from '../infrastructure/correlation/CorrelationContext';
import { AppError } from '../errors/AppError';

export class LifeEventController {
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
   * POST /api/v1/family-office/life-events/declare
   */
  public async declareLifeEvent(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const input = {
        ...req.body,
        familyId
      };

      const result = await lifeEventEngineService.declareLifeEvent(input);

      res.status(201).json({
        success: true,
        data: {
          event: result.event,
          consequence: result.consequence
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
      const errorCode = err.errorCode || (err.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: err.message
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    }
  }

  /**
   * GET /api/v1/family-office/life-events
   */
  public async getLifeEvents(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const statusFilter = req.query.status as string | undefined;

      const events = lifeEventRepository.findByFamilyId(familyId, statusFilter);

      res.status(200).json({
        success: true,
        data: events,
        metadata: {
          count: events.length,
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'INTERNAL_ERROR';
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: err.message
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    }
  }

  /**
   * GET /api/v1/family-office/life-events/candidates
   */
  public async getCandidates(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const candidates = await lifeEventEngineService.detectCandidates(familyId);

      res.status(200).json({
        success: true,
        data: candidates,
        metadata: {
          count: candidates.length,
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'INTERNAL_ERROR';
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: err.message
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    }
  }

  /**
   * GET /api/v1/family-office/life-events/:id/consequences
   */
  public async getConsequences(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const eventId = Number(req.params.id);

      const event = lifeEventRepository.findById(eventId);
      if (!event || event.family_id !== familyId) {
        throw new AppError(`Life event with ID ${eventId} not found`, 404, 'NOT_FOUND');
      }

      const consequence = await lifeEventEngineService.evaluateConsequences(eventId);

      res.status(200).json({
        success: true,
        data: consequence,
        metadata: {
          eventId,
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'INTERNAL_ERROR';
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: err.message
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    }
  }

  /**
   * POST /api/v1/family-office/life-events/:id/process
   */
  public async processEvent(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const eventId = Number(req.params.id);

      const event = lifeEventRepository.findById(eventId);
      if (!event || event.family_id !== familyId) {
        throw new AppError(`Life event with ID ${eventId} not found`, 404, 'NOT_FOUND');
      }

      const updated = await lifeEventEngineService.processLifeEvent(eventId, 'PROCESS');

      res.status(200).json({
        success: true,
        data: updated,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'INTERNAL_ERROR';
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: err.message
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    }
  }

  /**
   * POST /api/v1/family-office/life-events/:id/dismiss
   */
  public async dismissEvent(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const eventId = Number(req.params.id);
      const reason = req.body?.reason;

      const event = lifeEventRepository.findById(eventId);
      if (!event || event.family_id !== familyId) {
        throw new AppError(`Life event with ID ${eventId} not found`, 404, 'NOT_FOUND');
      }

      const updated = await lifeEventEngineService.processLifeEvent(eventId, 'DISMISS', reason);

      res.status(200).json({
        success: true,
        data: updated,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'INTERNAL_ERROR';
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: err.message
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    }
  }
}

export const lifeEventController = new LifeEventController();
