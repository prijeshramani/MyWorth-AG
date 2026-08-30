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
  Bot,
  ChevronRight,
  Activity,
  History,
  Clock
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  category?: string;
}

export const navItems: NavItem[] = [
  // Core & AI
  { id: 'dashboard', label: 'AI Mission Control', icon: <LayoutDashboard className="w-4 h-4 text-[#4F7FFF]" />, category: 'Core' },
  { id: 'ai-advisor', label: 'AI Wealth Advisor', icon: <Bot className="w-4 h-4 text-[#8B5CF6]" />, badge: 'Core', category: 'Core' },
  { id: 'recommendations', label: 'AI Recommendations', icon: <Sparkles className="w-4 h-4 text-[#F79009]" />, category: 'Core' },
  { id: 'ai-action-center', label: 'AI Action Center', icon: <Sparkles className="w-4 h-4 text-[#4F7FFF]" />, badge: 'Actions', category: 'Core' },

  // Wealth & Assets
  { id: 'portfolio', label: 'Portfolio Overview', icon: <PieChart className="w-4 h-4 text-[#32D583]" />, category: 'Wealth' },
  { id: 'holdings', label: 'Asset Holdings', icon: <Table className="w-4 h-4 text-[#38BDF8]" />, category: 'Wealth' },
  { id: 'transactions', label: 'Cashflow & Activity', icon: <TrendingUp className="w-4 h-4 text-[#32D583]" />, category: 'Wealth' },
  { id: 'accounts', label: 'Bank & Demat Accounts', icon: <Landmark className="w-4 h-4 text-[#F79009]" />, category: 'Wealth' },
  { id: 'family-timeline', label: 'Family Timeline Ledger', icon: <History className="w-4 h-4 text-[#38BDF8]" />, badge: 'Ledger', category: 'Wealth' },

  // Intelligence & Planning
  { id: 'family-health', label: 'Family Financial Health', icon: <Activity className="w-4 h-4 text-[#32D583]" />, badge: 'Index', category: 'Planning' },
  { id: 'time-machine', label: 'Time Machine & What-If', icon: <Clock className="w-4 h-4 text-[#8B5CF6]" />, badge: 'Sandbox', category: 'Planning' },
  { id: 'tax', label: 'Tax Intelligence', icon: <Calculator className="w-4 h-4 text-[#38BDF8]" />, category: 'Planning' },
  { id: 'planning', label: 'Financial Goals', icon: <Target className="w-4 h-4 text-[#4F7FFF]" />, category: 'Planning' },
  { id: 'protection', label: 'Protection & Insurance', icon: <ShieldAlert className="w-4 h-4 text-[#F04438]" />, category: 'Planning' },
  { id: 'estate', label: 'Estate & Succession', icon: <Scroll className="w-4 h-4 text-[#F79009]" />, category: 'Planning' },

  // Entity & Governance
  { id: 'family', label: 'Family Members', icon: <Users className="w-4 h-4 text-[#E879F9]" />, category: 'Entities' },
  { id: 'graph', label: 'Knowledge Graph', icon: <GitFork className="w-4 h-4 text-[#38BDF8]" />, category: 'Entities' },

  // Platform & Operations
  { id: 'documents', label: 'Document Vault', icon: <FileText className="w-4 h-4 text-[#9CA3AF]" />, category: 'System' },
  { id: 'import', label: 'Import Center', icon: <FileUp className="w-4 h-4 text-[#9CA3AF]" />, category: 'System' },
  { id: 'reconciliation', label: 'Reconciliation', icon: <GitCompare className="w-4 h-4 text-[#38BDF8]" />, category: 'System' },
  { id: 'reports', label: 'Reports Generator', icon: <FileSpreadsheet className="w-4 h-4 text-[#9CA3AF]" />, category: 'System' },
  { id: 'production-readiness', label: 'Production Readiness', icon: <Award className="w-4 h-4 text-[#32D583]" />, badge: 'Score', category: 'System' },
  { id: 'developer-diagnostics', label: 'Developer Diagnostics', icon: <Terminal className="w-4 h-4 text-[#8B5CF6]" />, badge: 'Dev', category: 'System' },
  { id: 'settings', label: 'Platform Settings', icon: <Settings className="w-4 h-4 text-[#9CA3AF]" />, category: 'System' },
];

export const NavigationDrawer: React.FC = () => {
  const { isDrawerOpen, activeTab, setActiveTab } = useUiStore();

  if (!isDrawerOpen) return null;

  const categories = ['Core', 'Wealth', 'Planning', 'Entities', 'System'];

  return (
    <aside className="w-64 bg-[#15161A] border-r border-[#2B2E35] p-3 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] overflow-y-auto select-none">
      <nav className="space-y-4">
        {categories.map((cat) => {
          const catItems = navItems.filter((item) => item.category === cat);
          if (catItems.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                {cat}
              </div>
              {catItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#4F7FFF]/15 text-[#4F7FFF] border border-[#4F7FFF]/30 shadow-sm font-semibold'
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2025]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#1E2025] text-[#F79009] border border-[#F79009]/30 font-semibold">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3 h-3 text-[#4F7FFF]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="pt-3 border-t border-[#2B2E35] text-[10px] text-[#6B7280] font-mono flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span>OS Version:</span>
          <span className="text-[#F3F4F6] font-semibold">v8C.4 (Family Intelligence)</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Engine Status:</span>
          <span className="text-[#32D583] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#32D583] animate-ping" />
            OPERATIONAL
          </span>
        </div>
      </div>
    </aside>
  );
};
