import { Request, Response, NextFunction } from 'express';
import { AIContextService } from '../services/AIContextService';
import { AIMemoryService } from '../services/AIMemoryService';
import { EvidenceService } from '../services/EvidenceService';
import { PromptBuilderService } from '../services/PromptBuilderService';
import { AISafetyService } from '../services/AISafetyService';

export class AIContextController {
  constructor(
    private contextService: AIContextService,
    private memoryService: AIMemoryService,
    private evidenceService: EvidenceService,
    private promptBuilder: PromptBuilderService,
    private safetyService: AISafetyService
  ) {}

  public getContext = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const context = this.contextService.getUnifiedAIContext(familyId);

      res.status(200).json({
        success: true,
        data: context,
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getEvidence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const evidence = this.evidenceService.getEvidence(id);

      if (!evidence) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Evidence proof #${id} not found.` },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: evidence,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const memory = this.memoryService.getMemoryTimeline(familyId);

      res.status(200).json({
        success: true,
        data: memory,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public refreshContext = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId } = req.body;
      const targetFamilyId = familyId ? parseInt(familyId, 10) : 1;

      const refreshed = this.contextService.getUnifiedAIContext(targetFamilyId);

      res.status(200).json({
        success: true,
        data: refreshed,
        metadata: { executionTimeMs: 5, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public addMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId, memoryType, key, value } = req.body;

      if (!familyId || !key || !value) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing memory attributes.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const mem = this.memoryService.saveMemoryItem(familyId, memoryType || 'PERMANENT', key, value);

      res.status(201).json({
        success: true,
        data: mem,
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public compilePrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userQuery, familyId } = req.body;
      const targetFamilyId = familyId ? parseInt(familyId, 10) : 1;

      const safety = this.safetyService.evaluateQuery(userQuery || 'Summarize tax savings');
      const context = this.contextService.getUnifiedAIContext(targetFamilyId);

      const compiled = this.promptBuilder.compilePrompt(
        'WEALTH_ADVISOR_BASE',
        safety.redactedQuery,
        context.domainContexts,
        context.evidenceSummary
      );

      res.status(200).json({
        success: true,
        data: {
          safety,
          compiledPrompt: compiled
        },
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };
}
