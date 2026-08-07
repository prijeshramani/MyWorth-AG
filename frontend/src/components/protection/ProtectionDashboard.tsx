import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useProtectionSummary } from '../../hooks/useProtectionSummary';
import { apiClient } from '../../services/apiClient';
import { insuranceService } from '../../services/insuranceService';
import { PageSkeleton } from '../common/PageSkeleton';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { HoldingTable, type HoldingRow } from '../ui/HoldingTable';
import { InsightCard } from '../ui/InsightCard';
import { Timeline, type TimelineEvent } from '../ui/Timeline';
import { 
  ShieldCheck, 
  HeartPulse, 
  ShieldAlert, 
  Award, 
  UserCheck, 
  Plus, 
  Search, 
  X, 
  Calendar, 
  DollarSign, 
  Building2, 
  User, 
  Layers, 
  Grid, 
  List as ListIcon,
  CheckCircle2,
  FileUp,
  FileText
} from 'lucide-react';

const mockTimelineEvents: TimelineEvent[] = [
  { id: '1', title: 'Premium Due — Max Life Term Insurance', timestamp: 'Due in 15 days', amount: '₹15,000.00', type: 'VALUATION' },
  { id: '2', title: 'Health Policy Renewal — Star Health', timestamp: 'Due in 45 days', amount: '₹22,500.00', type: 'VALUATION' }
];

interface MatrixMember {
  id: number;
  name: string;
  relationship: string;
  lifeCover: string;
  healthCover: string;
  status: string;
  statusColor: 'emerald' | 'sky' | 'amber';
}

const DEMO_MATRIX_MEMBERS: MatrixMember[] = [
  { id: 1, name: 'Rajesh Sharma', relationship: 'Primary Earner', lifeCover: '₹1,00,00,000', healthCover: '₹35,00,000', status: 'OPTIMAL', statusColor: 'emerald' },
  { id: 2, name: 'Priya Sharma', relationship: 'Spouse', lifeCover: '₹50,00,000', healthCover: '₹35,00,000 (Floater)', status: 'MODERATE', statusColor: 'sky' }
];

const INSURERS = [
  'Max Life Insurance',
  'HDFC Life Insurance',
  'Life Insurance Corporation of India (LIC)',
  'Star Health & Allied Insurance',
  'ICICI Prudential Life Insurance',
  'Tata AIA Life Insurance',
  'SBI Life Insurance',
  'Niva Bupa Health Insurance',
  'Care Health Insurance',
  'Bajaj Allianz General Insurance',
  'Aditya Birla Sun Life Insurance'
];

export const ProtectionDashboard: React.FC = () => {
  const { activeFamilyId, datasetMode } = useUiStore();
  const { data: response, isLoading, refetch } = useProtectionSummary(activeFamilyId);
  const [familyMembers, setFamilyMembers] = useState<MatrixMember[]>([]);
  const [rawMembers, setRawMembers] = useState<Array<{ id: number; name: string }>>([]);
  
  // Filter & view states
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Policy Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [policyType, setPolicyType] = useState('TERM_INSURANCE');
  const [insurerName, setInsurerName] = useState('Max Life Insurance');
  const [customInsurer, setCustomInsurer] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyHolderId, setPolicyHolderId] = useState<number>(1);
  const [sumAssured, setSumAssured] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [premiumFrequency, setPremiumFrequency] = useState('ANNUAL');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('SPOUSE');

  useEffect(() => {
    apiClient.get<any>(`/v1/family-members?familyId=${activeFamilyId}`)
      .then(res => {
        const body: any = res.data;
        const raw = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        setRawMembers(raw.map((m: any) => ({ id: m.id, name: m.name })));
        if (raw.length > 0) setPolicyHolderId(raw[0].id);

        const mapped: MatrixMember[] = raw.map((m: any) => ({
          id: m.id,
          name: m.name,
          relationship: m.relationship || 'Family Member',
          lifeCover: m.lifeCover ? `₹${Number(m.lifeCover).toLocaleString('en-IN')}` : '₹0.00',
          healthCover: m.healthCover ? `₹${Number(m.healthCover).toLocaleString('en-IN')}` : '₹0.00',
          status: m.lifeCover || m.healthCover ? 'OPTIMAL' : 'PENDING_REVIEW',
          statusColor: m.lifeCover || m.healthCover ? 'emerald' : 'amber'
        }));
        if (mapped.length > 0) setFamilyMembers(mapped);
        else if (datasetMode === 'DEMO') setFamilyMembers(DEMO_MATRIX_MEMBERS);
      })
      .catch(() => {
        if (datasetMode === 'DEMO') setFamilyMembers(DEMO_MATRIX_MEMBERS);
      });
  }, [datasetMode, activeFamilyId]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  const protectionData = response?.data;
  const policiesList = protectionData?.policies || [];

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyNumber || !sumAssured || !premiumAmount) return;

    setSubmitting(true);
    try {
      await insuranceService.createPolicy({
        familyId: activeFamilyId,
        policyNumber,
        insurerName: insurerName === 'OTHER' ? customInsurer : insurerName,
        policyType,
        policyHolderId,
        sumAssured: Number(sumAssured),
        premiumAmount: Number(premiumAmount),
        premiumFrequency,
        nextPremiumDueDate: nextDueDate || new Date().toISOString().split('T')[0],
        nomineeName,
        nomineeRelationship
      });

      setShowAddModal(false);
      setPolicyNumber('');
      setSumAssured('');
      setPremiumAmount('');
      setNomineeName('');
      refetch();
    } catch (err: any) {
      alert(`Failed to add policy: ${err.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPolicies = policiesList.filter(p => {
    const matchesSearch = p.insurerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.holderName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (categoryFilter === 'LIFE') {
      return ['TERM_INSURANCE', 'LIC_ENDOWMENT', 'LIC_MONEY_BACK', 'ULIP'].includes(p.policyType);
    }
    if (categoryFilter === 'HEALTH') {
      return ['HEALTH_INSURANCE', 'FAMILY_FLOATER', 'CRITICAL_ILLNESS'].includes(p.policyType);
    }
    if (categoryFilter === 'LIC') {
      return p.policyType.startsWith('LIC') || p.insurerName.includes('LIC');
    }
    return true;
  });

  const holdingRows: HoldingRow[] = filteredPolicies.map((p) => ({
    holdingId: p.policyId,
    assetName: `${p.insurerName} (${p.policyNumber})`,
    symbol: p.policyType,
    assetType: p.policyType,
    quantity: 1,
    unitPrice: p.sumAssured,
    formattedMarketValue: p.formattedSumAssured,
    unrealizedGainPercent: 0
  }));

  const timelineEvents = datasetMode === 'DEMO' ? mockTimelineEvents : [];

  return (
    <PageShell
      title="Insurance Management System"
      subtitle="Comprehensive governance of life cover, health insurance, LIC policies, ULIPs, and family risk protection."
      badge={<Badge variant="primary" icon={<ShieldCheck className="w-3.5 h-3.5" />}>Rating: {protectionData?.protectionRating || 'OPTIMAL'}</Badge>}
      actions={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add Insurance Policy
        </Button>
      }
    >
      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Protection Score"
          value={`${protectionData ? protectionData.protectionScore : 85} / 100`}
          subtitle="Family Risk Shield"
          trend={{ value: protectionData ? protectionData.protectionRating : 'OPTIMAL', direction: 'up' }}
          icon={<ShieldCheck className="w-5 h-5 text-[#32D583]" />}
        />

        <StatCard
          title="Total Life Cover"
          value={protectionData ? protectionData.lifeCover.formattedTotalSumAssured : '₹1.50 Cr'}
          subtitle={`Target: ${protectionData ? protectionData.lifeCover.formattedTargetCoverage : '₹2.50 Cr'}`}
          trend={{ value: 'ACTIVE', direction: 'neutral' }}
          icon={<Award className="w-5 h-5 text-[#4F7FFF]" />}
        />

        <StatCard
          title="Total Health Cover"
          value={protectionData ? protectionData.healthCover.formattedTotalSumAssured : '₹35.00 L'}
          subtitle="Family Floater & Critical Illness"
          trend={{ value: 'ACTIVE', direction: 'neutral' }}
          icon={<HeartPulse className="w-5 h-5 text-[#38BDF8]" />}
        />
      </div>

      {/* 2. Insights & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          type={policiesList.length > 0 ? 'INFO' : 'WARNING'}
          title="Nominee Verification Status"
          message={policiesList.length > 0 ? 'Active insurance policies have designated primary nominees.' : 'No insurance policies recorded yet. Click Add Insurance Policy above.'}
        />
        <InsightCard
          type="WARNING"
          title="Life Cover Gap Assessment"
          message={protectionData && protectionData.lifeCover.totalSumAssured > 0 ? `Current life sum assured is ${protectionData.lifeCover.coverageGapPercent}% of recommended target.` : 'Evaluate family term cover options to protect dependents.'}
        />
      </div>

      {/* 3. Controls & Filter Bar */}
      <Card variant="glass" padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'ALL', label: `All Policies (${policiesList.length})` },
            { id: 'LIFE', label: 'Life / Term' },
            { id: 'HEALTH', label: 'Health / Medical' },
            { id: 'LIC', label: 'LIC & Savings' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-[#4F7FFF] text-white shadow-md shadow-[#4F7FFF]/20'
                  : 'bg-[#15161A] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2B2E35]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search policy number or insurer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#15161A] border border-[#2B2E35] rounded-xl pl-8 pr-3 py-1 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
            />
          </div>

          <div className="flex items-center bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-[#4F7FFF] text-white' : 'text-[#9CA3AF]'}`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'cards' ? 'bg-[#4F7FFF] text-white' : 'text-[#9CA3AF]'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Active Insurance Policies (Table or Cards View) */}
      {viewMode === 'table' ? (
        <Card variant="default" padding="none" className="overflow-hidden">
          <HoldingTable data={holdingRows} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((p) => (
            <Card key={p.policyId} variant="default" className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-[#F3F4F6]">{p.insurerName}</h4>
                  <span className="text-[10px] font-mono text-[#4F7FFF] uppercase font-semibold">{p.policyType} • #{p.policyNumber}</span>
                </div>
                <Badge variant="success" size="sm">{p.status}</Badge>
              </div>

              <div className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Policy Holder:</span>
                  <span className="text-[#F3F4F6] font-bold">{p.holderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Sum Assured:</span>
                  <span className="text-emerald-700 dark:text-[#32D583] font-bold">{p.formattedSumAssured}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Premium:</span>
                  <span className="text-amber-700 dark:text-[#F79009] font-bold">{p.formattedPremiumAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Next Due:</span>
                  <span className="text-sky-700 dark:text-[#38BDF8] font-bold">{p.nextPremiumDueDate}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 5. Family Protection Heat Map Matrix */}
      <Card variant="glass" className="space-y-4">
        <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#F79009]" />
          Family Member Protection Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2B2E35] text-[#9CA3AF] font-mono">
                <th className="pb-3 px-2">Family Member</th>
                <th className="pb-3 px-2">Role</th>
                <th className="pb-3 px-2">Life Cover</th>
                <th className="pb-3 px-2">Health Cover</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2E35]/50">
              {familyMembers.map((member) => (
                <tr key={member.id}>
                  <td className="py-3 px-2 font-semibold text-[#F3F4F6]">{member.name}</td>
                  <td className="py-3 px-2 text-[#9CA3AF]">{member.relationship}</td>
                  <td className="py-3 px-2 font-mono text-emerald-700 dark:text-[#32D583] font-bold">{member.lifeCover}</td>
                  <td className="py-3 px-2 font-mono text-sky-700 dark:text-[#38BDF8] font-bold">{member.healthCover}</td>
                  <td className="py-3 px-2">
                    <Badge variant={member.statusColor === 'emerald' ? 'success' : 'warning'} size="sm">
                      {member.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add Insurance Policy */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreatePolicy} className="bg-[#15161A] border border-[#2B2E35] rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2B2E35] pb-3">
              <h3 className="text-base font-bold text-[#F3F4F6] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4F7FFF]" />
                Register Insurance Policy
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 text-[#9CA3AF] hover:text-[#F3F4F6]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Policy Type</label>
                <select
                  value={policyType}
                  onChange={e => setPolicyType(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  <option value="TERM_INSURANCE">Term Life Insurance</option>
                  <option value="HEALTH_INSURANCE">Health Insurance</option>
                  <option value="FAMILY_FLOATER">Family Floater Health</option>
                  <option value="LIC_ENDOWMENT">LIC Endowment Policy</option>
                  <option value="LIC_MONEY_BACK">LIC Money Back</option>
                  <option value="ULIP">ULIP Investment-Linked</option>
                  <option value="CRITICAL_ILLNESS">Critical Illness Cover</option>
                  <option value="ACCIDENT">Personal Accident Cover</option>
                  <option value="OTHER">Other / Vehicle / Home</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Insurer Name</label>
                <select
                  value={insurerName}
                  onChange={e => setInsurerName(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  {INSURERS.map(ins => (
                    <option key={ins} value={ins}>{ins}</option>
                  ))}
                  <option value="OTHER">Other Insurer (Specify Below)</option>
                </select>
              </div>
            </div>

            {insurerName === 'OTHER' && (
              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Custom Insurer Name</label>
                <input
                  type="text"
                  required
                  value={customInsurer}
                  onChange={e => setCustomInsurer(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. Royal Sundaram"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Policy Number</label>
                <input
                  type="text"
                  required
                  value={policyNumber}
                  onChange={e => setPolicyNumber(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. POL-984210"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Policy Holder</label>
                <select
                  value={policyHolderId}
                  onChange={e => setPolicyHolderId(Number(e.target.value))}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  {rawMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Sum Assured / Cover (₹)</label>
                <input
                  type="number"
                  required
                  value={sumAssured}
                  onChange={e => setSumAssured(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. 10000000"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Premium Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={premiumAmount}
                  onChange={e => setPremiumAmount(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. 18500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Premium Frequency</label>
                <select
                  value={premiumFrequency}
                  onChange={e => setPremiumFrequency(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  <option value="ANNUAL">Annual</option>
                  <option value="SEMI_ANNUAL">Semi-Annual</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Next Due Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={e => setNextDueDate(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Nominee Name</label>
                <input
                  type="text"
                  value={nomineeName}
                  onChange={e => setNomineeName(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1 font-medium">Nominee Relationship</label>
                <input
                  type="text"
                  value={nomineeRelationship}
                  onChange={e => setNomineeRelationship(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. SPOUSE"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#2B2E35]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                Save Policy
              </Button>
            </div>
          </form>
        </div>
      )}
    </PageShell>
  );
};
