export interface PortfolioSummaryRequestDTO {
  familyId: number;
  asOfDate?: string;          // YYYY-MM-DD
  reportingCurrency?: string; // Default 'INR'
  includeRiskMetrics?: boolean;
}

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
  performance?: {
    absoluteReturnPercent: number;
    cagrPercent: number;
    xirrPercent: number;
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

export interface DashboardOverviewResponseDTO {
  familyId: number;
  familyName: string;
  asOfDate: string;
  reportingCurrency: string;
  formattedTotalWealth: string;
  totalMarketValue: number;
  assetAllocation: Array<{
    assetType: string;
    percentage: number;
    formattedValue: string;
  }>;
  memberSummaries: Array<{
    memberId: number;
    memberName: string;
    formattedValue: string;
    percentageOfTotal: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'WARNING' | 'INFO';
    message: string;
  }>;
}
