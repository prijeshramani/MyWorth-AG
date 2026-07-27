import { useQuery } from '@tanstack/react-query';
import { taxService } from '../services/taxService';
import { queryKeys } from './queryKeys';

export function useTaxSummary(familyId: number) {
  return useQuery({
    queryKey: queryKeys.tax.summary(familyId),
    queryFn: () => taxService.getTaxSummary(familyId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!familyId
  });
}
