import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface WillDTO {
  id: number;
  family_id: number;
  testator_id: number;
  title: string;
  current_version: number;
  status: 'DRAFT' | 'ACTIVE' | 'REGISTERED' | 'REVOKED';
  registration_number?: string;
  registered_at?: string;
  review_due_date?: string;
  executor_name: string;
  witness1_name?: string;
  witness2_name?: string;
  document_id?: string;
  created_at: string;
}

export interface TrustDTO {
  id: number;
  family_id: number;
  trust_name: string;
  trust_type: 'FAMILY' | 'PRIVATE' | 'CHARITABLE' | 'REVOCABLE' | 'IRREVOCABLE';
  deed_number?: string;
  corpus_amount: number;
  settlor_id: number;
  document_id?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface EstateHealthDTO {
  overallScore: number;
  ratingLabel: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  willScore: number;
  nomineeScore: number;
  trustScore: number;
  documentScore: number;
  liquidityScore: number;
  breakdown: Array<{ category: string; score: number; maxScore: number; status: string }>;
  recommendations: string[];
}

export interface EstateDashboardDTO {
  profile: {
    estate_health_score: number;
    estate_value: number;
    lawyer_contact?: string;
    ca_contact?: string;
  };
  health: EstateHealthDTO;
  wills: WillDTO[];
  trusts: TrustDTO[];
  timeline: Array<{ id: number; event_type: string; title: string; description: string; created_at: string }>;
}

export interface EmergencyDTO {
  primaryExecutor: string;
  lawyerContact: string;
  caContact: string;
  doctorContact: string;
  keyInsurancePolicies: Array<{ policyNumber: string; insurer: string; type: string; sumAssured: string }>;
  criticalDocuments: Array<{ name: string; category: string; documentId: string }>;
}

export const estateService = {
  async getDashboard(familyId: number): Promise<ApiResponseEnvelope<EstateDashboardDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<EstateDashboardDTO>>(`/estate/dashboard?familyId=${familyId}`);
    return response.data;
  },

  async getEmergency(familyId: number): Promise<ApiResponseEnvelope<EmergencyDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<EmergencyDTO>>(`/estate/emergency?familyId=${familyId}`);
    return response.data;
  },

  async createWill(payload: {
    familyId: number;
    testatorId: number;
    title: string;
    status: string;
    executorName: string;
    registrationNumber?: string;
  }): Promise<ApiResponseEnvelope<WillDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<WillDTO>>('/estate/will', payload);
    return response.data;
  },

  async createTrust(payload: {
    familyId: number;
    trustName: string;
    trustType: string;
    corpusAmount: number;
    settlorId: number;
    deedNumber?: string;
  }): Promise<ApiResponseEnvelope<TrustDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<TrustDTO>>('/estate/trust', payload);
    return response.data;
  }
};
