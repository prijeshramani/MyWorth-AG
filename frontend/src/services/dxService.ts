import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface SystemHealthDTO {
  systemHealthScore: number;
  readinessScore: number;
  lastBackupAgeHours: number;
  databaseSizeBytes: number;
  migrationVersion: number;
  components: {
    database: { status: string; message: string };
    aiContext: { status: string; message: string };
    knowledgeGraph: { status: string; message: string };
    recommendations: { status: string; message: string };
    taxEngine: { status: string; message: string };
    estateEngine: { status: string; message: string };
    projectionEngine: { status: string; message: string };
  };
}

export interface BackupMetadataDTO {
  filename: string;
  recoveryPointName: string;
  createdAt: string;
  sizeBytes: number;
  migrationVersion: number;
}

export interface OnboardingStatusDTO {
  isCompleted: boolean;
  hasUser: boolean;
  hasFamily: boolean;
  hasBackup: boolean;
  familyName?: string;
  currency: string;
  financialYear: string;
}

export const dxService = {
  async getHealth(): Promise<ApiResponseEnvelope<SystemHealthDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<SystemHealthDTO>>('/dx/health');
    return response.data;
  },

  async getOnboardingStatus(): Promise<ApiResponseEnvelope<OnboardingStatusDTO>> {
    const response = await apiClient.get<ApiResponseEnvelope<OnboardingStatusDTO>>('/dx/onboarding/status');
    return response.data;
  },

  async completeOnboarding(payload: { userName: string; email: string; familyName: string }): Promise<ApiResponseEnvelope<OnboardingStatusDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<OnboardingStatusDTO>>('/dx/onboarding/complete', payload);
    return response.data;
  },

  async listBackups(): Promise<ApiResponseEnvelope<BackupMetadataDTO[]>> {
    const response = await apiClient.get<ApiResponseEnvelope<BackupMetadataDTO[]>>('/dx/backups');
    return response.data;
  },

  async createBackup(name: string): Promise<ApiResponseEnvelope<BackupMetadataDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<BackupMetadataDTO>>('/dx/backup', { name });
    return response.data;
  },

  async restoreBackup(filename?: string): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.post<ApiResponseEnvelope<any>>('/dx/restore', { filename });
    return response.data;
  },

  async submitFeedback(payload: { route: string; category: string; notes: string; priority: string }): Promise<ApiResponseEnvelope<any>> {
    const response = await apiClient.post<ApiResponseEnvelope<any>>('/dx/feedback', payload);
    return response.data;
  }
};
