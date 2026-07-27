import { useMutation } from '@tanstack/react-query';
import { reportingService, type ReportGenerationRequestPayload } from '../services/reportingService';

export function useReportGeneration() {
  return useMutation({
    mutationFn: (payload: ReportGenerationRequestPayload) => reportingService.generateReport(payload)
  });
}
