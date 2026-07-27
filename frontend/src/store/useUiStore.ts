import { create } from 'zustand';

interface UiState {
  activeFamilyId: number;
  reportingCurrency: 'INR' | 'USD';
  isDrawerOpen: boolean;
  activeTab: string;
  setActiveFamilyId: (id: number) => void;
  setReportingCurrency: (currency: 'INR' | 'USD') => void;
  toggleDrawer: () => void;
  setActiveTab: (tab: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeFamilyId: 1,
  reportingCurrency: 'INR',
  isDrawerOpen: true,
  activeTab: 'dashboard',
  setActiveFamilyId: (id) => set({ activeFamilyId: id }),
  setReportingCurrency: (currency) => set({ reportingCurrency: currency }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setActiveTab: (tab) => set({ activeTab: tab })
}));
