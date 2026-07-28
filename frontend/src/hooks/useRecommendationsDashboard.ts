import { useQuery } from '@tanstack/react-query';
import { recommendationService } from '../services/recommendationService';
import { queryKeys } from './queryKeys';

export function useRecommendationsDashboard(familyId: number) {
  return useQuery({
    queryKey: queryKeys.recommendations.dashboard(familyId),
    queryFn: () => recommendationService.getDashboard(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
