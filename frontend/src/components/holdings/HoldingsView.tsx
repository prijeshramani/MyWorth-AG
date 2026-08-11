import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, FileUp, Users, User, Table as TableIcon, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';
import { HoldingTable, type HoldingRow } from '../ui/HoldingTable';
import { PageShell } from '../layout/PageShell';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

const DEMO_HOLDINGS: HoldingRow[] = [
  { holdingId: 1, assetName: 'Reliance Industries Ltd', symbol: 'RELIANCE', assetType: 'STOCK', quantity: 150, unitPrice: 2850, investedValue: 360000, formattedInvestedValue: '₹3,60,000.00', marketValue: 427500, formattedMarketValue: '₹4,27,500.00', unrealizedGainAmount: 67500, formattedUnrealizedGainAmount: '+₹67,500.00', unrealizedGainPercent: 18.75, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 2, assetName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', assetType: 'STOCK', quantity: 200, unitPrice: 1620, investedValue: 299445, formattedInvestedValue: '₹2,99,445.00', marketValue: 324000, formattedMarketValue: '₹3,24,000.00', unrealizedGainAmount: 24555, formattedUnrealizedGainAmount: '+₹24,555.00', unrealizedGainPercent: 8.20, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 3, assetName: 'Parag Parikh Flexi Cap Fund', symbol: 'PPFCF-GR', assetType: 'MUTUAL_FUND', quantity: 500, unitPrice: 75.4, investedValue: 302568, formattedInvestedValue: '₹3,02,568.00', marketValue: 377000, formattedMarketValue: '₹3,77,000.00', unrealizedGainAmount: 74432, formattedUnrealizedGainAmount: '+₹74,432.00', unrealizedGainPercent: 24.60, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 4, assetName: 'SBI Bluechip Mutual Fund', symbol: 'SBIBLUE-GR', assetType: 'MUTUAL_FUND', quantity: 800, unitPrice: 82.1, investedValue: 584341, formattedInvestedValue: '₹5,84,341.00', marketValue: 656800, formattedMarketValue: '₹6,56,800.00', unrealizedGainAmount: 72459, formattedUnrealizedGainAmount: '+₹72,459.00', unrealizedGainPercent: 12.40, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 5, assetName: 'Employee Provident Fund (EPF)', symbol: 'EPF-ACC', assetType: 'EPF', quantity: 1, unitPrice: 850000, investedValue: 785219, formattedInvestedValue: '₹7,85,219.00', marketValue: 850000, formattedMarketValue: '₹8,50,000.00', unrealizedGainAmount: 64781, formattedUnrealizedGainAmount: '+₹64,781.00', unrealizedGainPercent: 8.25, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' }
];

export const HoldingsView: React.FC = () => {
  const { datasetMode, setActiveTab, activeFamilyId } = useUiStore();
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: number; name: string; relationship: string }>>([]);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHoldings = () => {
    if (datasetMode === 'DEMO') {
      setHoldings(DEMO_HOLDINGS);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
      apiClient.get<any[]>('/assets')
        .then((res) => {
          const raw = Array.isArray(res.data) ? res.data : [];
          const mapped: HoldingRow[] = raw.map((a: any) => {
            const investedVal = a.totalCost || 0;
            const mktVal = a.currentValue || 0;
            const gainAmt = a.absoluteReturn !== undefined ? a.absoluteReturn : (mktVal - investedVal);
            const gainSign = gainAmt >= 0 ? '+' : '-';
            const absGain = Math.abs(gainAmt);

            return {
              holdingId: a.id,
              assetName: a.name,
              symbol: a.identifier || undefined,
              assetType: a.type || 'OTHER',
              quantity: a.currentUnits || 0,
              unitPrice: a.currentPrice || 0,
              investedValue: investedVal,
              formattedInvestedValue: `₹${investedVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              marketValue: mktVal,
              formattedMarketValue: `₹${mktVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              unrealizedGainAmount: gainAmt,
              formattedUnrealizedGainAmount: `${gainSign}₹${absGain.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              unrealizedGainPercent: a.absoluteReturnPercent || 0,
              familyMemberId: a.familyMemberId,
              familyMemberName: a.familyMemberName,
              familyMemberRelationship: a.familyMemberRelationship
            };
          });
          setHoldings(mapped);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
    }
  };

  const fetchMembers = () => {
    apiClient.get<any>(`/family-members?familyId=${activeFamilyId}`)
      .then((res) => {
        const members = res.data?.data || res.data || [];
        if (Array.isArray(members)) {
          setFamilyMembers(members);
        }
      })
      .catch((e) => console.error('Failed to fetch family members in HoldingsView:', e));
  };

  useEffect(() => {
    fetchHoldings();
    fetchMembers();
  }, [datasetMode]);

  const handleReassignOwner = async (assetId: number, newMemberId: number) => {
    try {
      await apiClient.put(`/assets/${assetId}/owner`, { familyMemberId: newMemberId });
      const targetMember = familyMembers.find(m => m.id === newMemberId);
      setHoldings(prev => prev.map(h => {
        if (h.holdingId === assetId) {
          return {
            ...h,
            familyMemberId: newMemberId,
            familyMemberName: targetMember ? targetMember.name : h.familyMemberName,
            familyMemberRelationship: targetMember ? targetMember.relationship : h.familyMemberRelationship
          };
        }
        return h;
      }));
    } catch (err: any) {
      alert(`Failed to reassign asset owner: ${err.message || 'Server error'}`);
    }
  };

  const filteredHoldings = selectedMemberFilter === 'ALL'
    ? holdings
    : holdings.filter(h => h.familyMemberId === selectedMemberFilter);

  // Compute portfolio aggregate metrics
  const totalInvested = filteredHoldings.reduce((sum, h) => sum + (h.investedValue || 0), 0);
  const totalMarket = filteredHoldings.reduce((sum, h) => {
    if (h.marketValue !== undefined) return sum + h.marketValue;
    return sum + (h.quantity * h.unitPrice);
  }, 0);
  const totalGain = totalMarket - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const isOverallGain = totalGain >= 0;

  return (
    <PageShell
      title="Holdings & Asset Inventory"
      subtitle="Real-time portfolio holdings breakdown, quantity positions, investment holder assignment, and unrealized gains."
      badge={<Badge variant="primary" icon={<TableIcon className="w-3.5 h-3.5" />}>{holdings.length} Assets</Badge>}
      actions={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<FileUp className="w-3.5 h-3.5" />}
          onClick={() => setActiveTab('import')}
        >
          Import Statement
        </Button>
      }
    >
      {/* Portfolio Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" padding="md" className="border-l-4 border-l-sky-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invested Cost</span>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">
            ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Cost basis of current holdings</span>
        </Card>

        <Card variant="glass" padding="md" className="border-l-4 border-l-indigo-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Market Value</span>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">
            ₹{totalMarket.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Live valuation of current holdings</span>
        </Card>

        <Card variant="glass" padding="md" className={`border-l-4 ${isOverallGain ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Unrealized Gain / Loss</span>
          <div className={`text-2xl font-black font-mono mt-1 flex items-center gap-2 ${isOverallGain ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isOverallGain ? <TrendingUp className="w-5 h-5 shrink-0" /> : <TrendingDown className="w-5 h-5 shrink-0" />}
            <span>{isOverallGain ? '+' : ''}₹{Math.abs(totalGain).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className={`text-[11px] font-bold font-mono mt-1 inline-block px-2 py-0.5 rounded-full ${isOverallGain ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
            {isOverallGain ? '+' : ''}{totalGainPercent.toFixed(2)}% Overall Return
          </span>
        </Card>
      </div>

      {/* Family Member Filter Chips */}
      {familyMembers.length > 0 && (
        <Card variant="glass" padding="sm" className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-bold text-[#9CA3AF] flex items-center gap-1.5 mr-1 flex-shrink-0">
            <Users className="w-4 h-4 text-[#4F7FFF]" /> Filter Member:
          </span>
          <button
            onClick={() => setSelectedMemberFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedMemberFilter === 'ALL'
                ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                : 'bg-[#15161A] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
            }`}
          >
            All Members ({holdings.length})
          </button>
          {familyMembers.map((m) => {
            const count = holdings.filter(h => h.familyMemberId === m.id).length;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMemberFilter(m.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  selectedMemberFilter === m.id
                    ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                    : 'bg-[#15161A] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
                }`}
              >
                <User className="w-3 h-3" />
                {m.name} ({count})
              </button>
            );
          })}
        </Card>
      )}

      {/* Holdings Table Container */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <HoldingTable
          data={filteredHoldings}
          loading={loading}
          error={error}
          familyMembers={familyMembers}
          onReassignOwner={handleReassignOwner}
        />
      </Card>
    </PageShell>
  );
};
