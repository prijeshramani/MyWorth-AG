import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { 
  ShieldCheck, 
  Menu, 
  Bell, 
  DollarSign, 
  IndianRupee, 
  Search, 
  Database, 
  Compass 
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { 
    reportingCurrency, 
    setReportingCurrency, 
    toggleDrawer, 
    datasetMode, 
    setDatasetMode,
    setIsGlobalSearchOpen,
    setActiveTab 
  } = useUiStore();

  return (
    <header className="h-16 bg-[#0e1526]/90 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDrawer}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
          aria-label="Toggle Sidebar Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-wide text-slate-100 uppercase">Family Wealth OS</h1>
            <span className="text-[10px] text-slate-400 font-mono">Backend Platform v1.0 • Ready</span>
          </div>
        </div>
      </div>

      {/* Global Search Trigger Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search members, holdings, policies, documents...</span>
          </div>
          <kbd className="bg-slate-800 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Onboarding Quick Launcher Button */}
        <button
          onClick={() => setActiveTab('onboarding')}
          className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-600/10 text-sky-400 border border-sky-500/20 hover:bg-sky-600/20 transition-colors"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Onboarding</span>
        </button>

        {/* Dataset Toggle Switch (DEMO vs REAL) */}
        <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setDatasetMode('DEMO')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
              datasetMode === 'DEMO'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3 h-3" />
            DEMO
          </button>
          <button
            onClick={() => setDatasetMode('REAL')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
              datasetMode === 'REAL'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            REAL
          </button>
        </div>

        {/* Currency Selector Toggle */}
        <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setReportingCurrency('INR')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
              reportingCurrency === 'INR'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IndianRupee className="w-3 h-3" />
            INR
          </button>
          <button
            onClick={() => setReportingCurrency('USD')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
              reportingCurrency === 'USD'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3 h-3" />
            USD
          </button>
        </div>

        {/* Notifications Icon */}
        <button 
          onClick={() => setActiveTab('data-quality')}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 relative transition-colors"
          title="Data Quality & Audit Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5"></span>
        </button>
      </div>
    </header>
  );
};
