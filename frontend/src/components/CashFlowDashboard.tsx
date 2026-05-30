import React, { useEffect, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  Database,
  ArrowRight,
  Search,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Transaction {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  date: string;
  amount: number;
  narration: string;
  tx_category: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export default function CashFlowDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Custom DB config path state
  const [dbPath, setDbPath] = useState<string>('');
  const [editingPath, setEditingPath] = useState<boolean>(false);
  const [savingPath, setSavingPath] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<string>('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/cashflow');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to fetch cash flow statistics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/import/bankinsights/config');
      if (res.ok) {
        const json = await res.json();
        setDbPath(json.dbPath);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCashFlow();
    fetchConfig();
  }, []);

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPath(true);
    try {
      const res = await fetch('http://localhost:5000/api/import/bankinsights/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbPath })
      });
      if (res.ok) {
        setEditingPath(false);
        alert('BankInsights database path updated!');
      } else {
        alert('Failed to update path');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPath(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncSuccess('');
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/import/bankinsights/sync', {
        method: 'POST'
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        // Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        setSyncSuccess(`Success! Synced ${json.importedCount} new transactions. Current balance: Rs. ${json.latestBalance.toLocaleString()}`);
        fetchCashFlow(); // Refetch dashboard details
      } else {
        setError(json.error || 'Failed to sync with BankInsights database.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error syncing database.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCategoryChange = async (txId: string, newCategory: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/cashflow/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId, category: newCategory })
      });
      
      if (res.ok) {
        // Locally update category to prevent full refetch jitter
        setData((prev: any) => {
          if (!prev) return prev;
          const updatedTxs = prev.recentTransactions.map((tx: any) => 
            tx.id === txId ? { ...tx, tx_category: newCategory } : tx
          );
          
          // Re-calculate category breakdown
          const breakdown: Record<string, number> = {};
          updatedTxs.forEach((tx: any) => {
            if (tx.type === 'DEBIT') {
              breakdown[tx.tx_category] = (breakdown[tx.tx_category] || 0) + tx.amount;
            }
          });

          return {
            ...prev,
            recentTransactions: updatedTxs,
            categoryBreakdown: breakdown
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400">Aggregating bank ledger timelines...</span>
      </div>
    );
  }

  const { hasData, summary, categoryBreakdown, monthlyTimeline, recentTransactions } = data;

  // Donut chart colors
  const catColors: Record<string, string> = {
    Salary: '#10b981',
    Income: '#34d399',
    Investment: '#3b82f6',
    'Food & Dining': '#f59e0b',
    Shopping: '#ec4899',
    Rent: '#ef4444',
    Utilities: '#8b5cf6',
    Travel: '#06b6d4',
    Telecom: '#a855f7',
    Entertainment: '#f43f5e',
    Uncategorized: '#64748b'
  };

  const donutData = Object.entries(categoryBreakdown)
    .filter(([_, val]) => (val as number) > 0)
    .map(([key, val]) => ({
      name: key,
      value: Math.round(val as number),
      color: catColors[key] || '#' + Math.floor(Math.random()*16777215).toString(16)
    }));

  const isSavingPositive = summary.netSavings >= 0;

  // Filter Transactions list
  const filteredTxs = recentTransactions.filter((tx: Transaction) => {
    const matchesSearch = tx.narration.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.tx_category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || tx.tx_category === selectedCategoryFilter;
    const matchesType = selectedTypeFilter === 'all' || tx.type === selectedTypeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get distinct categories in dataset for dropdown filters
  const uniqueCategories = Array.from(new Set(recentTransactions.map((tx: any) => tx.tx_category)));

  // Preset list of categorizations for the inline tagger
  const categoriesList = [
    'Salary', 'Income', 'Investment', 'Food & Dining', 'Shopping', 
    'Rent', 'Utilities', 'Travel', 'Telecom', 'Entertainment', 'Uncategorized'
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Onboarding Empty State */}
      {!hasData ? (
        <div className="max-w-2xl mx-auto card-glass p-8 text-center rounded-3xl mt-12 space-y-6">
          <Database className="w-16 h-16 text-indigo-400 mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold text-slate-100">Sync with BankInsights Database</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Connect directly to your local **BankInsights** app SQLite backup database to dynamically sync, classify, and visualize 8,000+ financial credits and debits instantly.
          </p>

          <div className="space-y-4 max-w-md mx-auto pt-4 text-left text-xs">
            <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
              <span className="font-bold text-slate-300 block">Default Sync Location</span>
              <span className="font-mono text-[10px] text-slate-500 block break-all">{dbPath}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingPath(true)}
                className="py-2.5 px-4 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-bold"
              >
                Change Path
              </button>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {syncing ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Database className="w-4 h-4" />}
                {syncing ? 'Connecting and Syncing...' : 'Establish Direct App Sync'}
              </button>
            </div>
          </div>

          {editingPath && (
            <form onSubmit={handleSavePath} className="mt-4 p-4 border border-slate-900/60 bg-slate-950/20 p-5 rounded-2xl max-w-md mx-auto text-left text-xs space-y-4">
              <label className="text-slate-300 font-semibold block">SQLite File Location</label>
              <input 
                type="text" 
                value={dbPath}
                onChange={(e) => setDbPath(e.target.value)}
                className="w-full bg-[#111726]/80 text-slate-300 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-mono text-[10px]"
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingPath(false)} className="flex-1 py-2 border border-slate-800 text-slate-400 rounded-lg">Cancel</button>
                <button type="submit" disabled={savingPath} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">{savingPath ? 'Saving...' : 'Save Path'}</button>
              </div>
            </form>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-xl flex items-start gap-2 max-w-md mx-auto text-left">
              <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
              <div><span className="font-bold">Sync Error:</span> {error}</div>
            </div>
          )}
        </div>
      ) : (
        /* FULL DASHBOARD PANEL */
        <div className="space-y-8 animate-fade-in">
          {/* KPI Analytics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Income Inflow</span>
              <h3 className="text-3xl font-extrabold text-white mt-2 leading-none">{formatCurrency(summary.totalIncome)}</h3>
              <span className="text-slate-500 text-[10px] font-medium block mt-3">Sum of all salary & credit transactions</span>
            </div>

            <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Expense Outflow</span>
              <h3 className="text-3xl font-extrabold text-white mt-2 leading-none">{formatCurrency(summary.totalExpense)}</h3>
              <span className="text-slate-500 text-[10px] font-medium block mt-3">Sum of all UPI & debit cash outflows</span>
            </div>

            <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl ${isSavingPositive ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}></div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Net Savings Gap</span>
              <h3 className={`text-3xl font-extrabold mt-2 leading-none ${isSavingPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isSavingPositive ? '+' : ''}{formatCurrency(summary.netSavings)}
              </h3>
              <span className="text-slate-500 text-[10px] font-medium block mt-3">Remaining surplus cash balance</span>
            </div>

            <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Net Savings Rate</span>
              <h3 className={`text-3xl font-extrabold mt-2 leading-none flex items-center gap-1.5 ${isSavingPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isSavingPositive ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
                {summary.savingsRate.toFixed(1)}%
              </h3>
              <span className="text-slate-500 text-[10px] font-medium block mt-3">Percentage of surplus savings from income</span>
            </div>
          </div>

          {/* Sync Widget Card */}
          <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">BankInsights Direct SQLite Sync</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate max-w-sm lg:max-w-md font-mono">{dbPath}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEditingPath(!editingPath)} 
                className="py-1.5 px-3 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg font-bold"
              >
                Change Path
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="py-1.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md shadow-indigo-600/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          {editingPath && (
            <form onSubmit={handleSavePath} className="p-4 border border-slate-900/60 bg-[#0a0f1d]/50 p-5 rounded-2xl max-w-md text-xs space-y-4">
              <label className="text-slate-300 font-semibold block">SQLite Backup path</label>
              <input 
                type="text" 
                value={dbPath}
                onChange={(e) => setDbPath(e.target.value)}
                className="w-full bg-[#111726]/80 text-slate-300 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none font-mono text-[10px]"
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingPath(false)} className="flex-1 py-2 border border-slate-800 text-slate-400 rounded-lg">Cancel</button>
                <button type="submit" disabled={savingPath} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">{savingPath ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          )}

          {syncSuccess && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>{syncSuccess}</div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inflow vs Outflow Trends */}
            <div className="card-glass p-6 rounded-2xl lg:col-span-2">
              <h4 className="font-bold text-base text-slate-100 border-b border-slate-800/40 pb-3 mb-4 flex items-center gap-2">
                Cash Flow Trends
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTimeline}>
                    <XAxis 
                      dataKey="month" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      tickFormatter={(str) => {
                        const parts = str.split('-');
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${months[parseInt(parts[1]) - 1]} '${parts[0].substring(2)}`;
                      }}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => {
                        if (val >= 100000) return `${(val/100000).toFixed(1)}L`;
                        if (val >= 1000) return `${(val/1000).toFixed(0)}k`;
                        return val;
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                      formatter={(value: any) => [formatCurrency(Number(value))]}
                    />
                    <Legend verticalAlign="top" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar name="Credits (Income)" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Debits (Expenses)" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Donut Breakdown */}
            <div className="card-glass p-6 rounded-2xl flex flex-col justify-between">
              <div className="border-b border-slate-800/40 pb-3 mb-4">
                <h4 className="font-bold text-base text-slate-100">Category Spending</h4>
              </div>

              {donutData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                  No expense records to analyze.
                </div>
              ) : (
                <>
                  <div className="h-44 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            fontSize: '11px'
                          }}
                          formatter={(val: number) => [formatCurrency(val)]} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Expenses</span>
                      <span className="text-lg font-bold text-slate-200">{formatCurrency(summary.totalExpense)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] pt-4 border-t border-slate-800/30">
                    {donutData.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-400 truncate">{item.name}</span>
                      </div>
                    ))}
                    {donutData.length > 6 && (
                      <div className="text-slate-500 text-[9px] font-semibold pl-3">+{donutData.length - 6} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="card-glass p-6 rounded-2xl">
            <h4 className="font-bold text-base text-slate-100 border-b border-slate-800/40 pb-3 mb-4">
              Cash Flow Ledger
            </h4>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6 text-xs">
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search narration or category..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none w-full font-medium"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Category selector */}
                <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <select 
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-transparent text-slate-300 outline-none pr-1.5 font-bold cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map((c: any) => (
                      <option key={c} value={c} className="bg-[#0c1221]">{c}</option>
                    ))}
                  </select>
                </div>

                {/* Type selector */}
                <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
                  <select 
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="bg-transparent text-slate-300 outline-none pr-1.5 font-bold cursor-pointer"
                  >
                    <option value="all">All Transactions</option>
                    <option value="CREDIT" className="bg-[#0c1221]">Credits (Inflow)</option>
                    <option value="DEBIT" className="bg-[#0c1221]">Debits (Outflow)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            {filteredTxs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No matching transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto select-text">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800/60 pb-2 font-bold uppercase tracking-wider">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Narration Description</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/20">
                    {filteredTxs.map((tx: Transaction) => {
                      const isCredit = tx.type === 'CREDIT';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/10">
                          <td className="py-2.5 text-slate-300 font-medium whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-2.5 font-semibold text-slate-200 max-w-[280px] truncate" title={tx.narration}>
                            {tx.narration}
                          </td>
                          <td className="py-2.5">
                            {/* Inline Category Tag Selector */}
                            <select
                              value={tx.tx_category}
                              onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 text-slate-300 hover:text-slate-200 px-2 py-0.5 rounded outline-none font-semibold text-[10px] cursor-pointer max-w-[120px] transition-colors"
                            >
                              {categoriesList.map((catName) => (
                                <option key={catName} value={catName} className="bg-[#0c1221]">{catName}</option>
                              ))}
                              {!categoriesList.includes(tx.tx_category) && (
                                <option value={tx.tx_category} className="bg-[#0c1221]">{tx.tx_category}</option>
                              )}
                            </select>
                          </td>
                          <td className={`py-2.5 text-right font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="text-[10px] text-slate-500 mt-4 italic">
                  Showing first {filteredTxs.length} matching transactions (ledgers loaded local in RAM).
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
