import { apiClient } from './apiClient';
import type { 
  ProactiveTrigger, 
  ProactiveEvaluationResult, 
  ProactiveTriggerStatus 
} from '../types/familyOffice';

export const proactiveObserverService = {
  /**
   * GET /api/v1/family-office/proactive/triggers
   * Fetches active or status-filtered proactive fiduciary triggers.
   */
  async getTriggers(status?: ProactiveTriggerStatus): Promise<ProactiveTrigger[]> {
    const params = status ? { status } : {};
    const res = await apiClient.get('/family-office/proactive/triggers', { params });
    return res.data?.data || [];
  },

  /**
   * POST /api/v1/family-office/proactive/evaluate
   * Triggers targeted or full evaluation of proactive rules against live state.
   */
  async evaluate(targetRules?: string[]): Promise<ProactiveEvaluationResult> {
    const res = await apiClient.post('/family-office/proactive/evaluate', { targetRules });
    return res.data?.data;
  },

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/acknowledge
   * Transitions trigger state to ACKNOWLEDGED.
   */
  async acknowledge(triggerId: string): Promise<ProactiveTrigger> {
    const res = await apiClient.post(`/family-office/proactive/triggers/${triggerId}/acknowledge`);
    return res.data?.data;
  },

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/snooze
   * Snoozes trigger for a specified number of days (1..30).
   */
  async snooze(triggerId: string, snoozeDays: number = 7): Promise<ProactiveTrigger> {
    const res = await apiClient.post(`/family-office/proactive/triggers/${triggerId}/snooze`, {
      snoozeDays
    });
    return res.data?.data;
  },

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/dismiss
   * Dismisses trigger with optional reason.
   */
  async dismiss(triggerId: string, reason?: string): Promise<ProactiveTrigger> {
    const res = await apiClient.post(`/family-office/proactive/triggers/${triggerId}/dismiss`, {
      reason
    });
    return res.data?.data;
  },

  /**
   * POST /api/v1/family-office/proactive/triggers/:id/resolve
   * Resolves trigger with optional resolution note.
   */
  async resolve(triggerId: string, reason?: string): Promise<ProactiveTrigger> {
    const res = await apiClient.post(`/family-office/proactive/triggers/${triggerId}/resolve`, {
      reason
    });
    return res.data?.data;
  }
};
