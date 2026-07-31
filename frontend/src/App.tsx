import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './components/Dashboard';
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
import { AIReadinessDashboard } from './components/ai/AIReadinessDashboard';
import { FeedbackWidget } from './components/common/FeedbackWidget';
import { LoginPage } from './components/auth/LoginPage';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ComponentDemo } from './components/ui/ComponentDemo';
import { HoldingsView } from './components/holdings/HoldingsView';
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
  const [kiteRequestToken, setKiteRequestToken] = React.useState<string | null>(null);
  const [upstoxCode, setUpstoxCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Detect Zerodha Kite & Upstox OAuth redirects in URL query string
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('request_token');
    const code = searchParams.get('code');

    if (token) {
      console.log('Zerodha Kite OAuth redirect token detected:', token);
      setKiteRequestToken(token);
      setActiveTab('import');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      console.log('Upstox OAuth redirect code detected:', code);
      setUpstoxCode(code);
      setActiveTab('import');
      window.history.replaceState({}, document.title, window.location.pathname);
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
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
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
      case 'ai-context':
        return <AIReadinessDashboard />;
      case 'documents':
        return <DocumentVault />;
      case 'import':
        return (
          <ImportCenter 
            initialKiteRequestToken={kiteRequestToken} 
            clearKiteRequestToken={() => setKiteRequestToken(null)}
            initialUpstoxCode={upstoxCode}
            clearUpstoxCode={() => setUpstoxCode(null)}
          />
        );
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
        return <CashFlowDashboard />;
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

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
