import { useQuery } from '@tanstack/react-query';
import { aiContextService } from '../services/aiContextService';
import { queryKeys } from './queryKeys';

export function useAIContextDashboard(familyId: number) {
  const contextQuery = useQuery({
    queryKey: queryKeys.aiContext.context(familyId),
    queryFn: () => aiContextService.getContext(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });

  const memoryQuery = useQuery({
    queryKey: queryKeys.aiContext.memory(familyId),
    queryFn: () => aiContextService.getMemory(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });

  return {
    contextQuery,
    memoryQuery
  };
}
