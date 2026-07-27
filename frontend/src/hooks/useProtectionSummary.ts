import { useQuery } from '@tanstack/react-query';
import { insuranceService } from '../services/insuranceService';
import { queryKeys } from './queryKeys';

export function useProtectionSummary(familyId: number) {
  return useQuery({
    queryKey: queryKeys.protection.summary(familyId),
    queryFn: () => insuranceService.getProtectionSummary(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
