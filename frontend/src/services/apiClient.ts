import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useUiStore } from '../store/useUiStore';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const correlationId = `gui_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  config.headers['X-Correlation-ID'] = correlationId;

  // Provide active family context to all requests
  const authFamilyId = useAuthStore.getState().user?.familyId;
  const uiFamilyId = useUiStore.getState().activeFamilyId;
  const familyId = authFamilyId || uiFamilyId || 1;
  config.headers['X-Family-Id'] = String(familyId);

  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return config;
});
