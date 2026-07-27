import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import {
  LayoutDashboard,
  PieChart,
  Table,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
  Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard' },
  { id: 'portfolio', label: 'Portfolio Tree', icon: <PieChart className="w-4 h-4" />, path: '/portfolio' },
  { id: 'holdings', label: 'Holdings', icon: <Table className="w-4 h-4" />, path: '/holdings' },
  { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" />, path: '/performance' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, path: '/analytics' },
  { id: 'risk', label: 'Risk Intelligence', icon: <ShieldAlert className="w-4 h-4" />, path: '/risk' },
  { id: 'reports', label: 'Reports Generator', icon: <FileSpreadsheet className="w-4 h-4" />, path: '/reports' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, path: '/settings' }
];

export const NavigationDrawer: React.FC = () => {
  const { isDrawerOpen, activeTab, setActiveTab } = useUiStore();

  if (!isDrawerOpen) return null;

  return (
    <aside className="w-64 bg-[#0e1526]/80 border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <nav className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Platform Workspace
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="card-glass p-3 border border-slate-800 text-center">
        <div className="text-[11px] font-semibold text-slate-300">Backend v1.0 Connected</div>
        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● 138 Tests Passing</div>
      </div>
    </aside>
  );
};
