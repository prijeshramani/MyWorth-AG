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
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PieChart as PieIcon, 
  FileUp, 
  PlusCircle, 
  RefreshCw 
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [cashflowData, setCashflowData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchDashboardAndCashflow = async () => {
    try {
      setLoading(true);
      const [dashRes, cfRes] = await Promise.all([
        fetch('http://localhost:5000/api/dashboard'),
        fetch('http://localhost:5000/api/cashflow')
      ]);
      if (dashRes.ok && cfRes.ok) {
        const dashJson = await dashRes.json();
        const cfJson = await cfRes.json();
        setData(dashJson);
        setCashflowData(cfJson);
      } else {
        setError('Failed to fetch dashboard statistics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardAndCashflow();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400">Compiling financial statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/40 text-red-400 rounded-2xl">
        <h3 className="font-semibold text-lg">Error Loading Dashboard</h3>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={fetchDashboardAndCashflow} className="mt-4 px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-white rounded-xl text-xs font-semibold transition-all">
          Try Again
        </button>
      </div>
    );
  }

  const { summary, typeBreakdown, categoryBreakdown, recentActivity, timelineData } = data;
  const hasAssets = summary.totalWorth > 0;

  // Render Onboarding / Empty State
  if (!hasAssets) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 px-6">
        <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/5">
          <PieIcon className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Welcome to MyWorth
        </h2>
        <p className="text-slate-400 mt-3 text-base max-w-xl mx-auto leading-relaxed">
          Aggregating and visualizing your net worth has never been simpler. All your financial data stays completely offline in a local database.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">
          {/* Card 1: Import */}
          <div className="card-glass p-6 rounded-2xl text-left flex flex-col justify-between group hover:border-indigo-500/35 transition-all">
            <div>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20">
                <FileUp className="w-6 h-6 text-indigo-400" />
              </div>
              <h4 className="font-bold text-lg text-slate-100 group-hover:text-indigo-400 transition-colors">Import PDF Statement</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Drag and drop password-protected CAMS CAS statements, NPS Protean summaries, or Stock contract notes. Decryption happens entirely in-memory on your device.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('import')}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition-all"
            >
              Parse Statements
            </button>
          </div>

          {/* Card 2: Manual */}
          <div className="card-glass p-6 rounded-2xl text-left flex flex-col justify-between group hover:border-emerald-500/35 transition-all">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                <PlusCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="font-bold text-lg text-slate-100 group-hover:text-emerald-400 transition-colors">Add Manual Investment</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Add investments manually like bank balances, real estate, gold, bonds, or stock transactions without requiring files.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('transactions')}
              className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all"
            >
              Add Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Setup data for Charts
  const assetColors: Record<string, string> = {
    MUTUAL_FUND: '#6366f1', // Indigo
    STOCK: '#10b981',       // Emerald
    NPS: '#f59e0b',         // Amber
    EPF: '#8b5cf6',         // Violet/Indigo
    GOLD: '#eab308',        // Yellow
    BOND: '#3b82f6',        // Blue
    PROPERTY: '#ec4899',    // Pink
    BANK_ACCOUNT: '#06b6d4',// Cyan
    OTHER: '#64748b'        // Slate
  };

  const categoryColors: Record<string, string> = {
    Equity: '#3b82f6',
    Debt: '#10b981',
    Hybrid: '#f59e0b',
    Cash: '#06b6d4',
    Alternative: '#a855f7',
    Other: '#64748b'
  };

  const assetLabels: Record<string, string> = {
    MUTUAL_FUND: 'Mutual Funds',
    STOCK: 'Stocks',
    NPS: 'National Pension Scheme',
    EPF: "Employees' Provident Fund (EPF)",
    GOLD: 'Gold',
    BOND: 'Bonds',
    PROPERTY: 'Real Estate',
    BANK_ACCOUNT: 'Bank/Savings',
    OTHER: 'Others'
  };

  const pieData = Object.entries(typeBreakdown)
    .filter(([_, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      name: assetLabels[key] || key,
      value: Math.round(value as number),
      color: assetColors[key] || '#6366f1'
    }));

  const donutData = Object.entries(categoryBreakdown)
    .filter(([_, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      name: key,
      value: Math.round(value as number),
      color: categoryColors[key] || '#6366f1'
    }));

  const isProfit = summary.totalProfit >= 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Net Worth */}
        <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">Total Net Worth</span>
          <h3 className="text-3xl font-extrabold text-white mt-2.5 leading-none">
            {formatCurrency(summary.totalWorth)}
          </h3>
          <span className="text-slate-500 text-[10px] font-medium block mt-3">Current aggregate value of all assets</span>
        </div>

        {/* KPI 2: Capital Invested */}
        <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all"></div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">Total Capital Invested</span>
          <h3 className="text-3xl font-extrabold text-white mt-2.5 leading-none">
            {formatCurrency(summary.totalCost)}
          </h3>
          <span className="text-slate-500 text-[10px] font-medium block mt-3">Cumulative net buy-ins (cost basis)</span>
        </div>

        {/* KPI 3: Profit / Loss */}
        <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl transition-all ${isProfit ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-red-500/5 group-hover:bg-red-500/10'}`}></div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">Absolute Gain / Loss</span>
          <h3 className={`text-3xl font-extrabold mt-2.5 leading-none flex items-center gap-1.5 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{formatCurrency(summary.totalProfit)}
          </h3>
          <span className="text-slate-500 text-[10px] font-medium block mt-3">Absolute portfolio growth valuation</span>
        </div>

        {/* KPI 4: Absolute Return % */}
        <div className="card-glass p-6 rounded-2xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl transition-all ${isProfit ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-red-500/5 group-hover:bg-red-500/10'}`}></div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">Total Absolute Returns</span>
          <h3 className={`text-3xl font-extrabold mt-2.5 leading-none flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
            {summary.profitPercent.toFixed(2)}%
          </h3>
          <span className="text-slate-500 text-[10px] font-medium block mt-3">Portfolio yield over investment cost</span>
        </div>
      </div>

      {/* Main Row: Historical Chart & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth timeline Area Chart */}
        <div className="card-glass p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-4 mb-4">
            <div>
              <h4 className="font-bold text-lg text-slate-100">Wealth Progression</h4>
              <span className="text-xs text-slate-400">Net worth progression over the last 30 active trading days</span>
            </div>
            <div className="p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl flex gap-1">
              <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-lg bg-indigo-600 text-white cursor-pointer shadow-sm">30D</span>
            </div>
          </div>

          <div className="h-72 w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 10000000) return `${(val/10000000).toFixed(1)}Cr`;
                    if (val >= 100000) return `${(val/100000).toFixed(1)}L`;
                    if (val >= 1000) return `${(val/1000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Net Worth']}
                  labelFormatter={(label) => `Trading Date: ${new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorWorth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Pie Chart */}
        <div className="card-glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="border-b border-slate-800/40 pb-4 mb-4">
            <h4 className="font-bold text-lg text-slate-100">Asset Distribution</h4>
            <span className="text-xs text-slate-400">Breakdown of holdings by investment asset classes</span>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
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
                  formatter={(val: number) => [formatCurrency(val), 'Holdings']} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Total Holdings</span>
              <span className="text-xl font-bold text-slate-200">{formatCurrency(summary.totalWorth)}</span>
            </div>
          </div>

          {/* Custom Labels List */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-800/30">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-400 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Flow & Liquidity Insights Section */}
      {cashflowData && cashflowData.hasData && (
        <div className="card-glass p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800/40 pb-4 mb-6 gap-3">
            <div>
              <h4 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cash Flow & Liquidity Insights
              </h4>
              <span className="text-xs text-slate-400">Aggregated real-time cash inflows, outflows, and savings performance</span>
            </div>
            <button 
              onClick={() => onNavigate('cashflow')}
              className="text-xs px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold transition-all shadow-md"
            >
              Open Cash Flow Hub
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* mini kpi split */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Inflow</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">
                    {formatCurrency(cashflowData.summary.totalIncome)}
                  </span>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Outflow</span>
                  <span className="text-lg font-bold text-red-400 mt-1 block">
                    {formatCurrency(cashflowData.summary.totalExpense)}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-indigo-900/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase block tracking-wider">Net Savings</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {formatCurrency(cashflowData.summary.netSavings)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Savings Rate</span>
                  <span className="text-lg font-extrabold text-indigo-300 mt-1 block">
                    {cashflowData.summary.savingsRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/20 p-3 rounded-lg border border-slate-900">
                💡 Your savings rate of <strong className="text-indigo-400">{cashflowData.summary.savingsRate.toFixed(1)}%</strong> indicates that you are accumulating cash at a solid pace. Keep expenses controlled to maximize investment bandwidth.
              </div>
            </div>

            {/* mini inflow vs outflow chart */}
            <div className="md:col-span-2 h-48 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowData.monthlyTimeline.slice(-6)}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false}
                    tickFormatter={(str) => {
                      const [year, month] = str.split('-');
                      const date = new Date(Number(year), Number(month) - 1, 1);
                      return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
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
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }}
                    formatter={(value: any, name: string) => [formatCurrency(Number(value)), name === 'income' ? 'Earnings' : 'Expenses']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="income" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="expense" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2 text-[10px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  <span className="text-slate-400">Monthly Earnings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                  <span className="text-slate-400">Monthly Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Diversification & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown (Equity vs Debt) */}
        <div className="card-glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="border-b border-slate-800/40 pb-4 mb-4">
            <h4 className="font-bold text-lg text-slate-100">Category Exposure</h4>
            <span className="text-xs text-slate-400">Portfolio allocations by financial category profile</span>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
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
                  formatter={(val: number) => [formatCurrency(val), 'Holdings']} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Exposure</span>
              <span className="text-xl font-bold text-slate-200">
                {formatCurrency(summary.totalWorth)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs pt-4 border-t border-slate-800/30">
            {donutData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-400 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="card-glass p-6 rounded-2xl flex flex-col justify-between">
          <div className="border-b border-slate-800/40 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg text-slate-100">Recent Activities</h4>
              <span className="text-xs text-slate-400">Audit tracker of your last 5 transactions</span>
            </div>
            <button 
              onClick={() => onNavigate('transactions')} 
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
            >
              See Ledger
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-800/30">
            {recentActivity.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 py-8">
                No recent activity recorded.
              </div>
            ) : (
              recentActivity.map((act: any) => {
                const isBuy = act.type === 'BUY' || act.type === 'REINVEST';
                const assetTypeLabel = assetLabels[act.asset_type] || act.asset_type;
                return (
                  <div key={act.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                    <div className="min-w-0">
                      <h5 className="font-semibold text-sm text-slate-200 truncate">{act.asset_name}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                          {assetTypeLabel}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(act.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-sm font-bold block ${isBuy ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {isBuy ? 'BUY' : 'SELL'} {formatCurrency(act.amount)}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {act.quantity.toFixed(3)} units @ {formatCurrency(act.price)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
