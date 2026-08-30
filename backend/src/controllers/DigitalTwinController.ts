import { Request, Response } from 'express';
import { digitalTwinService } from '../services/familyOffice/DigitalTwinService';
import { CorrelationContext } from '../infrastructure/correlation/CorrelationContext';
import { AppError } from '../errors/AppError';

export class DigitalTwinController {
  /**
   * Helper to resolve and strictly authorize the active family scope.
   */
  private resolveAuthorizedFamilyId(req: Request): number {
    const contextFamilyId = CorrelationContext.getFamilyId();
    const authorizedFamilyId = contextFamilyId || 1;
    const queryFamilyId = req.query.familyId ? Number(req.query.familyId) : undefined;

    // If client supplied a query parameter familyId, assert it matches authorization
    if (queryFamilyId !== undefined && queryFamilyId !== authorizedFamilyId) {
      throw new AppError(`Unauthorized access to family ID ${queryFamilyId}. Active authorized family is ${authorizedFamilyId}.`, 403, 'FORBIDDEN');
    }

    return authorizedFamilyId;
  }

  /**
   * GET /api/v1/family-office/digital-twin
   */
  public async getDigitalTwin(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const asOfDate = req.query.asOfDate as string | undefined;

      const result = await digitalTwinService.getDigitalTwin(familyId, asOfDate);

      res.status(200).json({
        success: true,
        data: result.state,
        metadata: {
          snapshotId: result.metadata.snapshotId,
          stateHash: result.metadata.stateHash,
          completeness: result.metadata.completeness,
          sourceFreshness: result.metadata.sourceFreshness,
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.code || 'INTERNAL_ERROR';
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
   * GET /api/v1/family-office/digital-twin/completeness
   */
  public async getCompleteness(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const completeness = await digitalTwinService.getCompleteness(familyId);

      res.status(200).json({
        success: true,
        data: {
          familyId,
          ...completeness
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.code || 'INTERNAL_ERROR';
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
   * GET /api/v1/family-office/completeness/actions
   * or GET /api/v1/family-office/digital-twin/actions
   */
  public async getActionableCompleteness(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const familyId = this.resolveAuthorizedFamilyId(req);
      const result = await digitalTwinService.getActionableCompleteness(familyId);

      res.status(200).json({
        success: true,
        data: result,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          apiVersion: 'v1.0'
        }
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.code || 'INTERNAL_ERROR';
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

export const digitalTwinController = new DigitalTwinController();
