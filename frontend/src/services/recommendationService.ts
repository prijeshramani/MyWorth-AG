import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface RecommendationDTO {
  id: number;
  family_id: number;
  rule_id?: number;
  rule_code: string;
  category: 'INVESTMENT' | 'TAX' | 'ESTATE' | 'PROTECTION' | 'PLANNING';
  journey_id?: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_pct: number;
  financial_impact_amount: number;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'ACCEPTED' | 'DISMISSED' | 'SNOOZED' | 'COMPLETED' | 'EXPIRED';
  source_engines_json: string;
  supporting_evidence_json?: string;
  next_action_json?: string;
  ai_context_json?: string;
  created_at: string;
}

export interface RecommendationJourneyDTO {
  id: number;
  journey_code: string;
  title: string;
  description: string;
  total_steps: number;
  completed_steps: number;
  status: string;
}

export interface RecommendationsDashboardDTO {
  totalOpenImpactAmount: number;
  criticalCount: number;
  highCount: number;
  activeRecommendations: RecommendationDTO[];
  journeys: RecommendationJourneyDTO[];
  history: Array<{ id: number; recommendation_id: number; status_from: string; status_to: string; reason: string; created_at: string }>;
}

export interface ExplanationDTO {
  recommendationId: number;
  title: string;
  description: string;
  whyGenerated: string;
  sourceEngines: string[];
  supportingEvidence: any;
  nextAction: { label?: string; path?: string };
  aiContext: {
    summary?: string;
    technicalExplanation?: string;
    suggestedNextActions?: string[];
  };
}

export const recommendationService = {
  async getDashboard(familyId: number): Promise<ApiResponseEnvelope<RecommendationsDashboardDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<RecommendationsDashboardDTO>>(`/recommendations/dashboard?familyId=${familyId}`);
    return response.data;
  },

  async explainRecommendation(id: number): Promise<ApiResponseEnvelope<ExplanationDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<ExplanationDTO>>(`/recommendations/${id}`);
    return response.data;
  },

  async refresh(familyId: number): Promise<ApiResponseEnvelope<RecommendationDTO[]>> {
    const response = await apiClient.post<ApiResponseEnvelope<RecommendationDTO[]>>('/recommendations/refresh', { familyId });
    return response.data;
  },

  async accept(id: number, familyId: number): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.post<ApiResponseEnvelope<any>>(`/recommendations/${id}/accept`, { familyId });
    return response.data;
  },

  async dismiss(id: number, familyId: number): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.post<ApiResponseEnvelope<any>>(`/recommendations/${id}/dismiss`, { familyId });
    return response.data;
  },

  async complete(id: number, familyId: number): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.post<ApiResponseEnvelope<any>>(`/recommendations/${id}/complete`, { familyId });
    return response.data;
  }
};
