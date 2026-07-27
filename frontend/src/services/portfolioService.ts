import { apiClient } from './apiClient';

export interface PortfolioSummaryResponseDTO {
  familyId: number;
  familyName: string;
  asOfDate: string;
  reportingCurrency: string;
  netWorth: {
    totalMarketValue: number;
    totalCostBasis: number;
    unrealizedGain: number;
    unrealizedGainPercent: number;
    formattedTotalMarketValue: string;
    formattedTotalCostBasis: string;
    formattedUnrealizedGain: string;
  };
  analytics?: {
    diversificationScore: number;
    healthRating: string;
    topSector: string;
  };
  risk?: {
    annualizedVolatilityPercent: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    sortinoRatio: number;
    riskRating: string;
  };
  masterChecksum: string;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  metadata: {
    snapshotId?: string;
    calculationManifestId?: string;
    executionTimeMs: number;
    apiVersion: string;
  };
  correlationId: string;
  warnings: string[];
  errors: any[];
}

export const portfolioService = {
  async getPortfolioSummary(
    familyId: number,
    asOfDate?: string,
    reportingCurrency: string = 'INR',
    includeRiskMetrics: boolean = true
  ): Promise<ApiResponseEnvelope<PortfolioSummaryResponseDTO>> {
    const params = new URLSearchParams();
    params.append('familyId', familyId.toString());
    if (asOfDate) params.append('asOfDate', asOfDate);
    if (reportingCurrency) params.append('reportingCurrency', reportingCurrency);
    if (includeRiskMetrics) params.append('includeRiskMetrics', 'true');

    const response = await apiClient.get<ApiResponseEnvelope<PortfolioSummaryResponseDTO>>(
      `/portfolio/summary?${params.toString()}`
    );
    return response.data;
  }
};
