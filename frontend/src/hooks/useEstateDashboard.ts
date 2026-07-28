import { useQuery } from '@tanstack/react-query';
import { estateService } from '../services/estateService';
import { queryKeys } from './queryKeys';

export function useEstateDashboard(familyId: number) {
  return useQuery({
    queryKey: queryKeys.estate.dashboard(familyId),
    queryFn: () => estateService.getDashboard(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
