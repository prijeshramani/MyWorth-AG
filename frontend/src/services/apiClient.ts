import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const correlationId = `gui_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  config.headers['X-Correlation-ID'] = correlationId;
  return config;
});
