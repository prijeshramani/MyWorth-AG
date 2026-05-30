import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Trash2, 
  ChevronRight, 
  Calendar, 
  Tag, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  History,
  LayoutGrid,
  List,
  Search,
  X,
  Activity,
  Info,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Asset {
  id: number;
  name: string;
  type: string;
  category: string;
  identifier: string | null;
  currentUnits: number;
  totalCost: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  absoluteReturn: number;
  absoluteReturnPercent: number;
  priceDate: string;
  lastTransactionDate: string;
}

interface Transaction {
  id: number;
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST' | 'BONUS';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  source: string;
}

interface PricePoint {
  date: string;
  price: number;
}

export default function Portfolio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [cashflow, setCashflow] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Drill-down asset details drawer state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetTxs, setAssetTxs] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState<boolean>(false);

  // Filters and sorting states
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [sortField, setSortField] = useState<'name' | 'value' | 'return'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        setError('Failed to fetch portfolio assets.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashflow = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/cashflow');
      if (res.ok) {
        const data = await res.json();
        setCashflow(data);
      }
    } catch (err) {
      console.error('Error fetching cashflow inside portfolio:', err);
    }
  };

  const fetchAssetTransactions = async (assetId: number) => {
    try {
      setTxLoading(true);
      const res = await fetch(`http://localhost:5000/api/transactions?assetId=${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setAssetTxs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchAssetPriceHistory = async (assetId: number) => {
    try {
      setPriceHistoryLoading(true);
      const res = await fetch(`http://localhost:5000/api/assets/${assetId}/prices`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchCashflow();
  }, []);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    fetchAssetTransactions(asset.id);
    fetchAssetPriceHistory(asset.id);
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('Are you sure you want to delete this asset? This will permanently delete all its transactions and prices.')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${assetId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedAsset(null);
        fetchAssets();
      } else {
        alert('Failed to delete asset');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting asset');
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    if (!window.confirm('Delete this transaction from history? Net worth and cost basis will be updated instantly.')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${txId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedAsset) {
          fetchAssetTransactions(selectedAsset.id);
          fetchAssetPriceHistory(selectedAsset.id);
          const prevAssetId = selectedAsset.id;
          await fetchAssets();
          const updatedAssets = await (await fetch('http://localhost:5000/api/assets')).json();
          const fresh = updatedAssets.find((a: any) => a.id === prevAssetId);
          if (fresh) {
            setSelectedAsset(fresh);
          } else {
            setSelectedAsset(null);
          }
        }
      } else {
        alert('Failed to delete transaction');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading holdings data...</span>
      </div>
    );
  }

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Group Assets by Type
  const assetTypes = ['MUTUAL_FUND', 'STOCK', 'NPS', 'EPF', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'OTHER'];
  const assetLabels: Record<string, string> = {
    MUTUAL_FUND: 'Mutual Funds',
    STOCK: 'Stocks',
    NPS: 'National Pension Scheme',
    EPF: "Employees' Provident Fund (EPF)",
    GOLD: 'Gold & Metal',
    BOND: 'Bonds & Debentures',
    PROPERTY: 'Real Estate',
    BANK_ACCOUNT: 'Cash & Savings',
    OTHER: 'Other Assets'
  };

  const assetTypeColors: Record<string, string> = {
    MUTUAL_FUND: '#6366f1',
    STOCK: '#10b981',
    NPS: '#f59e0b',
    EPF: '#8b5cf6',
    GOLD: '#eab308',
    BOND: '#3b82f6',
    PROPERTY: '#ec4899',
    BANK_ACCOUNT: '#06b6d4',
    OTHER: '#64748b'
  };

  // Calculate overall metrics
  const totalWorth = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalCost = assets.reduce((sum, a) => sum + a.totalCost, 0);
  const totalGains = totalWorth - totalCost;
  const overallReturns = totalCost > 0 ? (totalGains / totalCost) * 100 : 0;

  // Calculate allocation weights for top progress bar
  const categoryWeights = assetTypes.map(type => {
    const typeValue = assets.filter(a => a.type === type).reduce((sum, a) => sum + a.currentValue, 0);
    return {
      type,
      label: assetLabels[type] || type,
      value: typeValue,
      percentage: totalWorth > 0 ? (typeValue / totalWorth) * 100 : 0,
      color: assetTypeColors[type] || '#6366f1'
    };
  }).filter(item => item.value > 0);

  // Sorting handler
  const handleSort = (field: 'name' | 'value' | 'return') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and search assets
  const filteredAssets = assets.filter(asset => {
    const matchesFilter = filterType === 'ALL' || asset.type === filterType;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (asset.identifier && asset.identifier.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Sort filtered assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    let compA = 0;
    let compB = 0;

    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'value') {
      compA = a.currentValue;
      compB = b.currentValue;
    } else if (sortField === 'return') {
      compA = a.absoluteReturnPercent;
      compB = b.absoluteReturnPercent;
    }

    return sortDirection === 'asc' ? compA - compB : compB - compA;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 relative">
      
      {/* 1. Header Overview & Allocation weights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Stats */}
        <div className="card-glass p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Aggregated Valuation</span>
            <h3 className="text-3xl font-extrabold text-white mt-3 leading-none">{formatCurrency(totalWorth)}</h3>
          </div>
          <div className="flex items-center gap-6 mt-6 border-t border-slate-800/40 pt-4 text-xs">
            <div>
              <span className="text-slate-500 block">Total Invested</span>
              <span className="font-semibold text-slate-300 block mt-0.5">{formatCurrency(totalCost)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Return</span>
              <span className={`font-bold mt-0.5 flex items-center gap-0.5 ${totalGains >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalGains >= 0 ? '+' : ''}{overallReturns.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Category Weights Indicator */}
        <div className="card-glass p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Asset Weight Distribution</span>
            <span className="text-xs text-slate-500 mt-1 block">Live representation of your wealth exposure splits</span>
          </div>

          {/* Segmented Weight bar */}
          {categoryWeights.length === 0 ? (
            <div className="h-4 bg-slate-900/60 rounded-full border border-slate-800/40"></div>
          ) : (
            <div className="h-4 w-full bg-slate-950/60 border border-slate-900 rounded-full overflow-hidden flex shadow-inner">
              {categoryWeights.map(item => (
                <div 
                  key={item.type}
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  className="h-full transition-all duration-500 hover:brightness-110 cursor-pointer"
                  title={`${item.label}: ${item.percentage.toFixed(1)}%`}
                ></div>
              ))}
            </div>
          )}

          {/* Label breakdowns */}
          <div className="flex flex-wrap gap-4 text-[10px] pt-1">
            {categoryWeights.map(item => (
              <div key={item.type} className="flex items-center gap-1.5 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-300">{item.label}</span>
                <span className="text-slate-500">({item.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Control Pill Bar (Filter, Search, Layout Switcher) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-800/40 pb-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'ALL' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Holdings
          </button>
          {assetTypes.map(type => {
            const count = assets.filter(a => a.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === type 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {assetLabels[type] || type}
              </button>
            );
          })}
        </div>

        {/* Search & Layout Toggler */}
        <div className="flex gap-3 w-full md:w-auto items-center">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search holding name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2 text-xs outline-none font-medium transition-all"
            />
          </div>

          {/* View Toggler */}
          <div className="p-1 bg-slate-950/60 border border-slate-900 rounded-xl flex gap-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Cards view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Holdings Display Area */}
      {sortedAssets.length === 0 ? (
        <div className="card-glass p-12 text-center rounded-2xl max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-slate-200">No matching assets found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search filters or import a statement in the Import Center.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* High-Density Ledger Table View (Option 1) */
        <div className="card-glass overflow-hidden rounded-2xl border border-slate-800/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-800/80 font-bold uppercase tracking-wider select-none">
                  <th onClick={() => handleSort('name')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                    Asset Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-4 px-4">ISIN / Ticker</th>
                  <th className="py-4 px-4">Category</th>
                  <th onClick={() => handleSort('value')} className="py-4 px-4 text-right cursor-pointer hover:text-white transition-colors">
                    Current Value {sortField === 'value' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-4 px-4 text-right">Investment</th>
                  <th onClick={() => handleSort('return')} className="py-4 px-6 text-right cursor-pointer hover:text-white transition-colors">
                    Returns {sortField === 'return' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {sortedAssets.map((asset) => {
                  const isProfit = asset.absoluteReturn >= 0;
                  return (
                    <tr 
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      className="hover:bg-slate-900/30 cursor-pointer transition-all duration-150 group"
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {asset.name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500 font-mono">
                        {asset.identifier || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold uppercase">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-200">
                        {formatCurrency(asset.currentValue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-400">
                        {formatCurrency(asset.totalCost)}
                      </td>
                      <td className={`py-3.5 px-6 text-right font-extrabold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{asset.absoluteReturnPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Cards Mode with performance glow status badges (Option 2) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAssets.map((asset) => {
            const isProfit = asset.absoluteReturn >= 0;
            const returns = asset.absoluteReturnPercent;
            
            // Performance class tags
            let glowColorClass = 'border-slate-800/60 hover:border-slate-700';
            let badgeText = 'Asset';
            let badgeClass = 'bg-slate-800/50 text-slate-400 border-slate-700/40';

            if (isProfit && returns > 15) {
              glowColorClass = 'border-emerald-500/10 hover:border-emerald-500/40 hover:shadow-emerald-950/5';
              badgeText = 'Top Performer';
              badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            } else if (isProfit) {
              glowColorClass = 'border-indigo-500/10 hover:border-indigo-500/40 hover:shadow-indigo-950/5';
              badgeText = 'Growth Asset';
              badgeClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            } else {
              glowColorClass = 'border-rose-500/10 hover:border-rose-500/40 hover:shadow-rose-950/5';
              badgeText = 'Underperforming';
              badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            }

            return (
              <div 
                key={asset.id}
                onClick={() => handleSelectAsset(asset)}
                className={`card-glass p-6 rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-300 border flex flex-col justify-between shadow-lg ${glowColorClass}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${badgeClass}`}>
                      {badgeText}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-100 mt-2 truncate pr-4">{asset.name}</h4>
                    <span className="text-[9px] font-mono text-slate-500 font-semibold block mt-1">{asset.identifier || 'N/A'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 hover:text-indigo-400 transition-colors flex-shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/30 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-500 block">Investment</span>
                    <span className="font-semibold text-slate-300 mt-0.5 block">{formatCurrency(asset.totalCost)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-semibold text-slate-500 block">Valuation</span>
                    <span className="font-extrabold text-slate-200 mt-0.5 block">{formatCurrency(asset.currentValue)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                  <span className="text-slate-400">Yield Yield</span>
                  <span className={`font-extrabold flex items-center gap-0.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isProfit ? '+' : ''}{returns.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Frosted Right-side Slide-over Drawer (Option 3) */}
      {selectedAsset && (
        <>
          {/* Backdrop layer */}
          <div 
            onClick={() => setSelectedAsset(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          ></div>
          
          {/* Slide Drawer container */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-50 transform translate-x-0 transition-transform duration-300 ease-out p-6 flex flex-col justify-between h-full">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800/40 pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    {assetLabels[selectedAsset.type] || selectedAsset.type}
                  </span>
                  {selectedAsset.identifier && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-semibold">
                      {selectedAsset.identifier}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-2 truncate pr-4 leading-snug">{selectedAsset.name}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                  className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-red-400 rounded-xl transition-all"
                  title="Delete Asset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                  title="Close panel"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Scrollable details wrapper */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin">
              
              {/* Asset Specific Recharts Pricing History Sparkline Area Chart */}
              <div className="bg-[#070b13]/60 border border-slate-900/60 p-4 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-3">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> 30-Day Value Timeline
                </span>
                
                {priceHistoryLoading ? (
                  <div className="h-32 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : priceHistory.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-[10px] text-slate-500 border border-dashed border-slate-900 rounded-xl gap-2">
                    <Info className="w-4 h-4 text-slate-600" />
                    No price updates recorded. Trigger price syncing to generate trendline.
                  </div>
                ) : (
                  <div className="h-32 w-full pr-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceHistory}>
                        <defs>
                          <linearGradient id="drawerColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="#334155" 
                          fontSize={8} 
                          tickLine={false} 
                          tickFormatter={(str) => {
                            const d = new Date(str);
                            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                          }}
                        />
                        <YAxis 
                          stroke="#334155" 
                          fontSize={8} 
                          tickLine={false} 
                          axisLine={false}
                          domain={['auto', 'auto']}
                          tickFormatter={(val) => {
                            if (val >= 100000) return `${(val/100000).toFixed(0)}L`;
                            if (val >= 1000) return `${(val/1000).toFixed(0)}k`;
                            return val;
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#04060c',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            fontSize: '9px',
                            color: '#f8fafc'
                          }}
                          formatter={(value: any) => [formatCurrency(Number(value)), 'Price / NAV']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#drawerColor)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Detail Stats Widgets */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Investment Cost</span>
                  <span className="text-sm font-extrabold text-slate-200 mt-1 block">{formatCurrency(selectedAsset.totalCost)}</span>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Current Valuation</span>
                  <span className="text-sm font-extrabold text-slate-200 mt-1 block">{formatCurrency(selectedAsset.currentValue)}</span>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Profit / Loss</span>
                  <span className={`text-sm font-extrabold mt-1 block ${selectedAsset.absoluteReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedAsset.absoluteReturn >= 0 ? '+' : ''}{formatCurrency(selectedAsset.absoluteReturn)}
                  </span>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Absolute Returns Yield</span>
                  <span className={`text-sm font-extrabold mt-1 block ${selectedAsset.absoluteReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedAsset.absoluteReturnPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Holding Details Metadata */}
              <div className="bg-slate-900/10 border border-slate-900/60 p-4 rounded-2xl space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Balance Units / Shares:</span>
                  <span className="font-semibold text-slate-200">{selectedAsset.currentUnits.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Purchase Price:</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(selectedAsset.avgBuyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Market Price:</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(selectedAsset.currentPrice)}</span>
                </div>
                {selectedAsset.priceDate && (
                  <div className="flex justify-between">
                    <span>Valuation Date:</span>
                    <span className="font-semibold text-slate-200">{new Date(selectedAsset.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* In-drawer companion cashflow stat block specifically for BANK_ACCOUNT */}
              {selectedAsset.type === 'BANK_ACCOUNT' && cashflow && cashflow.hasData && (
                <div className="card-glass p-5 rounded-2xl border-l-4 border-l-emerald-500/80 space-y-4">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Bank Flow Insights
                  </span>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cumulative Inflow (Credits):</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(cashflow.summary.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cumulative Outflow (Debits):</span>
                      <span className="font-bold text-rose-400">{formatCurrency(cashflow.summary.totalExpense)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/40 pt-3 text-xs">
                      <span className="text-slate-300 font-bold">Net Accumulation Balance:</span>
                      <span className="font-extrabold text-white">{formatCurrency(cashflow.summary.netSavings)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Effective Savings Margin:</span>
                      <span className="font-bold text-indigo-400">{cashflow.summary.savingsRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Ledger Panel */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                  <History className="w-4 h-4 text-indigo-400" /> Transaction Ledger
                </span>
                
                {txLoading ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : assetTxs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-900 rounded-xl">
                    No transactions found for this asset.
                  </div>
                ) : (
                  <div className="border border-slate-900/60 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-900/60 font-bold uppercase text-[9px] tracking-wider select-none">
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4 text-right">Units</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                          <th className="py-2.5 px-4 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/30">
                        {assetTxs.map((tx) => {
                          const isBuy = tx.type === 'BUY' || tx.type === 'REINVEST';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-900/20">
                              <td className="py-2 px-4 text-slate-300 font-medium whitespace-nowrap">
                                {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </td>
                              <td className="py-2 px-4">
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] tracking-wide ${
                                  isBuy ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-right font-mono text-slate-400">{tx.quantity.toFixed(3)}</td>
                              <td className="py-2 px-4 text-right font-extrabold text-slate-200">{formatCurrency(tx.amount)}</td>
                              <td className="py-2 px-4 text-center">
                                <button 
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-800/40 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedAsset(null)}
                className="py-2 px-6 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-all"
              >
                Close Details
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
