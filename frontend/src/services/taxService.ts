import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface TaxRegimeResult {
  regime: 'OLD' | 'NEW';
  grossTotalIncome: number;
  totalDeductions: number;
  netTaxableIncome: number;
  baseTax: number;
  rebate87A: number;
  cess: number;
  totalTaxPayable: number;
  effectiveTaxRatePercent: number;
}

export interface TaxSummaryResponseDTO {
  familyId: number;
  familyName: string;
  financialYear: string;
  assessmentYear: string;
  taxHealthScore: number;
  grossIncome: number;
  formattedGrossIncome: string;
  oldRegime: TaxRegimeResult;
  newRegime: TaxRegimeResult;
  recommendedRegime: 'OLD' | 'NEW';
  estimatedSavings: number;
  formattedEstimatedSavings: string;
  deductions: Array<{ section: string; claimed: number; maxLimit: number }>;
  capitalGains: Array<{
    assetType: string;
    gainType: 'STCG' | 'LTCG';
    realizedGain: number;
    taxableGain: number;
    taxRatePercent: number;
    estimatedTaxPayable: number;
  }>;
  recommendations: Array<{ title: string; description: string; estimatedSavings: number; priority: string }>;
  calendarEvents: Array<{ title: string; dueDate: string; category: string }>;
}

export const taxService = {
  async getTaxSummary(familyId: number): Promise<ApiResponseEnvelope<TaxSummaryResponseDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<TaxSummaryResponseDTO>>(`/tax/summary?familyId=${familyId}`);
    return response.data;
  }
};
