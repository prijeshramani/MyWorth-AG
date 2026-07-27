import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { AppLayout } from './components/layout/AppLayout';
import { PageSkeleton } from './components/common/PageSkeleton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppLayout>
          {/* Foundation Shell Infrastructure Demonstration View */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Frontend Platform Foundation</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Phase 5B-1 Infrastructure Shell • React 18 + Vite + TanStack Query + Zustand + Tailwind CSS
                </p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-3 py-1 rounded-full">
                Platform Ready
              </span>
            </div>

            {/* Skeleton Loading State Demonstration */}
            <div className="card-glass p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Infrastructure Health & Shell Verification</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs">
                  <span className="text-slate-400">Design Tokens & Glassmorphism</span>
                  <span className="text-emerald-400 font-mono">ACTIVE (HSL Theme Loaded)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs">
                  <span className="text-slate-400">Correlation Header Interceptor</span>
                  <span className="text-emerald-400 font-mono">INJECTED (X-Correlation-ID)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs">
                  <span className="text-slate-400">Global Error Boundary Guard</span>
                  <span className="text-emerald-400 font-mono">ACTIVE (React Exception Guard)</span>
                </div>
              </div>
            </div>

            <PageSkeleton />
          </div>
        </AppLayout>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
