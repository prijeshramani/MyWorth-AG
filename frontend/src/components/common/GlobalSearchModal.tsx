import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';
import { 
  Search, 
  X, 
  User, 
  PieChart, 
  ShieldAlert, 
  Calculator, 
  FileText, 
  Landmark, 
  ArrowRight,
  TrendingUp,
  Target,
  Scroll,
  FileSpreadsheet,
  GitFork
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  tabTarget: string;
}

export const GlobalSearchModal: React.FC = () => {
  const { isGlobalSearchOpen, setIsGlobalSearchOpen, setActiveTab, activeFamilyId } = useUiStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K) & Arrow Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(!isGlobalSearchOpen);
      }
      if (!isGlobalSearchOpen) return;

      if (e.key === 'Escape') {
        setIsGlobalSearchOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex].tabTarget);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, results, selectedIndex]);

  // Fetch search results from dynamic backend endpoint
  useEffect(() => {
    if (!isGlobalSearchOpen) return;

    const fetchSearch = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/search/query?q=${encodeURIComponent(query)}&familyId=${activeFamilyId}`);
        setResults(res.data?.data || []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSearch, 150);
    return () => clearTimeout(timer);
  }, [query, isGlobalSearchOpen, activeFamilyId]);

  if (!isGlobalSearchOpen) return null;

  const handleSelect = (tabTarget: string) => {
    setActiveTab(tabTarget);
    setIsGlobalSearchOpen(false);
    setQuery('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Family': return <User className="w-4 h-4 text-sky-500" />;
      case 'Investment': return <PieChart className="w-4 h-4 text-emerald-500" />;
      case 'Protection': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'Tax': return <Calculator className="w-4 h-4 text-amber-500" />;
      case 'Document': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'Account': return <Landmark className="w-4 h-4 text-teal-500" />;
      case 'Goal': return <Target className="w-4 h-4 text-indigo-500" />;
      case 'Estate': return <Scroll className="w-4 h-4 text-amber-500" />;
      case 'Report': return <FileSpreadsheet className="w-4 h-4 text-sky-500" />;
      case 'Graph': return <GitFork className="w-4 h-4 text-purple-500" />;
      default: return <TrendingUp className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets, members, policies, documents, tax & accounts... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsGlobalSearchOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">Searching live database...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.tabTarget)}
                  className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between group transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span className="text-[10px] font-bold">Navigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Use <kbd className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">↑↓</kbd> to navigate, <kbd className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">Enter</kbd> to select</span>
          <span>{results.length} items found</span>
        </div>
      </div>
    </div>
  );
};
