import { apiClient } from './apiClient';
import type { TimelineEvent, TimelineQueryFilter } from '../types/familyOffice';

export const familyTimelineService = {
  /**
   * GET /api/v1/family-office/timeline
   * Queries chronological timeline ledger with multi-dimensional filtering.
   * Completely read-only and non-mutating.
   */
  async getTimeline(filter?: TimelineQueryFilter): Promise<TimelineEvent[]> {
    const res = await apiClient.get('/family-office/timeline', {
      params: filter
    });
    const payload = res.data?.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && Array.isArray(payload.events)) {
      return payload.events;
    }
    return [];
  },

  /**
   * POST /api/v1/family-office/timeline/sync
   * Idempotent on-demand synchronization of multi-domain timeline events.
   * Atomic single-transaction reconciliation across source domain tables.
   */
  async syncTimeline(): Promise<{ reconciledCount: number }> {
    const res = await apiClient.post('/family-office/timeline/sync');
    return res.data?.data;
  }
};
