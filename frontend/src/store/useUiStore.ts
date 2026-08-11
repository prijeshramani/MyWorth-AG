import { create } from 'zustand';

export interface UiState {
  activeFamilyId: number;
  reportingCurrency: 'INR' | 'USD';
  isDrawerOpen: boolean;
  activeTab: string;
  datasetMode: 'DEMO' | 'REAL';
  isGlobalSearchOpen: boolean;
  searchQuery: string;
  onboardingStep: number;
  isOnboardingComplete: boolean;
  dashboardWidgets: string[];
  
  setActiveFamilyId: (id: number) => void;
  setReportingCurrency: (currency: 'INR' | 'USD') => void;
  toggleDrawer: () => void;
  setActiveTab: (tab: string) => void;
  setDatasetMode: (mode: 'DEMO' | 'REAL') => void;
  setIsGlobalSearchOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setOnboardingStep: (step: number) => void;
  setIsOnboardingComplete: (complete: boolean) => void;
  setDashboardWidgets: (widgets: string[]) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeFamilyId: 1,
  reportingCurrency: 'INR',
  isDrawerOpen: true,
  activeTab: 'dashboard',
  datasetMode: 'REAL',
  isGlobalSearchOpen: false,
  searchQuery: '',
  onboardingStep: 8,
  isOnboardingComplete: true,
  dashboardWidgets: ['networth', 'investments', 'protection', 'tax', 'quality', 'activity'],

  setActiveFamilyId: (id) => set({ activeFamilyId: id }),
  setReportingCurrency: (currency) => set({ reportingCurrency: currency }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDatasetMode: (mode) => set({ datasetMode: mode }),
  setIsGlobalSearchOpen: (isOpen) => set({ isGlobalSearchOpen: isOpen }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  setIsOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
  setDashboardWidgets: (widgets) => set({ dashboardWidgets: widgets })
}));
