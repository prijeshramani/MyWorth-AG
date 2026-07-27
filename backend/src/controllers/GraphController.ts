import { Request, Response, NextFunction } from 'express';
import { GraphQueryService } from '../services/GraphQueryService';
import { RelationshipService } from '../services/RelationshipService';

export class GraphController {
  constructor(
    private graphQueryService: GraphQueryService,
    private relationshipService: RelationshipService
  ) {}

  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string;
      if (!familyIdStr) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Query parameter familyId is required.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const familyId = parseInt(familyIdStr, 10);
      this.relationshipService.syncKnowledgeGraphFromDomainEntities(familyId);

      const overview = this.graphQueryService.getOverviewGraph(familyId);
      const readiness = this.graphQueryService.evaluateEstateReadiness(familyId);

      res.status(200).json({
        success: true,
        data: {
          ...overview,
          estateReadiness: readiness
        },
        metadata: { executionTimeMs: 5, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system',
        warnings: [],
        errors: []
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getPersonGraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const personIdStr = req.params.id;
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);
      const personId = parseInt(personIdStr, 10);

      const ego = this.graphQueryService.getPersonEgoNetwork(familyId, personId);

      res.status(200).json({
        success: true,
        data: ego,
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: err.message },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }
      next(err);
    }
  };

  public getAssetGraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assetIdStr = req.params.id;
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);
      const assetId = parseInt(assetIdStr, 10);

      const tree = this.graphQueryService.getAssetOwnershipTree(familyId, assetId);

      res.status(200).json({
        success: true,
        data: tree,
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: err.message },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }
      next(err);
    }
  };

  public createRelationship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId, sourceNodeType, sourceEntityId, targetNodeType, targetEntityId, relationshipCode, weight } = req.body;

      if (!familyId || !sourceNodeType || !sourceEntityId || !targetNodeType || !targetEntityId || !relationshipCode) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required relationship payload attributes.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const edge = this.relationshipService.createRelationship(
        familyId,
        sourceNodeType,
        sourceEntityId,
        targetNodeType,
        targetEntityId,
        relationshipCode,
        weight || 1.0
      );

      res.status(201).json({
        success: true,
        data: edge,
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      if (err.message && (err.message.includes('prohibited') || err.message.includes('not found'))) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: err.message },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }
      next(err);
    }
  };

  public deleteRelationship = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const edgeIdStr = req.params.id;
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);
      const edgeId = parseInt(edgeIdStr, 10);

      const deleted = this.relationshipService.removeRelationship(edgeId, familyId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Relationship edge #${edgeId} not found.` },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { id: edgeId, status: 'INACTIVE' },
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };
}
