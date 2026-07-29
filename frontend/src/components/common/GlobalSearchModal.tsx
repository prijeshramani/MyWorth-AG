import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
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
  TrendingUp
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  category: 'Family' | 'Investment' | 'Protection' | 'Tax' | 'Document' | 'Account';
  title: string;
  subtitle: string;
  tabTarget: string;
}

const MOCK_SEARCH_INDEX: SearchResultItem[] = [
  { id: '1', category: 'Family', title: 'Rajesh Sharma (Head)', subtitle: 'PAN: ABCDE1234F • Active', tabTarget: 'family' },
  { id: '2', category: 'Family', title: 'Priya Sharma (Spouse)', subtitle: 'PAN: FGHIJ5678K • Active', tabTarget: 'family' },
  { id: '3', category: 'Investment', title: 'HDFC Top 100 Equity Fund', subtitle: 'Mutual Fund • Value: ₹4,50,000.00', tabTarget: 'portfolio' },
  { id: '4', category: 'Investment', title: 'Reliance Industries Ltd.', subtitle: 'Equity Stock • Value: ₹8,20,000.00', tabTarget: 'portfolio' },
  { id: '5', category: 'Protection', title: 'Max Life Term Plan POL-9901', subtitle: 'Sum Assured: ₹1,00,00,000 • Status: ACTIVE', tabTarget: 'protection' },
  { id: '6', category: 'Protection', title: 'Star Health Optima Plan POL-4402', subtitle: 'Sum Assured: ₹10,00,000 • Status: ACTIVE', tabTarget: 'protection' },
  { id: '7', category: 'Tax', title: 'New Tax Regime Optimization FY 25-26', subtitle: 'Est. Savings: ₹32,500.00', tabTarget: 'tax' },
  { id: '8', category: 'Tax', title: 'Section 80C Deduction Tracker', subtitle: 'Claimed: ₹1,50,000 / ₹1,50,000', tabTarget: 'tax' },
  { id: '9', category: 'Document', title: 'PAN_Card_Rajesh_Sharma.pdf', subtitle: 'Category: PAN • Uploaded: 2026-05-10', tabTarget: 'documents' },
  { id: '10', category: 'Document', title: 'Max_Life_Policy_Document.pdf', subtitle: 'Category: Insurance • Uploaded: 2026-06-12', tabTarget: 'documents' },
  { id: '11', category: 'Account', title: 'HDFC Bank Savings A/c 50100234901', subtitle: 'Balance: ₹3,45,000.00', tabTarget: 'accounts' },
  { id: '12', category: 'Account', title: 'Zerodha Kite Demat 12081600', subtitle: 'Broker: Zerodha • Connected', tabTarget: 'accounts' }
];

export const GlobalSearchModal: React.FC = () => {
  const { isGlobalSearchOpen, setIsGlobalSearchOpen, setActiveTab, datasetMode } = useUiStore();
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(!isGlobalSearchOpen);
      }
      if (e.key === 'Escape' && isGlobalSearchOpen) {
        setIsGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalSearchOpen, setIsGlobalSearchOpen]);

  if (!isGlobalSearchOpen) return null;

  const searchIndex = datasetMode === 'DEMO' ? MOCK_SEARCH_INDEX : [];

  const filteredResults = query.trim() === ''
    ? searchIndex
    : searchIndex.filter(
        item => item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
                item.category.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (tabTarget: string) => {
    setActiveTab(tabTarget);
    setIsGlobalSearchOpen(false);
    setQuery('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Family': return <User className="w-4 h-4 text-sky-400" />;
      case 'Investment': return <PieChart className="w-4 h-4 text-emerald-400" />;
      case 'Protection': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'Tax': return <Calculator className="w-4 h-4 text-amber-400" />;
      case 'Document': return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'Account': return <Landmark className="w-4 h-4 text-teal-400" />;
      default: return <TrendingUp className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search across Family, Investments, Policies, Documents, Tax & Accounts... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setIsGlobalSearchOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.tabTarget)}
                className="p-3 hover:bg-slate-800/50 rounded-lg cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{item.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500 group-hover:text-sky-400 transition-colors">
                  <span className="text-[10px]">Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Use <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">Ctrl+K</kbd> to open anytime</span>
          <span>{filteredResults.length} items found</span>
        </div>
      </div>
    </div>
  );
};
