import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface ProtectionSummaryResponseDTO {
  familyId: number;
  familyName: string;
  asOfDate: string;
  protectionScore: number;
  protectionRating: 'OPTIMAL' | 'MODERATE' | 'AT_RISK' | 'CRITICAL_GAP';
  lifeCover: {
    totalSumAssured: number;
    formattedTotalSumAssured: string;
    targetCoverage: number;
    formattedTargetCoverage: string;
    coverageGapPercent: number;
  };
  healthCover: {
    totalSumAssured: number;
    formattedTotalSumAssured: string;
    targetCoverage: number;
    formattedTargetCoverage: string;
    coverageGapPercent: number;
  };
  upcomingPremiumsCount: number;
  policies: Array<{
    policyId: number;
    policyNumber: string;
    insurerName: string;
    policyType: string;
    holderName: string;
    sumAssured: number;
    formattedSumAssured: string;
    premiumAmount: number;
    formattedPremiumAmount: string;
    nextPremiumDueDate: string;
    status: string;
    nomineeName?: string;
  }>;
}

export const insuranceService = {
  async getProtectionSummary(
    familyId: number
  ): Promise<ApiResponseEnvelope<ProtectionSummaryResponseDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<ProtectionSummaryResponseDTO>>(
      `/protection/summary?familyId=${familyId}`
    );
    return response.data;
  },

  async createPolicy(policyData: any): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.post<ApiResponseEnvelope<any>>('/insurance/policies', policyData);
    return response.data;
  }
};
