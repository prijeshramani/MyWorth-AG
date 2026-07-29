import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface GraphNodeDTO {
  id: number;
  family_id: number;
  entity_type: 'PERSON' | 'ASSET' | 'POLICY' | 'ACCOUNT' | 'DOCUMENT' | 'TAX_PROFILE';
  entity_id: number;
  label: string;
  metadata_json?: string;
  created_at: string;
}

export interface GraphEdgeDTO {
  id: number;
  family_id: number;
  source_node_id: number;
  target_node_id: number;
  relationship_type_id: number;
  weight: number;
  effective_from: string;
  status: 'ACTIVE' | 'INACTIVE';
  relationship_code?: string;
  relationship_name?: string;
  source_label?: string;
  target_label?: string;
}

export interface GraphOverviewResponseDTO {
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  nodeCount: number;
  edgeCount: number;
  estateReadiness: {
    totalAssetsCount: number;
    assetsWithNomineesCount: number;
    nomineeCoveragePercent: number;
    readinessScore: number;
  };
}

export const graphService = {
  async getOverview(familyId: number): Promise<ApiResponseEnvelope<GraphOverviewResponseDTO>> {
    console.log(`[GRAPH_SERVICE] Requesting /graph/overview?familyId=${familyId}`);
    const response = await apiClient.get<ApiResponseEnvelope<GraphOverviewResponseDTO>>(`/graph/overview?familyId=${familyId}`);
    console.log('[GRAPH_SERVICE] Received response:', response.data);
    return response.data;
  },

  async createRelationship(payload: {
    familyId: number;
    sourceNodeType: string;
    sourceEntityId: number;
    targetNodeType: string;
    targetEntityId: number;
    relationshipCode: string;
    weight?: number;
  }): Promise<ApiResponseEnvelope<GraphEdgeDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<GraphEdgeDTO>>('/graph/relationship', payload);
    return response.data;
  },

  async deleteRelationship(edgeId: number, familyId: number): Promise<ApiResponseEnvelope<{ id: number; status: string }>> {
    const response = await apiClient.delete<ApiResponseEnvelope<{ id: number; status: string }>>(`/graph/relationship/${edgeId}?familyId=${familyId}`);
    return response.data;
  }
};
