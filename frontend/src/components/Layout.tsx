import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  History, 
  FileUp, 
  TrendingUp, 
  RefreshCw, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export default function Layout({ activeTab, setActiveTab, children }: LayoutProps) {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:5000/health');
      if (res.ok) {
        setBackendHealthy(true);
      } else {
        setBackendHealthy(false);
      }
    } catch {
      setBackendHealthy(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    setSyncStatus('Connecting...');
    try {
      const res = await fetch('http://localhost:5000/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncStatus('Updated successfully!');
        // Reload page to refresh all active queries
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSyncStatus('Sync failed.');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('Network error.');
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncStatus('');
      }, 2000);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'transactions', label: 'Ledger', icon: History },
    { id: 'import', label: 'Import Statement', icon: FileUp },
  ];

  return (
    <div className="flex h-screen bg-[#080b11] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0c1221] border-r border-[#1e2a4a]/50 flex flex-col justify-between z-10">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-[#1e2a4a]/30">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">MyWorth</h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Local Aggregator</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 shadow-sm shadow-indigo-500/5'
                      : 'text-slate-400 hover:bg-[#151e33] hover:text-slate-200 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Local Server and Sync Diagnostics Widget */}
        <div className="p-4 border-t border-[#1e2a4a]/40 bg-[#0f1729]/50 space-y-3">
          {/* Health status */}
          <div className="flex items-center justify-between text-xs px-2">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Server Connection
            </span>
            {backendHealthy === null ? (
              <span className="text-yellow-400 pulse-soft">checking...</span>
            ) : backendHealthy ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Local Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                Disconnected
              </span>
            )}
          </div>

          {/* Trigger Sync Button */}
          <button
            onClick={triggerSync}
            disabled={syncing || !backendHealthy}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-50 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
            {syncing ? syncStatus : 'Sync Market Prices'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#080b11]">
        {/* Top Header */}
        <header className="h-16 border-b border-[#1e2a4a]/30 flex items-center justify-between px-8 bg-[#0c1221]/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-100 capitalize">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[11px] text-slate-400 font-medium px-3 py-1 bg-slate-800/50 border border-slate-700/40 rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Database: <code className="text-slate-300">data/myworth.db</code>
            </div>
          </div>
        </header>

        {/* Page Content Panel */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {backendHealthy === false && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 text-red-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Local Server is Offline</h4>
                <p className="text-xs text-red-400 mt-1">
                  Ensure the Express server is running locally on your computer. Run <code className="text-red-300 bg-red-950/60 px-1 py-0.5 rounded">npm run dev</code> inside the <code className="text-red-300">/backend</code> folder to start it.
                </p>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
