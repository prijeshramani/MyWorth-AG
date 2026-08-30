import { apiClient } from './apiClient';
import type { ActionableCompletenessResponse } from '../types/familyOffice';

export const onboardingCompletenessService = {
  async getActionableCompleteness(): Promise<ActionableCompletenessResponse> {
    const response = await apiClient.get<ActionableCompletenessResponse>('/family-office/completeness/actions');
    return response.data;
  }
};
