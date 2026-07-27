import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface ReportGenerationRequestPayload {
  familyId: number;
  reportType: 'PORTFOLIO_SUMMARY' | 'TAX_STATEMENT' | 'HOLDINGS_LEDGER';
  format: 'PDF' | 'CSV' | 'JSON';
  asOfDate?: string;
}

export interface ReportGenerationResponseDTO {
  reportId: string;
  familyId: number;
  reportType: string;
  format: string;
  generatedAt: string;
  downloadUrl: string;
  fileSizeBytes: number;
}

export const reportingService = {
  async generateReport(
    payload: ReportGenerationRequestPayload
  ): Promise<ApiResponseEnvelope<ReportGenerationResponseDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<ReportGenerationResponseDTO>>(
      '/reports/generate',
      payload
    );
    return response.data;
  }
};
