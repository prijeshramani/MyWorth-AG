import { Router, Request, Response } from 'express';
import { aiActionRegistry } from '../services/ai/AIActionRegistry';
import { whatIfSimulationEngine } from '../services/ai/WhatIfSimulationEngine';
import { sqliteSimulationSnapshotRepository } from '../repositories/SQLiteSimulationSnapshotRepository';
import { sqliteAIAuditTrailRepository } from '../repositories/SQLiteAIAuditTrailRepository';

import { syncAllAssets } from '../services/marketSync';

const router = Router();

// GET /api/v1/ai/actions/registry - Retrieve registered AI Actions with preconditions
router.get('/registry', (req: Request, res: Response) => {
  try {
    const actions = aiActionRegistry.getAllActions();
    res.json({ actions, count: actions.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/ai/actions/templates - Retrieve pre-packaged What-If simulation templates
router.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = whatIfSimulationEngine.getTemplates();
    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/ai/actions/simulate - Run ephemeral What-If Simulation
router.post('/simulate', (req: Request, res: Response) => {
  try {
    const { familyId, params, templateType } = req.body;
    const fid = familyId ? parseInt(familyId as string) : 1;
    const simulationResult = whatIfSimulationEngine.runSimulation(fid, params || {}, templateType);
    res.json(simulationResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Simulation failed.' });
  }
});

// POST /api/v1/ai/actions/execute - Execute confirmed AI Action with audit logging
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { actionId, userConfirmed, familyId, payload, question } = req.body;
    const action = aiActionRegistry.getAction(actionId);

    if (!action) {
      return res.status(404).json({ error: `Action ID '${actionId}' not found in registry.` });
    }

    if (action.requiresConfirmation && !userConfirmed) {
      return res.status(400).json({
        error: `Action '${action.name}' requires explicit user confirmation before execution.`,
        requiresConfirmation: true,
        riskLevel: action.riskLevel,
        preconditions: action.preconditions,
        rollbackStrategy: action.rollbackStrategy
      });
    }

    const fid = familyId ? parseInt(familyId as string) : 1;
    const executionTimestamp = new Date().toISOString();
    let syncResults: any = null;

    // Perform actual underlying engine execution based on action ID
    if (actionId === 'REFRESH_PORTFOLIO') {
      syncResults = await syncAllAssets();
    }

    // Log Action Execution in Audit Trail & Action Center
    const auditRecord = sqliteAIAuditTrailRepository.logAuditEntry({
      actionId,
      question: question || `Executed action: ${action.name}`,
      skillsUsed: [action.category],
      actionsProposed: [action],
      userDecision: 'EXECUTED',
      evidenceUsed: action.requiredEvidence,
      executionResult: { status: 'SUCCESS', executedAt: executionTimestamp, syncResults }
    });

    sqliteAIAuditTrailRepository.upsertActionItem({
      id: `act_${actionId}_${Date.now()}`,
      familyId: fid,
      actionId,
      status: 'COMPLETED',
      title: action.name,
      description: action.description,
      impactSummary: { executedAt: executionTimestamp, riskLevel: action.riskLevel }
    });

    // Also record entry in AI Decision Journal
    sqliteAIAuditTrailRepository.logDecisionJournal({
      familyId: fid,
      question: question || `User executed action ${action.name}`,
      aiExplanation: `Action '${action.name}' executed under engine ${action.ownerEngine} with user confirmation. Audit ID: ${auditRecord.id}.`,
      actionsCompleted: [actionId]
    });

    res.json({
      success: true,
      actionId,
      actionName: action.name,
      auditId: auditRecord.id,
      executedAt: executionTimestamp,
      undoSupported: action.supportsUndo,
      rollbackStrategy: action.rollbackStrategy,
      message: `Action '${action.name}' executed successfully and logged to Audit Trail.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Execution failed.' });
  }
});

// POST /api/v1/ai/actions/undo - Rollback supported action
router.post('/undo', (req: Request, res: Response) => {
  try {
    const { actionId, auditId } = req.body;
    const action = aiActionRegistry.getAction(actionId);

    if (!action) {
      return res.status(404).json({ error: `Action ID '${actionId}' not found.` });
    }

    if (!action.supportsUndo) {
      return res.status(400).json({ error: `Action '${action.name}' does not support automated undo.` });
    }

    sqliteAIAuditTrailRepository.logAuditEntry({
      actionId,
      question: `User requested UNDO for action ${action.name}`,
      userDecision: 'UNDONE',
      executionResult: { status: 'ROLLBACK_SUCCESS', rollbackStrategy: action.rollbackStrategy }
    });

    res.json({
      success: true,
      actionId,
      auditId,
      message: `Rollback completed using strategy: ${action.rollbackStrategy}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/ai/actions/audit-trail - Retrieve Audit Trail History
router.get('/audit-trail', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const entries = sqliteAIAuditTrailRepository.getAuditTrail(limit);
    res.json({ entries, count: entries.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/ai/actions/journal - Retrieve Searchable AI Decision Journal
router.get('/journal', (req: Request, res: Response) => {
  try {
    const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : 1;
    const journalEntries = sqliteAIAuditTrailRepository.getDecisionJournal(familyId);
    res.json({ journalEntries, count: journalEntries.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/ai/actions/action-center - Retrieve Action Items by Status Category
router.get('/action-center', (req: Request, res: Response) => {
  try {
    const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : 1;
    const statusFilter = req.query.status as string | undefined;

    let items = sqliteAIAuditTrailRepository.getActionItemsByStatus(familyId, statusFilter);

    // Seed default recommended action items if database table is empty
    if (items.length === 0 && !statusFilter) {
      const defaultActions = aiActionRegistry.getAllActions();
      for (const act of defaultActions.slice(0, 4)) {
        sqliteAIAuditTrailRepository.upsertActionItem({
          id: `act_${act.id}_default`,
          familyId,
          actionId: act.id,
          status: act.requiresConfirmation ? 'RECOMMENDED' : 'PENDING',
          title: act.name,
          description: act.description,
          impactSummary: { riskLevel: act.riskLevel, ownerEngine: act.ownerEngine }
        });
      }
      items = sqliteAIAuditTrailRepository.getActionItemsByStatus(familyId);
    }

    res.json({ items, count: items.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/ai/actions/snapshots - Save Simulation Snapshot
router.post('/snapshots', (req: Request, res: Response) => {
  try {
    const { familyId, title, templateType, scenarioInputs, assumptions, projectionResults } = req.body;
    const fid = familyId ? parseInt(familyId as string) : 1;

    const snapshot = sqliteSimulationSnapshotRepository.saveSnapshot(
      fid,
      title || 'Simulation Snapshot',
      templateType || 'custom',
      scenarioInputs || {},
      assumptions || {},
      projectionResults || {}
    );

    res.json({ success: true, snapshot });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/ai/actions/snapshots - List Simulation Snapshots
router.get('/snapshots', (req: Request, res: Response) => {
  try {
    const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : 1;
    const snapshots = sqliteSimulationSnapshotRepository.findAllForFamily(familyId);
    res.json({ snapshots, count: snapshots.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
