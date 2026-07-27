import { apiClient } from './apiClient';

export interface HealthStatusResponseDTO {
  status: 'UP' | 'DOWN';
  timestamp: string;
  components: {
    database: { status: 'HEALTHY' | 'UNHEALTHY' };
    engines: { registeredCount: number; status: 'HEALTHY' | 'DEGRADED' };
    uptimeSeconds: number;
  };
  metadata: {
    executionTimeMs: number;
    apiVersion: string;
  };
}

export const healthService = {
  async getOverallHealth(): Promise<HealthStatusResponseDTO> {
    const response = await apiClient.get<HealthStatusResponseDTO>('/health');
    return response.data;
  },

  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get<{ status: string; timestamp: string }>('/health/liveness');
    return response.data;
  },

  async getReadiness(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get<{ status: string; timestamp: string }>('/health/readiness');
    return response.data;
  }
};
