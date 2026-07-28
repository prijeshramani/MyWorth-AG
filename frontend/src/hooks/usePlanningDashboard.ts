import { useQuery } from '@tanstack/react-query';
import { planningService } from '../services/planningService';
import { queryKeys } from './queryKeys';

export function usePlanningDashboard(familyId: number) {
  return useQuery({
    queryKey: queryKeys.planning.dashboard(familyId),
    queryFn: () => planningService.getDashboard(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
