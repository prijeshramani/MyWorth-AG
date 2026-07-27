export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  useMock: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  staleTimeMs: 5 * 60 * 1000, // 5 minutes
  cacheTimeMs: 15 * 60 * 1000 // 15 minutes
};
