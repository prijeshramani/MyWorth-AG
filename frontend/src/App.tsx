import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { AppLayout } from './components/layout/AppLayout';
import { ComponentDemo } from './components/ui/ComponentDemo';
import { ProtectionDashboard } from './components/protection/ProtectionDashboard';
import { LoginPage } from './components/auth/LoginPage';
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
  const { activeTab } = useUiStore();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      {activeTab === 'protection' ? <ProtectionDashboard /> : <ComponentDemo />}
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
