import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, FileUp, Users, User, Table as TableIcon } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';
import { HoldingTable, type HoldingRow } from '../ui/HoldingTable';
import { PageShell } from '../layout/PageShell';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

const DEMO_HOLDINGS: HoldingRow[] = [
  { holdingId: 1, assetName: 'Reliance Industries Ltd', symbol: 'RELIANCE', assetType: 'STOCK', quantity: 150, unitPrice: 2850, formattedMarketValue: '₹4,27,500.00', unrealizedGainPercent: 18.5, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 2, assetName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', assetType: 'STOCK', quantity: 200, unitPrice: 1620, formattedMarketValue: '₹3,24,000.00', unrealizedGainPercent: 8.2, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 3, assetName: 'Parag Parikh Flexi Cap Fund', symbol: 'PPFCF-GR', assetType: 'MUTUAL_FUND', quantity: 500, unitPrice: 75.4, formattedMarketValue: '₹3,77,000.00', unrealizedGainPercent: 24.6, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 4, assetName: 'SBI Bluechip Mutual Fund', symbol: 'SBIBLUE-GR', assetType: 'MUTUAL_FUND', quantity: 800, unitPrice: 82.1, formattedMarketValue: '₹6,56,800.00', unrealizedGainPercent: 12.4, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' },
  { holdingId: 5, assetName: 'Employee Provident Fund (EPF)', symbol: 'EPF-ACC', assetType: 'EPF', quantity: 1, unitPrice: 850000, formattedMarketValue: '₹8,50,000.00', unrealizedGainPercent: 8.25, familyMemberId: 1, familyMemberName: 'Rajesh Sharma', familyMemberRelationship: 'SELF' }
];

export const HoldingsView: React.FC = () => {
  const { datasetMode, setActiveTab } = useUiStore();
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
          const mapped: HoldingRow[] = raw.map((a: any) => ({
            holdingId: a.id,
            assetName: a.name,
            symbol: a.identifier || undefined,
            assetType: a.type || 'OTHER',
            quantity: a.currentUnits || 0,
            unitPrice: a.currentPrice || 0,
            formattedMarketValue: `₹${(a.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            unrealizedGainPercent: a.absoluteReturnPercent || 0,
            familyMemberId: a.familyMemberId,
            familyMemberName: a.familyMemberName,
            familyMemberRelationship: a.familyMemberRelationship
          }));
          setHoldings(mapped);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
    }
  };

  const fetchMembers = () => {
    apiClient.get<any>('/v1/family-members?familyId=1')
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
