import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import {
  LayoutDashboard,
  Users,
  GitFork,
  PieChart,
  Table,
  TrendingUp,
  Landmark,
  ShieldAlert,
  Calculator,
  FileText,
  FileSpreadsheet,
  Settings,
  Terminal,
  FileUp,
  CheckCircle2,
  GitCompare,
  Scroll,
  Target,
  Sparkles,
  Award,
  Bot
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'family', label: 'Family & Members', icon: <Users className="w-4 h-4" /> },
  { id: 'graph', label: 'Knowledge Graph', icon: <GitFork className="w-4 h-4 text-sky-400" /> },
  { id: 'portfolio', label: 'Portfolio Tree', icon: <PieChart className="w-4 h-4" /> },
  { id: 'holdings', label: 'Holdings', icon: <Table className="w-4 h-4" /> },
  { id: 'transactions', label: 'Transactions', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'accounts', label: 'Bank & Demat Accounts', icon: <Landmark className="w-4 h-4" /> },
  { id: 'protection', label: 'Protection & Insurance', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'tax', label: 'Tax Intelligence', icon: <Calculator className="w-4 h-4" /> },
  { id: 'planning', label: 'Financial Planning & Goals', icon: <Target className="w-4 h-4 text-sky-400" /> },
  { id: 'recommendations', label: 'AI Insights & Recommendations', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  { id: 'ai-advisor', label: 'AI Wealth Advisor', icon: <Bot className="w-4 h-4 text-indigo-400" />, badge: 'Core' },
  { id: 'ai-action-center', label: 'AI Action Center', icon: <Sparkles className="w-4 h-4 text-amber-400" />, badge: 'Actions' },
  { id: 'what-if-simulator', label: 'What-If Simulator', icon: <Target className="w-4 h-4 text-sky-400" />, badge: 'Sim' },
  { id: 'ai-context', label: 'AI Readiness & Context', icon: <Bot className="w-4 h-4 text-purple-400" /> },
  { id: 'production-readiness', label: 'Production Readiness', icon: <Award className="w-4 h-4 text-emerald-400" />, badge: 'Score' },
  { id: 'developer-diagnostics', label: 'Developer Diagnostics', icon: <Terminal className="w-4 h-4 text-indigo-400" />, badge: 'Dev' },
  { id: 'documents', label: 'Document Vault', icon: <FileText className="w-4 h-4" /> },
  { id: 'import', label: 'Import Center', icon: <FileUp className="w-4 h-4" /> },
  { id: 'data-manager', label: 'Data Manager', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'data-quality', label: 'Data Quality Center', icon: <CheckCircle2 className="w-4 h-4 text-amber-400" /> },
  { id: 'reconciliation', label: 'Reconciliation Dashboard', icon: <GitCompare className="w-4 h-4 text-sky-400" /> },
  { id: 'estate', label: 'Estate & Succession', icon: <Scroll className="w-4 h-4 text-amber-400" /> },
  { id: 'reports', label: 'Reports Generator', icon: <FileSpreadsheet className="w-4 h-4" /> },
  { id: 'settings', label: 'Platform Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'developer', label: 'Developer Mode', icon: <Terminal className="w-4 h-4" /> }
];

export const NavigationDrawer: React.FC = () => {
  const { isDrawerOpen, activeTab, setActiveTab } = useUiStore();

  if (!isDrawerOpen) return null;

  return (
    <aside className="w-64 bg-[#0e1526]/80 border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Platform Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex flex-col gap-1">
        <div className="flex justify-between">
          <span>Version:</span>
          <span className="text-slate-300">v1.0.0 (Phase 6UX)</span>
        </div>
        <div className="flex justify-between">
          <span>Build:</span>
          <span className="text-emerald-400">PRODUCTION READY</span>
        </div>
      </div>
    </aside>
  );
};
