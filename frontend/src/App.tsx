import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './components/Dashboard';
import { AIMissionControl } from './components/dashboard/AIMissionControl';
import ImportCenter from './components/ImportCenter';
import Portfolio from './components/Portfolio';
import Transactions from './components/Transactions';
import CashFlowDashboard from './components/CashFlowDashboard';
import { FamilyManager } from './components/family/FamilyManager';
import { AccountsManager } from './components/accounts/AccountsManager';
import { DocumentVault } from './components/documents/DocumentVault';
import { RelationshipExplorer } from './components/graph/RelationshipExplorer';
import { DataManager } from './components/data/DataManager';
import { DataQualityCenter } from './components/quality/DataQualityCenter';
import { ReconciliationDashboard } from './components/reconciliation/ReconciliationDashboard';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { ProtectionDashboard } from './components/protection/ProtectionDashboard';
import { TaxDashboard } from './components/tax/TaxDashboard';
import { SettingsView } from './components/settings/SettingsView';
import { DeveloperConsole } from './components/developer/DeveloperConsole';
import { EstateDashboard } from './components/estate/EstateDashboard';
import { PlanningDashboard } from './components/planning/PlanningDashboard';
import { RecommendationsDashboard } from './components/recommendations/RecommendationsDashboard';
import { AIWealthAdvisor } from './components/advisor/AIWealthAdvisor';
import { AIActionCenter } from './components/advisor/AIActionCenter';
import { WhatIfSimulator } from './components/advisor/WhatIfSimulator';
import { AIReadinessDashboard } from './components/ai/AIReadinessDashboard';
import { ProductionReadinessDashboard } from './components/platform/ProductionReadinessDashboard';
import { DeveloperDiagnosticConsole } from './components/platform/DeveloperDiagnosticConsole';
import { FeedbackWidget } from './components/common/FeedbackWidget';
import { LoginPage } from './components/auth/LoginPage';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ComponentDemo } from './components/ui/ComponentDemo';
import { HoldingsView } from './components/holdings/HoldingsView';
import { ReportsGenerator } from './components/reports/ReportsGenerator';
import { useUiStore } from './store/useUiStore';
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function AppContent() {
  const { activeTab, setActiveTab, isOnboardingComplete } = useUiStore();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    // Detect Zerodha Kite & Upstox OAuth redirects in URL query string
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('request_token');
    const code = searchParams.get('code');

    if (token || code) {
      console.log('Zerodha / Upstox OAuth redirect URL detected. Opening Import Center...');
      setActiveTab('import');
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && !isOnboardingComplete && activeTab === 'dashboard') {
      setActiveTab('onboarding');
    }
  }, [isAuthenticated, isOnboardingComplete]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AIMissionControl onNavigate={(tab) => setActiveTab(tab)} />;
      case 'family':
        return <FamilyManager />;
      case 'graph':
        return <RelationshipExplorer />;
      case 'portfolio':
        return <Portfolio />;
      case 'holdings':
        return <HoldingsView />;
      case 'transactions':
        return <Transactions />;
      case 'accounts':
        return <AccountsManager />;
      case 'protection':
        return <ProtectionDashboard />;
      case 'tax':
        return <TaxDashboard />;
      case 'planning':
        return <PlanningDashboard />;
      case 'recommendations':
        return <RecommendationsDashboard />;
      case 'ai-advisor':
        return <AIWealthAdvisor />;
      case 'ai-action-center':
        return <AIActionCenter />;
      case 'what-if-simulator':
        return <WhatIfSimulator />;
      case 'ai-context':
        return <AIReadinessDashboard />;
      case 'production-readiness':
        return <ProductionReadinessDashboard />;
      case 'developer-diagnostics':
        return <DeveloperDiagnosticConsole />;
      case 'documents':
        return <DocumentVault />;
      case 'import':
        return <ImportCenter />;
      case 'data-manager':
        return <DataManager />;
      case 'data-quality':
        return <DataQualityCenter />;
      case 'reconciliation':
        return <ReconciliationDashboard />;
      case 'onboarding':
        return <OnboardingWizard />;
      case 'estate':
        return <EstateDashboard />;
      case 'reports':
        return <ReportsGenerator />;
      case 'settings':
        return <SettingsView />;
      case 'developer':
        return <DeveloperConsole />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <AppLayout>
      {renderTabContent()}
      <GlobalSearchModal />
      <FeedbackWidget />
    </AppLayout>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Unhandled UI Render Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Something went wrong</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                window.history.replaceState({}, document.title, window.location.pathname);
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all inline-block"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
