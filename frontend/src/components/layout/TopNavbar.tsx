import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { ShieldCheck, Menu, Bell, User, DollarSign, IndianRupee } from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { activeFamilyId, reportingCurrency, setReportingCurrency, toggleDrawer } = useUiStore();

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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-100 uppercase">Family Wealth OS</h1>
            <span className="text-[10px] text-slate-400 font-mono">Backend Platform v1.0 • Ready</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency Selector Toggle */}
        <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setReportingCurrency('INR')}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              reportingCurrency === 'INR'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            INR
          </button>
          <button
            onClick={() => setReportingCurrency('USD')}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              reportingCurrency === 'USD'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            USD
          </button>
        </div>

        {/* Notifications Icon */}
        <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5"></span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 border-l border-slate-800/80 pl-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40 text-xs font-bold">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-300 hidden md:inline">Sharma Family</span>
        </div>
      </div>
    </header>
  );
};
