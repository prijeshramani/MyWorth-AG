import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '../services/portfolioService';
import { queryKeys } from './queryKeys';

export function usePortfolioSummary(
  familyId: number,
  asOfDate?: string,
  reportingCurrency: string = 'INR',
  includeRiskMetrics: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.portfolio.summary(familyId, asOfDate, reportingCurrency),
    queryFn: () => portfolioService.getPortfolioSummary(familyId, asOfDate, reportingCurrency, includeRiskMetrics),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
