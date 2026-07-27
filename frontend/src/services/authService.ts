import { apiClient } from './apiClient';
import type { ApiResponseEnvelope } from './portfolioService';

export interface UserDTO {
  id: number;
  familyId: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResultDTO {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export const authService = {
  async login(email: string, password: string): Promise<ApiResponseEnvelope<AuthResultDTO>> {
    const response = await apiClient.post<ApiResponseEnvelope<AuthResultDTO>>('/auth/login', { email, password });
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<ApiResponseEnvelope<{ accessToken: string }>> {
    const response = await apiClient.post<ApiResponseEnvelope<{ accessToken: string }>>('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  }
};
