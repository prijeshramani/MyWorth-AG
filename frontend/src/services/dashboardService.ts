import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface MemberNetWorthSummary {
  memberId: number;
  memberName: string;
  relationship: string;
  totalMarketValue: number;
  formattedTotalMarketValue: string;
  percentageOfFamilyWealth: number;
}

export interface DashboardOverviewResponseDTO {
  familyId: number;
  familyName: string;
  asOfDate: string;
  reportingCurrency: string;
  totalWealth: number;
  formattedTotalWealth: string;
  memberSummaries: MemberNetWorthSummary[];
  topHoldings: Array<{
    assetId: number;
    assetName: string;
    symbol?: string;
    assetType: string;
    formattedMarketValue: string;
    unrealizedGainPercent: number;
  }>;
}

export const dashboardService = {
  async getDashboardOverview(
    familyId: number,
    asOfDate?: string
  ): Promise<ApiResponseEnvelope<DashboardOverviewResponseDTO>> {
    const params = new URLSearchParams();
    params.append('familyId', familyId.toString());
    if (asOfDate) params.append('asOfDate', asOfDate);

    const response = await apiClient.get<ApiResponseEnvelope<DashboardOverviewResponseDTO>>(
      `/dashboard/overview?${params.toString()}`
    );
    return response.data;
  }
};
