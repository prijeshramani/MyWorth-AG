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
  Filter,
  Plus,
  Edit3,
  Building
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
  metadata?: string | Record<string, any>;
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
  const [syncingPrices, setSyncingPrices] = useState<boolean>(false);
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

  // Add / Edit Asset Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formType, setFormType] = useState<string>('FIXED_DEPOSIT');
  const [formCategory, setFormCategory] = useState<string>('Debt');
  const [formIdentifier, setFormIdentifier] = useState<string>('');
  const [formValue, setFormValue] = useState<string>('');
  const [formMaturityAmount, setFormMaturityAmount] = useState<string>('');
  const [formInterestRate, setFormInterestRate] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formMaturityDate, setFormMaturityDate] = useState<string>('');
  const [formOwnerId, setFormOwnerId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const openAddModal = (defaultType = 'FIXED_DEPOSIT') => {
    setEditingAsset(null);
    setFormName(defaultType === 'FIXED_DEPOSIT' ? 'HDFC Bank Fixed Deposit' : (defaultType === 'SSY' ? 'Sukanya Samriddhi Yojana Account' : ''));
    setFormType(defaultType);
    setFormCategory(defaultType === 'FIXED_DEPOSIT' || defaultType === 'SSY' || defaultType === 'EPF' || defaultType === 'BOND' ? 'Debt' : (defaultType === 'STOCK' || defaultType === 'MUTUAL_FUND' ? 'Equity' : 'Debt'));
    setFormIdentifier(defaultType === 'FIXED_DEPOSIT' ? 'FD-7.25%-2027' : (defaultType === 'SSY' ? 'SSY-8.2%-2047' : ''));
    setFormValue('');
    setFormMaturityAmount('');
    setFormInterestRate(defaultType === 'SSY' ? '8.2' : '');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormMaturityDate('');
    setFormOwnerId(familyMembers.length > 0 ? familyMembers[0].id : '');
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormName(asset.name);
    setFormType(asset.type);
    setFormCategory(asset.category);
    setFormIdentifier(asset.identifier || '');
    setFormValue(asset.totalCost > 0 ? String(asset.totalCost) : String(asset.currentValue));

    let meta: any = {};
    if (asset.metadata) {
      try {
        meta = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata;
      } catch (e) {}
    }
    setFormMaturityAmount(meta.maturityAmount ? String(meta.maturityAmount) : '');
    setFormInterestRate(meta.interestRate ? String(meta.interestRate) : '');
    setFormStartDate(meta.startDate || (asset as any).startDate || '');
    setFormMaturityDate(meta.maturityDate || (asset as any).maturityDate || '');

    setFormOwnerId(asset.family_member_id || (familyMembers.length > 0 ? familyMembers[0].id : ''));
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formValue || isNaN(Number(formValue))) {
      alert('Please fill in a valid asset name and positive monetary value.');
      return;
    }

    try {
      setSubmitting(true);
      const numericVal = Number(formValue);
      const dateStr = new Date().toISOString().split('T')[0];

      const fdPayload = {
        interestRate: formInterestRate ? Number(formInterestRate) : undefined,
        maturityAmount: formMaturityAmount ? Number(formMaturityAmount) : undefined,
        startDate: formStartDate || undefined,
        maturityDate: formMaturityDate || undefined
      };

      if (editingAsset) {
        // Edit Existing Asset
        await apiClient.put(`/assets/${editingAsset.id}`, {
          name: formName,
          type: formType,
          category: formCategory,
          identifier: formIdentifier || null,
          familyMemberId: formOwnerId || null,
          currentValue: numericVal,
          ...fdPayload
        });
      } else {
        // Add New Asset
        const createRes = await apiClient.post('/assets', {
          name: formName,
          type: formType,
          category: formCategory,
          identifier: formIdentifier || undefined,
          ...fdPayload
        });

        const newAssetId = createRes.data?.id;
        if (newAssetId) {
          if (formOwnerId) {
            await apiClient.put(`/assets/${newAssetId}/owner`, { familyMemberId: formOwnerId });
          }

          const txDate = formStartDate || dateStr;

          await apiClient.post('/transactions', {
            asset_id: newAssetId,
            type: 'BUY',
            date: txDate,
            quantity: formType === 'STOCK' || formType === 'MUTUAL_FUND' ? numericVal : 1,
            price: formType === 'STOCK' || formType === 'MUTUAL_FUND' ? 1 : numericVal,
            amount: numericVal,
            source: 'MANUAL'
          });

          await apiClient.post(`/assets/${newAssetId}/prices`, {
            date: dateStr,
            price: numericVal
          });
        }
      }

      setIsModalOpen(false);
      setSelectedAsset(null);
      await fetchAssets();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving asset.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const assetTypes = ['MUTUAL_FUND', 'STOCK', 'NPS', 'EPF', 'FIXED_DEPOSIT', 'SSY', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'OTHER'];
  const assetLabels: Record<string, string> = {
    MUTUAL_FUND: 'Mutual Funds',
    STOCK: 'Stocks',
    NPS: 'National Pension Scheme',
    EPF: "Employees' Provident Fund",
    FIXED_DEPOSIT: 'Fixed Deposit (FD)',
    SSY: 'Sukanya Samriddhi Yojana (SSY)',
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
    FIXED_DEPOSIT: '#10B981',
    SSY: '#EC4899',
    GOLD: '#EAB308',
    BOND: '#38BDF8',
    PROPERTY: '#F43F5E',
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

  const handleSyncMarketPrices = async () => {
    try {
      setSyncingPrices(true);
      await apiClient.post('/sync');
      await fetchAssets();
    } catch (err: any) {
      console.error('Failed to sync market prices:', err);
    } finally {
      setSyncingPrices(false);
    }
  };

  return (
    <PageShell
      title="Portfolio Analytics Workspace"
      subtitle="Holistic wealth tracking, family-wise asset allocation, and side-by-side invested vs current valuation analysis."
      badge={<Badge variant="info" icon={<Briefcase className="w-3.5 h-3.5" />}>{sortedAssets.length} Holdings</Badge>}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncMarketPrices}
            disabled={syncingPrices || loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${syncingPrices ? 'animate-spin' : ''}`} />
            {syncingPrices ? 'Syncing Prices...' : 'Sync Market Prices'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => openAddModal('SSY')} className="bg-[#EC4899] hover:bg-[#DB2777] text-white">
            <Plus className="w-4 h-4 mr-1" /> Add SSY Account
          </Button>
          <Button variant="outline" size="sm" onClick={() => openAddModal('FIXED_DEPOSIT')} className="border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10">
            <Plus className="w-4 h-4 mr-1" /> Add FD
          </Button>
          <Button variant="outline" size="sm" onClick={() => openAddModal('MUTUAL_FUND')}>
            <Plus className="w-4 h-4 mr-1" /> Add Asset
          </Button>
        </div>
      }
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
                  {workspaceMode === 'holdings' ? (
                    <>
                      <th className="py-4 px-4 text-right">Holding Units / Qty</th>
                      <th className="py-4 px-4 text-right">Unit Price / NAV</th>
                      <th onClick={() => handleSort('value')} className="py-4 px-4 text-right cursor-pointer hover:text-white">
                        Current Market Value {sortField === 'value' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-4 px-6 text-right">Price Date / Status</th>
                    </>
                  ) : (
                    <>
                      <th onClick={() => handleSort('cost')} className="py-4 px-4 text-right cursor-pointer hover:text-white">
                        Total Invested (Cost) {sortField === 'cost' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th onClick={() => handleSort('value')} className="py-4 px-4 text-right cursor-pointer hover:text-white">
                        Current Market Value {sortField === 'value' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th onClick={() => handleSort('return')} className="py-4 px-6 text-right cursor-pointer hover:text-white">
                        Unrealized Return {sortField === 'return' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    </>
                  )}
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
                      {workspaceMode === 'holdings' ? (
                        <>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-[#F3F4F6]">
                            {Number((asset.currentUnits || 0).toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-[#38BDF8]">
                            {formatCurrency(asset.currentPrice || 0)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-[#F3F4F6]">
                            {formatCurrency(asset.currentValue)}
                          </td>
                          <td className="py-4 px-6 text-right font-mono text-[11px] text-[#9CA3AF]">
                            {asset.priceDate || 'Live'}
                          </td>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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

                {workspaceMode === 'holdings' ? (
                  <div className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl font-mono text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Holding Units / Qty:</span>
                      <span className="text-[#F3F4F6] font-semibold">
                        {Number((asset.currentUnits || 0).toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Unit Price / NAV:</span>
                      <span className="text-[#38BDF8] font-semibold">{formatCurrency(asset.currentPrice || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#2B2E35] pt-2">
                      <span className="text-[#9CA3AF]">Market Value:</span>
                      <span className="text-[#F3F4F6] font-bold">{formatCurrency(asset.currentValue)}</span>
                    </div>
                  </div>
                ) : (
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
                )}
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#38BDF8] font-mono">{selectedAsset.member_name || 'Rajesh Sharma'}</span>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">• {selectedAsset.category}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B0B0C] border border-[#2B2E35] text-[#9CA3AF] font-mono">
                    {selectedAsset.identifier || selectedAsset.type}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-1 text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl">
                <span className="text-[11px] text-[#9CA3AF] block font-sans">Invested Amount (Cost)</span>
                <span className="text-sm font-bold text-[#F3F4F6]">{formatCurrency(selectedAsset.totalCost)}</span>
              </div>
              <div className="p-3.5 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl">
                <span className="text-[11px] text-[#9CA3AF] block font-sans">Current Market Value</span>
                <span className="text-sm font-bold text-[#32D583]">{formatCurrency(selectedAsset.currentValue)}</span>
              </div>
              <div className="p-3.5 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl">
                <span className="text-[11px] text-[#9CA3AF] block font-sans">Unrealized Gain / Return</span>
                <div className={`text-sm font-bold ${selectedAsset.absoluteReturn >= 0 ? 'text-[#32D583]' : 'text-[#F43F5E]'}`}>
                  {selectedAsset.absoluteReturn >= 0 ? '+' : ''}{formatCurrency(selectedAsset.absoluteReturn)} ({selectedAsset.absoluteReturnPercent.toFixed(2)}%)
                </div>
              </div>
              <div className="p-3.5 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl">
                <span className="text-[11px] text-[#9CA3AF] block font-sans">Holding Units / NAV</span>
                <span className="text-xs font-semibold text-[#38BDF8]">
                  {Number((selectedAsset.currentUnits || 0).toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: 2 })} units @ {formatCurrency(selectedAsset.currentPrice || 0)}
                </span>
              </div>
            </div>

            {/* Historical Valuation & Price Growth Chart */}
            <div className="p-4 bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <TrendingUp className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Valuation & Price Growth Chart
                </span>
                {priceHistoryLoading ? (
                  <span className="text-[10px] text-slate-500 dark:text-[#9CA3AF]">Loading price trend...</span>
                ) : (
                  <span className={`font-mono font-bold text-xs ${selectedAsset.absoluteReturn >= 0 ? 'text-emerald-600 dark:text-[#32D583]' : 'text-rose-600 dark:text-[#F43F5E]'}`}>
                    {selectedAsset.absoluteReturn >= 0 ? '▲ Growth' : '▼ Return'} {selectedAsset.absoluteReturnPercent.toFixed(2)}%
                  </span>
                )}
              </div>

              {(() => {
                let points = priceHistory.map(p => ({ date: p.date, price: p.price }));
                if (points.length === 0) {
                  points = [
                    { date: selectedAsset.lastTransactionDate || 'Initial', price: selectedAsset.totalCost > 0 ? selectedAsset.totalCost : selectedAsset.currentValue * 0.8 },
                    { date: selectedAsset.priceDate || 'Today', price: selectedAsset.currentValue }
                  ];
                } else if (points.length === 1) {
                  points = [
                    { date: 'Initial', price: selectedAsset.totalCost > 0 ? selectedAsset.totalCost : points[0].price * 0.85 },
                    points[0]
                  ];
                }

                const pricesArr = points.map(p => p.price);
                const minVal = Math.min(...pricesArr);
                const maxVal = Math.max(...pricesArr);
                const range = (maxVal - minVal) || 1;

                const width = 500;
                const height = 110;

                const coords = points.map((p, idx) => {
                  const x = (idx / Math.max(1, points.length - 1)) * width;
                  const y = height - ((p.price - minVal) / range) * (height - 20) - 10;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                });

                const d = `M ${coords.join(' L ')}`;
                const areaD = `M 0,${height} L ${coords.join(' L ')} L ${width},${height} Z`;
                const isUp = selectedAsset.absoluteReturn >= 0;
                const color = isUp ? '#10B981' : '#F43F5E';

                return (
                  <div className="bg-white dark:bg-[#15161A] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-3 space-y-2">
                    <div className="relative w-full h-32 flex items-center justify-center">
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`assetGradient-${selectedAsset.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={areaD} fill={`url(#assetGradient-${selectedAsset.id})`} />
                        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono font-semibold text-slate-600 dark:text-[#9CA3AF] pt-2 border-t border-slate-200 dark:border-[#2B2E35]/60">
                      <span>{points[0]?.date || 'Start'}</span>
                      <span>{points[points.length - 1]?.date || 'Latest'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Transaction Ledger Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-[#2B2E35] pb-2">
                <span className="font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Recent Transaction History</span>
                <span className="text-[10px] text-[#38BDF8] font-mono">{assetTxs.length} Transactions</span>
              </div>

              {txLoading ? (
                <div className="text-center py-4 text-xs text-[#9CA3AF]">Loading transaction ledger...</div>
              ) : assetTxs.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#6B7280] font-mono">No direct transaction log entries found.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {assetTxs.map(tx => (
                    <div key={tx.id} className="p-2.5 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'BUY' ? 'bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/30' :
                            tx.type === 'SELL' ? 'bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/30' :
                            'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30'
                          }`}>
                            {tx.type}
                          </span>
                          <span className="text-[#F3F4F6]">{tx.date}</span>
                        </div>
                        <div className="text-[10px] text-[#9CA3AF] mt-1">
                          Qty: {tx.quantity} @ {formatCurrency(tx.price)}
                        </div>
                      </div>
                      <span className="font-bold text-[#F3F4F6]">{formatCurrency(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2B2E35]">
              <Button variant="outline" size="sm" onClick={() => { const target = selectedAsset; setSelectedAsset(null); openEditModal(target); }}>
                <Edit3 className="w-4 h-4 mr-1 text-[#4F7FFF]" /> Edit Asset
              </Button>
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

      {/* Add / Edit Asset Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161A] border border-slate-200 dark:border-[#2B2E35] w-full max-w-lg rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#2B2E35] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Building className="w-5 h-5 text-emerald-600 dark:text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F3F4F6]">
                    {editingAsset ? `Edit ${editingAsset.name}` : (formType === 'FIXED_DEPOSIT' ? 'Add Fixed Deposit (FD)' : 'Add New Asset')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                    {formType === 'FIXED_DEPOSIT' ? 'Enter bank FD details, principal amount, and interest terms' : 'Add manual portfolio asset details'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4 text-xs">
              {/* Asset Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Asset Name / Bank Institution *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank Fixed Deposit, SBI FD 7.1%"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-[#F3F4F6] outline-none focus:border-[#4F7FFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Asset Type */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Asset Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormType(t);
                      if (t === 'FIXED_DEPOSIT' || t === 'EPF' || t === 'BOND') setFormCategory('Debt');
                      else if (t === 'STOCK' || t === 'MUTUAL_FUND') setFormCategory('Equity');
                      else if (t === 'BANK_ACCOUNT') setFormCategory('Cash');
                    }}
                    className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-[#F3F4F6] outline-none focus:border-[#4F7FFF]"
                  >
                    <option value="FIXED_DEPOSIT">Fixed Deposit (FD)</option>
                    <option value="SSY">Sukanya Samriddhi Yojana (SSY)</option>
                    <option value="MUTUAL_FUND">Mutual Fund</option>
                    <option value="STOCK">Stock / Equity</option>
                    <option value="BOND">Bond / Fixed Income</option>
                    <option value="BANK_ACCOUNT">Bank Account / Savings</option>
                    <option value="EPF">EPF (Provident Fund)</option>
                    <option value="NPS">National Pension System</option>
                    <option value="GOLD">Gold & Metals</option>
                    <option value="PROPERTY">Real Estate</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Category Class *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-[#F3F4F6] outline-none focus:border-[#4F7FFF]"
                  >
                    <option value="Debt">Debt (Fixed Income)</option>
                    <option value="Equity">Equity</option>
                    <option value="Cash">Cash & Liquid</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Alternative">Alternative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Principal / Current Monetary Value */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">
                    {formType === 'FIXED_DEPOSIT' ? 'Deposit Principal (₹) *' : (formType === 'SSY' ? 'SSY Current Balance / Deposit (₹) *' : 'Current Value / Cost (₹) *')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="e.g. 150000"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#4F7FFF]"
                  />
                </div>

                {/* Account / FD # / Note */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">
                    {formType === 'SSY' ? 'SSY Passbook / Account #' : 'Account / FD # / Identifier'}
                  </label>
                  <input
                    type="text"
                    placeholder={formType === 'SSY' ? 'e.g. SSY-981204' : 'e.g. 263002277881'}
                    value={formIdentifier}
                    onChange={(e) => setFormIdentifier(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#4F7FFF]"
                  />
                </div>
              </div>

              {formType === 'SSY' && (
                <div className="p-3.5 bg-rose-50/60 dark:bg-[#1f131a] border border-rose-200/80 dark:border-[#3b1c2a] rounded-xl space-y-3.5">
                  <div className="text-rose-700 dark:text-[#EC4899] font-semibold text-xs flex items-center justify-between">
                    <span>Sukanya Samriddhi Yojana (SSY) Terms & Tax Benefits</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                      Section 80C • EEE Status (100% Tax Free)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Interest Rate (% p.a. Compounded)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="8.2"
                        value={formInterestRate || '8.2'}
                        onChange={(e) => setFormInterestRate(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#EC4899]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Maturity Date (21 Years)</label>
                      <input
                        type="date"
                        value={formMaturityDate}
                        onChange={(e) => setFormMaturityDate(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#EC4899]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formType === 'FIXED_DEPOSIT' && (
                <div className="p-3.5 bg-emerald-50/60 dark:bg-[#141824] border border-emerald-200/80 dark:border-[#2B2E35] rounded-xl space-y-3.5">
                  <div className="text-emerald-700 dark:text-[#10B981] font-semibold text-xs flex items-center gap-1.5">
                    <span>Fixed Deposit Interest & Maturity Terms</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Maturity Amount (₹) (Optional)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 36928"
                        value={formMaturityAmount}
                        onChange={(e) => setFormMaturityAmount(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#10B981]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Interest Rate (% p.a.)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 7.25"
                        value={formInterestRate}
                        onChange={(e) => setFormInterestRate(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#10B981]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Deposit Start Date</label>
                      <input
                        type="date"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#10B981]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Maturity Date</label>
                      <input
                        type="date"
                        value={formMaturityDate}
                        onChange={(e) => setFormMaturityDate(e.target.value)}
                        className="w-full bg-white dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2 text-slate-900 dark:text-[#F3F4F6] font-mono outline-none focus:border-[#10B981]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Family Member Ownership */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#9CA3AF] mb-1">Family Member Owner</label>
                <select
                  value={formOwnerId}
                  onChange={(e) => setFormOwnerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-[#F3F4F6] outline-none focus:border-[#4F7FFF]"
                >
                  <option value="">-- Primary Account Holder --</option>
                  {familyMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relationship})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#2B2E35]">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting} className="bg-[#10B981] hover:bg-[#059669] text-white">
                  {submitting ? 'Saving Asset...' : (editingAsset ? 'Save Changes' : 'Add Asset')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
