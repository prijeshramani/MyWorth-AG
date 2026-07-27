import { useQuery } from '@tanstack/react-query';
import { healthService } from '../services/healthService';
import { queryKeys } from './queryKeys';

export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health.overall(),
    queryFn: () => healthService.getOverallHealth(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refetch every 60s
  });
}
