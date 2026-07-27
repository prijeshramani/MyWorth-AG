import { useQuery } from '@tanstack/react-query';
import { graphService } from '../services/graphService';
import { queryKeys } from './queryKeys';

export function useGraphOverview(familyId: number) {
  return useQuery({
    queryKey: queryKeys.graph.overview(familyId),
    queryFn: () => graphService.getOverview(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
