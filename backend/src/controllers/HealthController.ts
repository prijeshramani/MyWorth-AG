import { Request, Response } from 'express';
import { db } from '../db';
import { engineRegistry } from '../engines/common/EngineRegistry';
import '../engines'; // Ensure all financial engines are registered

export class HealthController {
  public static getOverallHealth(req: Request, res: Response): void {
    const startTime = (req as any).startTime || Date.now();
    
    let dbStatus = 'HEALTHY';
    try {
      db.prepare('SELECT 1').get();
    } catch (e) {
      dbStatus = 'UNHEALTHY';
    }

    const engines = engineRegistry.listEngines();
    const isHealthy = dbStatus === 'HEALTHY' && engines.length >= 1;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      components: {
        database: { status: dbStatus },
        engines: { registeredCount: engines.length, status: engines.length >= 1 ? 'HEALTHY' : 'DEGRADED' },
        uptimeSeconds: Math.floor(process.uptime())
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        apiVersion: 'v1.0'
      }
    });
  }

  public static getLiveness(req: Request, res: Response): void {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString()
    });
  }

  public static getReadiness(req: Request, res: Response): void {
    try {
      db.prepare('SELECT 1').get();
      res.status(200).json({
        status: 'READY',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      res.status(503).json({
        status: 'NOT_READY',
        error: 'Database connection check failed'
      });
    }
  }
}
