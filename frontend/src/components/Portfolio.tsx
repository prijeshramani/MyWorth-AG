import React, { useEffect, useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { apiClient } from '../services/apiClient';
import { PageShell } from './layout/PageShell';
import { Card } from './ui/Card';
import { StatCard } from './ui/StatCard';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
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
  Sparkles,
  Users,
  User,
  PieChart as PieIcon,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter
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
  family_member_id?: number;
  member_name?: string;
  member_relationship?: string;
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

interface FamilyMemberOption {
  id: number;
  name: string;
  relationship: string;
}

export default function Portfolio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberOption[]>([]);
  const [cashflow, setCashflow] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Drill-down asset details drawer state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetTxs, setAssetTxs] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState<boolean>(false);

  // Filters, family member and workspace view states
  const [selectedMemberId, setSelectedMemberId] = useState<number | 'ALL'>('ALL');
  const [workspaceMode, setWorkspaceMode] = useState<'holdings' | 'valuation' | 'allocation'>('valuation');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [sortField, setSortField] = useState<'name' | 'value' | 'cost' | 'return'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { activeFamilyId, datasetMode } = useUiStore();

  const fetchFamilyMembers = async () => {
    try {
      const res = await apiClient.get<any>(`/v1/family-members?familyId=${activeFamilyId}`);
      const raw = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setFamilyMembers(raw.map((m: any) => ({ id: m.id, name: m.name, relationship: m.relationship || 'Member' })));
    } catch {
      setFamilyMembers([
        { id: 1, name: 'Rajesh Sharma', relationship: 'Self' },
        { id: 2, name: 'Priya Sharma', relationship: 'Spouse' }
      ]);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Asset[]>('/assets');
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashflow = async () => {
    try {
      const res = await apiClient.get('/cashflow');
      setCashflow(res.data);
    } catch (err) {
      console.error('Error fetching cashflow inside portfolio:', err);
    }
  };

  const fetchAssetTransactions = async (assetId: number) => {
    try {
      setTxLoading(true);
      const res = await apiClient.get<Transaction[]>(`/transactions?assetId=${assetId}`);
      setAssetTxs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchAssetPriceHistory = async (assetId: number) => {
    try {
      setPriceHistoryLoading(true);
      const res = await apiClient.get<PricePoint[]>(`/assets/${assetId}/prices`);
      setPriceHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
    fetchAssets();
    fetchCashflow();
  }, [datasetMode, activeFamilyId]);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    fetchAssetTransactions(asset.id);
    fetchAssetPriceHistory(asset.id);
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('Are you sure you want to delete this asset? This will permanently delete all its transactions and prices.')) return;
    
    try {
      await apiClient.delete(`/assets/${assetId}`);
      setSelectedAsset(null);
      fetchAssets();
    } catch (err) {
      console.error(err);
      alert('Network error deleting asset');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="w-8 h-8 text-[#4F7FFF] animate-spin" />
        <span className="text-xs text-[#9CA3AF]">Loading portfolio analytics workspace...</span>
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

  const assetTypes = ['MUTUAL_FUND', 'STOCK', 'NPS', 'EPF', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'OTHER'];
  const assetLabels: Record<string, string> = {
    MUTUAL_FUND: 'Mutual Funds',
    STOCK: 'Stocks',
    NPS: 'National Pension Scheme',
    EPF: "Employees' Provident Fund",
    GOLD: 'Gold & Metals',
    BOND: 'Bonds',
    PROPERTY: 'Real Estate',
    BANK_ACCOUNT: 'Cash & Savings',
    OTHER: 'Other Assets'
  };

  const assetTypeColors: Record<string, string> = {
    MUTUAL_FUND: '#4F7FFF',
    STOCK: '#32D583',
    NPS: '#F79009',
    EPF: '#A855F7',
    GOLD: '#EAB308',
    BOND: '#38BDF8',
    PROPERTY: '#EC4899',
    BANK_ACCOUNT: '#06B6D4',
    OTHER: '#6B7280'
  };

  // Filter Assets by Family Member First
  const memberFilteredAssets = assets.filter(asset => {
    if (selectedMemberId === 'ALL') return true;
    return asset.family_member_id === selectedMemberId;
  });

  // Calculate overall metrics for filtered member assets
  const totalWorth = memberFilteredAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalCost = memberFilteredAssets.reduce((sum, a) => sum + a.totalCost, 0);
  const totalGains = totalWorth - totalCost;
  const overallReturns = totalCost > 0 ? (totalGains / totalCost) * 100 : 0;

  // Calculate allocation weights
  const categoryWeights = assetTypes.map(type => {
    const typeValue = memberFilteredAssets.filter(a => a.type === type).reduce((sum, a) => sum + a.currentValue, 0);
    return {
      type,
      label: assetLabels[type] || type,
      value: typeValue,
      percentage: totalWorth > 0 ? (typeValue / totalWorth) * 100 : 0,
      color: assetTypeColors[type] || '#4F7FFF'
    };
  }).filter(item => item.value > 0);

  // Sorting handler
  const handleSort = (field: 'name' | 'value' | 'cost' | 'return') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and search assets
  const filteredAssets = memberFilteredAssets.filter(asset => {
    const matchesFilter = filterType === 'ALL' || asset.type === filterType;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (asset.identifier && asset.identifier.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (asset.member_name && asset.member_name.toLowerCase().includes(searchQuery.toLowerCase()));
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
    } else if (sortField === 'cost') {
      compA = a.totalCost;
      compB = b.totalCost;
    } else if (sortField === 'return') {
      compA = a.absoluteReturnPercent;
      compB = b.absoluteReturnPercent;
    }

    return sortDirection === 'asc' ? compA - compB : compB - compA;
  });

  return (
    <PageShell
      title="Portfolio Analytics Workspace"
      subtitle="Holistic wealth tracking, family-wise asset allocation, and side-by-side invested vs current valuation analysis."
      badge={<Badge variant="info" icon={<Briefcase className="w-3.5 h-3.5" />}>{sortedAssets.length} Holdings</Badge>}
    >
      {/* 1. Family Member Filter Chip Bar */}
      <Card variant="glass" padding="sm" className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
          <Users className="w-4 h-4 text-[#4F7FFF]" />
          Select Portfolio Scope / Family Member:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedMemberId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedMemberId === 'ALL'
                ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                : 'bg-[#15161A] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
            }`}
          >
            All Family Members ({assets.length})
          </button>
          {familyMembers.map((member) => {
            const count = assets.filter(a => a.family_member_id === member.id).length;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  selectedMemberId === member.id
                    ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                    : 'bg-[#15161A] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
                }`}
              >
                <span>{member.name}</span>
                <span className="text-[10px] bg-[#0B0B0C] px-1.5 py-0.5 rounded-full font-mono text-[#4F7FFF]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Current Portfolio Value"
          value={formatCurrency(totalWorth)}
          subtitle="Real-time Market Valuation"
          trend={{ value: 'Live', direction: 'up' }}
          icon={<DollarSign className="w-5 h-5 text-[#32D583]" />}
        />

        <StatCard
          title="Total Invested Amount (Cost)"
          value={formatCurrency(totalCost)}
          subtitle="Capital Invested"
          trend={{ value: 'Cost Basis', direction: 'neutral' }}
          icon={<Briefcase className="w-5 h-5 text-[#4F7FFF]" />}
        />

        <StatCard
          title="Net Return / Gain"
          value={`${totalGains >= 0 ? '+' : ''}${formatCurrency(totalGains)}`}
          subtitle={`${totalGains >= 0 ? '+' : ''}${overallReturns.toFixed(2)}% Absolute Return`}
          trend={{ value: `${overallReturns.toFixed(1)}%`, direction: totalGains >= 0 ? 'up' : 'down' }}
          icon={<TrendingUp className={`w-5 h-5 ${totalGains >= 0 ? 'text-[#32D583]' : 'text-[#F43F5E]'}`} />}
        />
      </div>

      {/* 3. Workspace Mode Switcher & Category Filters */}
      <Card variant="glass" padding="sm" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Workspace Mode Tabs */}
        <div className="flex items-center gap-2 bg-[#0B0B0C] p-1 rounded-xl border border-[#2B2E35]">
          <button
            onClick={() => setWorkspaceMode('valuation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              workspaceMode === 'valuation' ? 'bg-[#4F7FFF] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            Invested vs Valuation
          </button>
          <button
            onClick={() => setWorkspaceMode('holdings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              workspaceMode === 'holdings' ? 'bg-[#4F7FFF] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            Holdings View
          </button>
          <button
            onClick={() => setWorkspaceMode('allocation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              workspaceMode === 'allocation' ? 'bg-[#4F7FFF] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            Allocation Breakdown
          </button>
        </div>

        {/* Category Filters & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search holding or member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#15161A] border border-[#2B2E35] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
            />
          </div>

          <div className="flex items-center bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-[#4F7FFF] text-white' : 'text-[#9CA3AF]'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'cards' ? 'bg-[#4F7FFF] text-white' : 'text-[#9CA3AF]'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Allocation Breakdown Workspace Mode */}
      {workspaceMode === 'allocation' && (
        <Card variant="glass" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#4F7FFF]" />
              Asset Weight Distribution
            </h3>
            <span className="text-xs text-[#9CA3AF]">Filtered Portfolio Total: <strong className="text-[#F3F4F6]">{formatCurrency(totalWorth)}</strong></span>
          </div>

          {categoryWeights.length === 0 ? (
            <div className="h-4 bg-[#0B0B0C] rounded-full border border-[#2B2E35]"></div>
          ) : (
            <div className="h-4 w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-full overflow-hidden flex shadow-inner">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {categoryWeights.map(item => (
              <div key={item.type} className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[#F3F4F6]">{item.label}</span>
                </div>
                <div className="text-sm font-bold font-mono text-[#F3F4F6]">{formatCurrency(item.value)}</div>
                <div className="text-[10px] text-[#9CA3AF] font-mono">{item.percentage.toFixed(1)}% of portfolio</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Main Side-by-Side Invested vs Current Valuation Table */}
      {sortedAssets.length === 0 ? (
        <Card variant="glass" className="p-12 text-center max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <h3 className="font-bold text-base text-[#F3F4F6]">No matching assets found</h3>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Try adjusting your search filters or family member selection.
          </p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card variant="default" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B0B0C] text-[#9CA3AF] border-b border-[#2B2E35] font-mono uppercase tracking-wider select-none">
                  <th onClick={() => handleSort('name')} className="py-4 px-6 cursor-pointer hover:text-white">
                    Asset & Identifier {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-4 px-4">Owner / Family Member</th>
                  <th className="py-4 px-4">Category</th>
                  <th onClick={() => handleSort('cost')} className="py-4 px-4 text-right cursor-pointer hover:text-white">
                    Total Invested (Cost) {sortField === 'cost' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('value')} className="py-4 px-4 text-right cursor-pointer hover:text-white">
                    Current Market Value {sortField === 'value' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('return')} className="py-4 px-6 text-right cursor-pointer hover:text-white">
                    Unrealized Return {sortField === 'return' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2E35]/50">
                {sortedAssets.map((asset) => {
                  const isProfit = asset.absoluteReturn >= 0;
                  return (
                    <tr 
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      className="hover:bg-[#15161A] cursor-pointer transition-all duration-150 group"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#F3F4F6] group-hover:text-[#4F7FFF] transition-colors">{asset.name}</div>
                        <div className="text-[10px] font-mono text-[#6B7280]">{asset.identifier || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {asset.member_name || 'Rajesh Sharma'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#15161A] border border-[#2B2E35] text-[#9CA3AF] font-semibold uppercase">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-semibold text-[#9CA3AF]">
                        {formatCurrency(asset.totalCost)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-[#F3F4F6]">
                        {formatCurrency(asset.currentValue)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono">
                        <div className={`font-bold ${isProfit ? 'text-[#32D583]' : 'text-[#F43F5E]'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(asset.absoluteReturn)}
                        </div>
                        <div className={`text-[10px] font-bold ${isProfit ? 'text-[#32D583]' : 'text-[#F43F5E]'}`}>
                          ({isProfit ? '+' : ''}{asset.absoluteReturnPercent.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Cards Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAssets.map((asset) => {
            const isProfit = asset.absoluteReturn >= 0;
            return (
              <Card key={asset.id} onClick={() => handleSelectAsset(asset)} className="space-y-4 cursor-pointer hover:border-[#4F7FFF]/50 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-[#F3F4F6]">{asset.name}</h4>
                    <span className="text-[10px] font-mono text-[#38BDF8]">{asset.member_name || 'Rajesh Sharma'} • {asset.category}</span>
                  </div>
                  <Badge variant={isProfit ? 'success' : 'danger'} size="sm">
                    {isProfit ? '+' : ''}{asset.absoluteReturnPercent.toFixed(2)}%
                  </Badge>
                </div>

                <div className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Invested Amount:</span>
                    <span className="text-[#9CA3AF] font-semibold">{formatCurrency(asset.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Current Value:</span>
                    <span className="text-[#F3F4F6] font-bold">{formatCurrency(asset.currentValue)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2B2E35] pt-2">
                    <span className="text-[#9CA3AF]">Gain / Loss:</span>
                    <span className={`font-bold ${isProfit ? 'text-[#32D583]' : 'text-[#F43F5E]'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(asset.absoluteReturn)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Asset Details Drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
          <div className="bg-[#15161A] border-l border-[#2B2E35] w-full max-w-xl h-full p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-[#2B2E35] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#F3F4F6]">{selectedAsset.name}</h3>
                <span className="text-xs text-[#38BDF8] font-mono">{selectedAsset.member_name || 'Rajesh Sharma'} • {selectedAsset.category}</span>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-1 text-[#9CA3AF] hover:text-[#F3F4F6]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl">
                <span className="text-xs text-[#9CA3AF] block">Invested Amount (Cost)</span>
                <span className="text-base font-bold font-mono text-[#F3F4F6]">{formatCurrency(selectedAsset.totalCost)}</span>
              </div>
              <div className="p-4 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl">
                <span className="text-xs text-[#9CA3AF] block">Current Market Value</span>
                <span className="text-base font-bold font-mono text-[#32D583]">{formatCurrency(selectedAsset.currentValue)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2B2E35]">
              <Button variant="danger" size="sm" onClick={() => handleDeleteAsset(selectedAsset.id)}>
                Delete Asset
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAsset(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
