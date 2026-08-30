import { apiClient } from './apiClient';
import type { FamilyFinancialHealth, FamilyHealthSnapshotRow } from '../types/familyOffice';

export const familyHealthService = {
  /**
   * GET /api/v1/family-office/health
   * Purely read-only evaluation of current live Family Financial Health index.
   */
  async getHealth(asOfDate?: string): Promise<FamilyFinancialHealth> {
    const params = asOfDate ? { asOfDate } : {};
    const res = await apiClient.get('/family-office/health', { params });
    return res.data?.data;
  },

  /**
   * GET /api/v1/family-office/health/history
   * Retrieves paginated historical health snapshots.
   */
  async getHistory(limit: number = 24): Promise<{ familyId: number; total: number; snapshots: FamilyHealthSnapshotRow[] }> {
    const res = await apiClient.get('/family-office/health/history', {
      params: { limit }
    });
    return res.data?.data;
  },

  /**
   * POST /api/v1/family-office/health/snapshot
   * Idempotent point-in-time snapshot persistence.
   */
  async takeSnapshot(asOfDate?: string): Promise<FamilyHealthSnapshotRow> {
    const res = await apiClient.post('/family-office/health/snapshot', asOfDate ? { asOfDate } : {});
    return res.data?.data;
  }
};
