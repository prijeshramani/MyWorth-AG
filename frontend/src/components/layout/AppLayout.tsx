import React from 'react';
import { TopNavbar } from './TopNavbar';
import { NavigationDrawer } from './NavigationDrawer';
import { MobileNavigation } from './MobileNavigation';
import { CommandPalette } from '../ui/CommandPalette';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useUiStore } from '../../store/useUiStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isGlobalSearchOpen, setIsGlobalSearchOpen } = useUiStore();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0B0B0C] text-[#F3F4F6] flex flex-col font-sans antialiased selection:bg-[#4F7FFF]/30">
        <TopNavbar />
        <div className="flex flex-1">
          <NavigationDrawer />
          <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 overflow-y-auto max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
        <MobileNavigation />
        <CommandPalette
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
};
