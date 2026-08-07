import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface PolicyDTO {
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
  isFamilyFloater: boolean;
  coveredMemberIds: number[];
  coveredMemberIdsRaw: string;
}

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
  policies: PolicyDTO[];
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
  },

  async updatePolicy(policyId: number, policyData: any): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.put<ApiResponseEnvelope<any>>(`/insurance/policies/${policyId}`, policyData);
    return response.data;
  },

  async deletePolicy(policyId: number): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.delete<ApiResponseEnvelope<any>>(`/insurance/policies/${policyId}`);
    return response.data;
  }
};
