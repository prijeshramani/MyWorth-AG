import { create } from 'zustand';
import type { UserDTO } from '../services/authService';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDTO, accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 1,
    familyId: 1,
    email: 'user@myworth.app',
    firstName: 'Primary',
    lastName: 'Member',
    roles: ['Owner'],
    permissions: [
      'Investment.Read', 'Investment.Write',
      'Insurance.Read', 'Insurance.Write',
      'Family.Read', 'Family.Write',
      'Settings.Manage', 'Documents.Read', 'Documents.Write'
    ]
  },
  accessToken: 'demo_jwt_access_token_2026',
  refreshToken: 'demo_jwt_refresh_token_2026',
  isAuthenticated: true,

  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),

  updateAccessToken: (accessToken) => set({ accessToken }),

  logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
}));
