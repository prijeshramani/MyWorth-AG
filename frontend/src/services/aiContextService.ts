import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface AICapabilityDTO {
  id: number;
  capability_code: string;
  name: string;
  description: string;
  required_context_providers_json: string;
  required_permissions_json: string;
}

export interface AIMemoryDTO {
  id: number;
  memory_type: string;
  key: string;
  value_json: string;
  confidence_score: number;
  created_at: string;
}

export interface AIEvidenceDTO {
  id: number;
  evidence_code: string;
  source_engine: string;
  source_engine_version: string;
  calculation_hash: string;
  correlation_id: string;
  proof_data_json: string;
  created_at: string;
}

export interface AIContextPayloadDTO {
  familyId: number;
  generatedAt: string;
  freshnessStatus: 'FRESH' | 'STALE';
  contextHealthScore: number;
  capabilities: AICapabilityDTO[];
  domainContexts: {
    portfolio: any;
    tax: any;
    estate: any;
    planning: any;
    recommendations: any;
  };
  evidenceSummary: {
    totalProofItems: number;
    latestProofHash: string;
  };
}

export interface CompiledPromptResponseDTO {
  safety: {
    isSafe: boolean;
    redactedQuery: string;
    disclaimer: string;
    violations: string[];
  };
  compiledPrompt: {
    templateCode: string;
    version: number;
    systemPrompt: string;
    userPrompt: string;
  };
}

export const aiContextService = {
  async getContext(familyId: number): Promise<ApiResponseEnvelope<AIContextPayloadDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<AIContextPayloadDTO>>(`/ai/context?familyId=${familyId}`);
    return response.data;
  },

  async getEvidence(id: number): Promise<ApiResponseEnvelope<AIEvidenceDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<AIEvidenceDTO>>(`/ai/evidence/${id}`);
    return response.data;
  },

  async getMemory(familyId: number): Promise<ApiResponseEnvelope<AIMemoryDTO[]>> {
    const response = await apiClient.get<ApiResponseEnvelope<AIMemoryDTO[]>>(`/ai/memory?familyId=${familyId}`);
    return response.data;
  },

  async refresh(familyId: number): Promise<ApiResponseEnvelope<AIContextPayloadDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<AIContextPayloadDTO>>('/ai/context/refresh', { familyId });
    return response.data;
  },

  async addMemory(payload: { familyId: number; memoryType: string; key: string; value: any }): Promise<ApiResponseEnvelope<AIMemoryDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<AIMemoryDTO>>('/ai/memory', payload);
    return response.data;
  },

  async compilePrompt(payload: { familyId: number; userQuery: string }): Promise<ApiResponseEnvelope<CompiledPromptResponseDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<CompiledPromptResponseDTO>>('/ai/prompt/compile', payload);
    return response.data;
  }
};
