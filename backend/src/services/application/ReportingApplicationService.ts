import { portfolioApplicationService } from './PortfolioApplicationService';

export interface ReportGenerationRequest {
  familyId: number;
  reportType: 'PORTFOLIO_SUMMARY' | 'TAX_STATEMENT' | 'PERFORMANCE_REPORT' | 'HOLDINGS_LEDGER' | 'PROTECTION_AUDIT' | 'ESTATE_STATEMENT';
  asOfDate?: string;
  format: 'JSON' | 'CSV' | 'PDF';
}

export interface ReportGenerationResponse {
  reportId: string;
  familyId: number;
  reportType: string;
  format: string;
  downloadUrl?: string;
  generatedAt: string;
}

export class ReportingApplicationService {
  public async generateReport(
    request: ReportGenerationRequest
  ): Promise<ReportGenerationResponse> {
    const reportId = `rep_${request.reportType.toLowerCase()}_${Date.now()}`;
    
    // Fetch consolidated portfolio data for report generation
    await portfolioApplicationService.getConsolidatedPortfolio({
      familyId: request.familyId,
      asOfDate: request.asOfDate,
      includeRiskMetrics: true
    });

    return {
      reportId,
      familyId: request.familyId,
      reportType: request.reportType,
      format: request.format,
      downloadUrl: `/api/reports/${reportId}.${request.format.toLowerCase()}`,
      generatedAt: new Date().toISOString()
    };
  }
}

export const reportingApplicationService = new ReportingApplicationService();
