import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from './ThemeProvider';
import { 
  ShieldCheck, 
  Menu, 
  Bell, 
  DollarSign, 
  IndianRupee, 
  Search, 
  Database, 
  Compass,
  Bot,
  LogOut,
  Command,
  Sun,
  Moon
} from 'lucide-react';

import { NotificationCenterModal } from '../common/NotificationCenterModal';

export const TopNavbar: React.FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = React.useState<boolean>(false);
  const { 
    reportingCurrency, 
    setReportingCurrency, 
    toggleDrawer, 
    datasetMode, 
    setDatasetMode,
    setIsGlobalSearchOpen,
    setActiveTab 
  } = useUiStore();

  const { theme, toggleTheme } = useTheme();

  return (
    <>
    <header className="h-16 bg-[#15161A]/90 border-b border-[#2B2E35] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDrawer}
          className="p-2 text-[#9CA3AF] hover:text-[#F3F4F6] rounded-xl hover:bg-[#1E2025] transition-colors"
          aria-label="Toggle Sidebar Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-[#4F7FFF]/15 text-[#4F7FFF] flex items-center justify-center border border-[#4F7FFF]/30 group-hover:scale-105 transition-transform shadow-lg shadow-[#4F7FFF]/10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-extrabold tracking-wide text-[#F3F4F6] uppercase">Family Wealth OS</h1>
            <span className="text-[10px] text-[#4F7FFF] font-mono font-semibold">AI Intelligence Engine • Active</span>
          </div>
        </div>
      </div>

      {/* Global Search & Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-[#0B0B0C] border border-[#2B2E35] hover:border-[#4F7FFF]/50 rounded-xl text-xs text-[#9CA3AF] transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#4F7FFF] transition-colors" />
            <span>Search members, holdings, policies, documents...</span>
          </div>
          <kbd className="bg-[#1E2025] text-[#F3F4F6] font-mono text-[10px] px-1.5 py-0.5 rounded-md border border-[#2B2E35] flex items-center gap-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        {/* AI Advisor Quick Launcher Button */}
        <button
          onClick={() => setActiveTab('ai-advisor')}
          className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/25 transition-all shadow-sm"
        >
          <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>AI Advisor</span>
        </button>

        {/* Onboarding Quick Launcher Button */}
        <button
          onClick={() => setActiveTab('onboarding')}
          className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#4F7FFF]/10 text-[#4F7FFF] border border-[#4F7FFF]/20 hover:bg-[#4F7FFF]/20 transition-all"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Onboarding</span>
        </button>

        {/* Theme Switcher Toggle (Dark vs Light) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[#9CA3AF] hover:text-[#F3F4F6] rounded-xl hover:bg-[#1E2025] border border-[#2B2E35] transition-all flex items-center gap-1.5 text-xs font-semibold"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-[#F79009]" />
              <span className="hidden sm:inline text-[#9CA3AF]">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#4F7FFF]" />
              <span className="hidden sm:inline text-[#0F172A]">Dark</span>
            </>
          )}
        </button>

        {/* Dataset Toggle Switch (DEMO vs REAL) */}
        <div className="flex items-center bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-1">
          <button
            onClick={() => setDatasetMode('DEMO')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
              datasetMode === 'DEMO'
                ? 'bg-[#F79009]/20 text-[#F79009] border border-[#F79009]/40 shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <Database className="w-3 h-3" />
            DEMO
          </button>
          <button
            onClick={() => setDatasetMode('REAL')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
              datasetMode === 'REAL'
                ? 'bg-[#32D583]/20 text-[#32D583] border border-[#32D583]/40 shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            REAL
          </button>
        </div>

        {/* Currency Selector Toggle */}
        <div className="flex items-center bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-1">
          <button
            onClick={() => setReportingCurrency('INR')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
              reportingCurrency === 'INR'
                ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <IndianRupee className="w-3 h-3" />
            INR
          </button>
          <button
            onClick={() => setReportingCurrency('USD')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
              reportingCurrency === 'USD'
                ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <DollarSign className="w-3 h-3" />
            USD
          </button>
        </div>

        {/* Actionable Notification Center Bell */}
        <button 
          onClick={() => setIsNotificationOpen(true)}
          className="p-2 text-[#9CA3AF] hover:text-[#F3F4F6] rounded-xl hover:bg-[#1E2025] relative transition-colors"
          title="Notification Center Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-[#F79009] rounded-full absolute top-1.5 right-1.5 shadow-sm shadow-[#F79009] animate-pulse"></span>
        </button>

        {/* Logout Button */}
        <button
          onClick={() => useAuthStore.getState().logout()}
          className="p-2 text-[#9CA3AF] hover:text-[#F04438] rounded-xl hover:bg-[#F04438]/10 transition-colors"
          title="Sign Out / Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>

    <NotificationCenterModal 
      isOpen={isNotificationOpen}
      onClose={() => setIsNotificationOpen(false)}
    />
    </>
  );
};
