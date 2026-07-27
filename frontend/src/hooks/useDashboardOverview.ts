import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { queryKeys } from './queryKeys';

export function useDashboardOverview(familyId: number, asOfDate?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(familyId, asOfDate),
    queryFn: () => dashboardService.getDashboardOverview(familyId, asOfDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
