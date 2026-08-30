import { apiClient } from './apiClient';
import type { 
  TimeMachineReconstruction, 
  WhatIfScenarioInput, 
  WhatIfSimulationResult 
} from '../types/familyOffice';

export const timeMachineService = {
  /**
   * GET /api/v1/family-office/time-machine
   * Reconstructs point-in-time financial state across all pillars.
   * Purely read-only; 0 database writes.
   */
  async reconstruct(asOfDate: string): Promise<TimeMachineReconstruction> {
    const res = await apiClient.get('/family-office/time-machine', {
      params: { asOfDate }
    });
    return res.data?.data;
  },

  /**
   * POST /api/v1/family-office/time-machine/what-if
   * Executes in-memory simulation against baseline state.
   * Stateless backend engine owns all math and ensures 0 domain database writes.
   */
  async simulateWhatIf(input: WhatIfScenarioInput): Promise<WhatIfSimulationResult> {
    const res = await apiClient.post('/family-office/time-machine/what-if', input);
    return res.data?.data;
  }
};
