import React from 'react';
import { TopNavbar } from './TopNavbar';
import { NavigationDrawer } from './NavigationDrawer';
import { MobileNavigation } from './MobileNavigation';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans antialiased">
        <TopNavbar />
        <div className="flex flex-1">
          <NavigationDrawer />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
        <MobileNavigation />
      </div>
    </ErrorBoundary>
  );
};
