import { Request, Response, NextFunction } from 'express';
import { SQLiteEstateRepository } from '../repositories/SQLiteEstateRepository';
import { EstateHealthService } from '../services/EstateHealthService';
import { EstateSimulationService } from '../services/EstateSimulationService';
import { EmergencyModeService } from '../services/EmergencyModeService';

export class EstateController {
  constructor(
    private estateRepo: SQLiteEstateRepository,
    private healthService: EstateHealthService,
    private simService: EstateSimulationService,
    private emergencyService: EmergencyModeService
  ) {}

  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const profile = this.estateRepo.getOrCreateProfile(familyId);
      const health = this.healthService.calculateEstateHealth(familyId);
      const wills = this.estateRepo.getWills(familyId);
      const trusts = this.estateRepo.getTrusts(familyId);
      const timeline = this.estateRepo.getTimeline(familyId);

      res.status(200).json({
        success: true,
        data: {
          profile,
          health,
          wills,
          trusts,
          timeline
        },
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const health = this.healthService.calculateEstateHealth(familyId);

      res.status(200).json({
        success: true,
        data: health,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getWills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const wills = this.estateRepo.getWills(familyId);

      res.status(200).json({
        success: true,
        data: wills,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public createWill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId, testatorId, title, status, registrationNumber, executorName, witness1Name, witness2Name, documentId } = req.body;

      if (!familyId || !testatorId || !title || !executorName) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required Will attributes.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const newWill = this.estateRepo.createWill({
        family_id: familyId,
        testator_id: testatorId,
        title,
        status: status || 'DRAFT',
        registration_number: registrationNumber,
        executor_name: executorName,
        witness1_name: witness1Name,
        witness2_name: witness2Name,
        document_id: documentId
      });

      res.status(201).json({
        success: true,
        data: newWill,
        metadata: { executionTimeMs: 5, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getTrusts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const trusts = this.estateRepo.getTrusts(familyId);

      res.status(200).json({
        success: true,
        data: trusts,
        metadata: { executionTimeMs: 2, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public createTrust = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { familyId, trustName, trustType, deedNumber, corpusAmount, settlorId, documentId, status } = req.body;

      if (!familyId || !trustName || !trustType || !settlorId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required Trust attributes.' },
          correlationId: req.headers['x-correlation-id'] || 'system'
        });
        return;
      }

      const newTrust = this.estateRepo.createTrust({
        family_id: familyId,
        trust_name: trustName,
        trust_type: trustType,
        deed_number: deedNumber,
        corpus_amount: corpusAmount || 0,
        settlor_id: settlorId,
        document_id: documentId,
        status: status || 'ACTIVE'
      });

      res.status(201).json({
        success: true,
        data: newTrust,
        metadata: { executionTimeMs: 4, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getSimulation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);
      const scenario = req.params.scenario || 'TESTATOR_DECEASED';

      const sim = this.simService.runDeathScenarioSimulation(familyId, scenario);

      res.status(200).json({
        success: true,
        data: sim,
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getEmergency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const familyIdStr = req.query.familyId as string || '1';
      const familyId = parseInt(familyIdStr, 10);

      const emergency = this.emergencyService.getEmergencyConsoleData(familyId);

      res.status(200).json({
        success: true,
        data: emergency,
        metadata: { executionTimeMs: 3, apiVersion: '1.0.0' },
        correlationId: req.headers['x-correlation-id'] || 'system'
      });
    } catch (err: any) {
      next(err);
    }
  };
}
