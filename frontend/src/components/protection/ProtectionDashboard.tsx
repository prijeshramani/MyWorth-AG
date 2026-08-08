import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useProtectionSummary } from '../../hooks/useProtectionSummary';
import { apiClient } from '../../services/apiClient';
import { insuranceService, type PolicyDTO } from '../../services/insuranceService';
import { PageSkeleton } from '../common/PageSkeleton';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { InsightCard } from '../ui/InsightCard';
import { 
  ShieldCheck, 
  HeartPulse, 
  ShieldAlert, 
  Award, 
  Plus, 
  Search, 
  X, 
  Pencil,
  Grid, 
  List as ListIcon,
  Trash2,
  Users,
  User
} from 'lucide-react';

interface MatrixMember {
  id: number;
  name: string;
  relationship: string;
  lifeCover: string;
  healthCover: string;
  healthFloater: boolean;
  status: string;
  statusColor: 'emerald' | 'sky' | 'amber';
}

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

const LIFE_TYPES = ['TERM_INSURANCE', 'LIC_ENDOWMENT', 'LIC_MONEY_BACK', 'LIC_PENSION', 'LIC_CHILD', 'ULIP'];
const HEALTH_TYPES = ['HEALTH_INSURANCE', 'FAMILY_HEALTH_INSURANCE', 'FAMILY_FLOATER', 'CRITICAL_ILLNESS'];

// ─── Blank form state factory ───────────────────────────────────────────────
const blankForm = () => ({
  policyType: 'TERM_INSURANCE',
  insurerName: 'Max Life Insurance',
  customInsurer: '',
  policyNumber: '',
  policyHolderId: 0,
  coveredMemberIds: [] as number[],
  sumAssured: '',
  premiumAmount: '',
  premiumFrequency: 'ANNUAL',
  nextDueDate: '',
  nomineeName: '',
  nomineeRelationship: 'SPOUSE',
});

type FormState = ReturnType<typeof blankForm>;

export const ProtectionDashboard: React.FC = () => {
  const { activeFamilyId, datasetMode } = useUiStore();
  const { data: response, isLoading, refetch } = useProtectionSummary(activeFamilyId);
  const [familyMembers, setFamilyMembers] = useState<MatrixMember[]>([]);
  const [rawMembers, setRawMembers] = useState<Array<{ id: number; name: string; relationship?: string }>>([]);

  // Filter & view states
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState<FormState>(blankForm());

  const protectionData = response?.data;
  const policiesList: PolicyDTO[] = protectionData?.policies || [];
  const isFloaterType = form.policyType === 'FAMILY_HEALTH_INSURANCE';

  // Fetch Family Members
  useEffect(() => {
    apiClient.get<any>(`/v1/family-members?familyId=${activeFamilyId}`)
      .then(res => {
        const body: any = res.data;
        const raw = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        setRawMembers(raw.map((m: any) => ({ id: m.id, name: m.name, relationship: m.relationship })));
        setForm(prev => ({ ...prev, policyHolderId: raw[0]?.id || 0, coveredMemberIds: raw.map((m: any) => m.id) }));
      })
      .catch(() => {});
  }, [activeFamilyId]);

  // Compute Family Protection Matrix — floater policies contribute to each covered member
  useEffect(() => {
    if (rawMembers.length > 0) {
      const floaterPolicies = policiesList.filter(p => p.isFamilyFloater);
      const floaterHealthSum = floaterPolicies.reduce((s, p) => s + p.sumAssured, 0);

      const mapped: MatrixMember[] = rawMembers.map((m) => {
        const memberPolicies = policiesList.filter(
          p => !p.isFamilyFloater && (
            p.holderName?.toLowerCase() === m.name.toLowerCase() ||
            p.policyNumber.includes(m.name)
          )
        );

        const totalLife = memberPolicies
          .filter(p => LIFE_TYPES.includes(p.policyType))
          .reduce((sum, p) => sum + (p.sumAssured || 0), 0);

        const totalIndividualHealth = memberPolicies
          .filter(p => HEALTH_TYPES.includes(p.policyType))
          .reduce((sum, p) => sum + (p.sumAssured || 0), 0);

        // For floater policies: check if this member is in covered list (or if coveredMemberIds empty = all)
        const floaterContribution = floaterPolicies.reduce((sum, fp) => {
          const ids = fp.coveredMemberIds || [];
          const covers = ids.length === 0 || ids.includes(m.id);
          return covers ? sum + fp.sumAssured : sum;
        }, 0);

        const effectiveHealth = totalIndividualHealth + floaterContribution;
        const hasFloater = floaterContribution > 0;

        const fallbackLife = (rawMembers.length === 1 && totalLife === 0) ? protectionData?.lifeCover.totalSumAssured || 0 : totalLife;
        const effectiveLife = totalLife || fallbackLife;
        const hasCover = effectiveLife > 0 || effectiveHealth > 0;

        return {
          id: m.id,
          name: m.name,
          relationship: m.relationship || 'Family Member',
          lifeCover: effectiveLife > 0 ? `₹${effectiveLife.toLocaleString('en-IN')}` : '₹0.00',
          healthCover: effectiveHealth > 0 ? `₹${effectiveHealth.toLocaleString('en-IN')}` : '₹0.00',
          healthFloater: hasFloater,
          status: hasCover ? 'OPTIMAL' : 'PENDING_REVIEW',
          statusColor: hasCover ? 'emerald' : 'amber'
        };
      });
      setFamilyMembers(mapped);
    } else if (datasetMode === 'DEMO') {
      setFamilyMembers([
        { id: 1, name: 'Demo Member', relationship: 'Primary', lifeCover: '₹1,00,00,000', healthCover: '₹35,00,000', healthFloater: true, status: 'OPTIMAL', statusColor: 'emerald' }
      ]);
    } else {
      setFamilyMembers([]);
    }
  }, [rawMembers, policiesList, datasetMode, protectionData]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  // ─── Open Add Modal ──────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingPolicyId(null);
    setForm({
      ...blankForm(),
      policyHolderId: rawMembers[0]?.id || 0,
      coveredMemberIds: rawMembers.map(m => m.id)
    });
    setShowModal(true);
  };

  // ─── Open Edit Modal ─────────────────────────────────────────────────────
  const openEditModal = (p: PolicyDTO) => {
    setEditingPolicyId(p.policyId);
    setForm({
      policyType: p.policyType,
      insurerName: INSURERS.includes(p.insurerName) ? p.insurerName : 'OTHER',
      customInsurer: INSURERS.includes(p.insurerName) ? '' : p.insurerName,
      policyNumber: p.policyNumber,
      policyHolderId: rawMembers.find(m => m.name === p.holderName)?.id || rawMembers[0]?.id || 0,
      coveredMemberIds: p.coveredMemberIds?.length ? p.coveredMemberIds : rawMembers.map(m => m.id),
      sumAssured: String(p.sumAssured),
      premiumAmount: String(p.premiumAmount),
      premiumFrequency: 'ANNUAL',
      nextDueDate: p.nextPremiumDueDate || '',
      nomineeName: p.nomineeName || '',
      nomineeRelationship: 'SPOUSE',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPolicyId(null);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleCoveredMember = (id: number) => {
    setForm(prev => ({
      ...prev,
      coveredMemberIds: prev.coveredMemberIds.includes(id)
        ? prev.coveredMemberIds.filter(x => x !== id)
        : [...prev.coveredMemberIds, id]
    }));
  };

  // ─── Submit (Create or Edit) ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.policyNumber || !form.sumAssured || !form.premiumAmount) return;

    const payload = {
      familyId: activeFamilyId,
      policyNumber: form.policyNumber,
      insurerName: form.insurerName === 'OTHER' ? form.customInsurer : form.insurerName,
      policyType: form.policyType,
      policyHolderId: isFloaterType ? (rawMembers[0]?.id || 1) : form.policyHolderId,
      isFamilyFloater: isFloaterType,
      coveredMemberIds: isFloaterType ? form.coveredMemberIds : [],
      sumAssured: Number(form.sumAssured),
      premiumAmount: Number(form.premiumAmount),
      premiumFrequency: form.premiumFrequency,
      nextPremiumDueDate: form.nextDueDate || new Date().toISOString().split('T')[0],
      nomineeName: form.nomineeName,
      nomineeRelationship: form.nomineeRelationship,
    };

    setSubmitting(true);
    try {
      if (editingPolicyId !== null) {
        await insuranceService.updatePolicy(editingPolicyId, payload);
      } else {
        await insuranceService.createPolicy(payload);
      }
      closeModal();
      refetch();
    } catch (err: any) {
      alert(`Failed to ${editingPolicyId ? 'update' : 'add'} policy: ${err.message || 'Server error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePolicy = async (policyId: number, policyNum: string) => {
    if (!window.confirm(`Delete policy #${policyNum}?`)) return;
    try {
      setDeletingId(policyId);
      await insuranceService.deletePolicy(policyId);
      await refetch();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message || 'Server error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPolicies = policiesList.filter(p => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = (p.insurerName || '').toLowerCase().includes(q) ||
                          (p.policyNumber || '').toLowerCase().includes(q) ||
                          (p.holderName || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (categoryFilter === 'LIFE') return LIFE_TYPES.includes(p.policyType);
    if (categoryFilter === 'HEALTH') return HEALTH_TYPES.includes(p.policyType);
    if (categoryFilter === 'LIC') return p.policyType.startsWith('LIC') || p.insurerName.includes('LIC');
    return true;
  });

  // ─── Policy type label helper ────────────────────────────────────────────
  const policyTypeLabel = (type: string) => {
    const MAP: Record<string, string> = {
      TERM_INSURANCE: 'Term Life',
      HEALTH_INSURANCE: 'Health',
      FAMILY_HEALTH_INSURANCE: 'Family Floater',
      FAMILY_FLOATER: 'Family Floater',
      CRITICAL_ILLNESS: 'Critical Illness',
      LIC_ENDOWMENT: 'LIC Endowment',
      LIC_MONEY_BACK: 'LIC Money Back',
      LIC_PENSION: 'LIC Pension',
      LIC_CHILD: 'LIC Child',
      ULIP: 'ULIP',
      ACCIDENT: 'Accident Cover',
      OTHER: 'Other',
    };
    return MAP[type] || type;
  };

  // ─── Action buttons shared between table and card view ───────────────────
  const ActionButtons = ({ p }: { p: PolicyDTO }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => openEditModal(p)}
        className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-950/40 hover:text-sky-400 transition"
        title="Edit Policy"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDeletePolicy(p.policyId, p.policyNumber)}
        disabled={deletingId === p.policyId}
        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-950/40 hover:text-rose-400 transition disabled:opacity-40"
        title="Delete Policy"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

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
          onClick={openAddModal}
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
          value={protectionData ? protectionData.lifeCover.formattedTotalSumAssured : '₹0.00'}
          subtitle={`Target: ${protectionData ? protectionData.lifeCover.formattedTargetCoverage : '₹2.50 Cr'}`}
          trend={{ value: 'ACTIVE', direction: 'neutral' }}
          icon={<Award className="w-5 h-5 text-[#4F7FFF]" />}
        />
        <StatCard
          title="Total Health Cover"
          value={protectionData ? protectionData.healthCover.formattedTotalSumAssured : '₹0.00'}
          subtitle="Individual + Family Floater Policies"
          trend={{ value: 'ACTIVE', direction: 'neutral' }}
          icon={<HeartPulse className="w-5 h-5 text-[#38BDF8]" />}
        />
      </div>

      {/* 2. Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          type={policiesList.length > 0 ? 'INFO' : 'WARNING'}
          title="Nominee Verification Status"
          message={policiesList.length > 0 ? 'Active insurance policies recorded for household.' : 'No insurance policies recorded yet. Click Add Insurance Policy above.'}
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
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-[#4F7FFF] text-white' : 'text-[#9CA3AF]'}`}>
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-lg transition ${viewMode === 'cards' ? 'bg-[#4F7FFF] text-white' : 'text-[#9CA3AF]'}`}>
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Active Policies */}
      {filteredPolicies.length === 0 ? (
        <Card variant="glass" className="p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-[#F3F4F6]">No Insurance Policies Found</h4>
          <p className="text-xs text-[#9CA3AF]">Click "Add Insurance Policy" to record your term life or health insurance policy.</p>
          <Button variant="primary" size="sm" onClick={openAddModal} leftIcon={<Plus className="w-4 h-4" />}>
            Add Insurance Policy
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        <Card variant="default" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F3F4F6]">
              <thead className="bg-[#15161A] text-[#9CA3AF] border-b border-[#2B2E35] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Insurer & Policy #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Covered</th>
                  <th className="py-3 px-4 text-right">Sum Insured</th>
                  <th className="py-3 px-4 text-right">Premium</th>
                  <th className="py-3 px-4 text-center">Next Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2E35]">
                {filteredPolicies.map((p) => (
                  <tr key={p.policyId} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#F3F4F6]">
                      {p.insurerName}
                      <span className="block text-[10px] text-[#4F7FFF] font-mono">#{p.policyNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#4F7FFF]/15 text-[#4F7FFF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {policyTypeLabel(p.policyType)}
                        </span>
                        {p.isFamilyFloater && (
                          <span className="bg-teal-500/15 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                            Floater
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#9CA3AF] font-medium">
                      {p.isFamilyFloater ? (
                        <span className="flex items-center gap-1 text-teal-400">
                          <Users className="w-3 h-3" /> All Members
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {p.holderName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-[#32D583]">
                      {p.formattedSumAssured}
                      {p.isFamilyFloater && <span className="block text-[10px] text-[#9CA3AF] font-normal">Shared Limit</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-[#F79009]">
                      {p.formattedPremiumAmount}
                      {p.isFamilyFloater && <span className="block text-[10px] text-[#9CA3AF] font-normal">Combined</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[#38BDF8]">
                      {p.nextPremiumDueDate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <ActionButtons p={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((p) => (
            <Card key={p.policyId} variant="default" className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-[#F3F4F6]">{p.insurerName}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-[#4F7FFF] uppercase font-semibold">{policyTypeLabel(p.policyType)} • #{p.policyNumber}</span>
                    {p.isFamilyFloater && (
                      <span className="bg-teal-500/15 text-teal-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-teal-500/30">Floater</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="success" size="sm">{p.status}</Badge>
                  <ActionButtons p={p} />
                </div>
              </div>

              <div className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">{p.isFamilyFloater ? 'Coverage:' : 'Policy Holder:'}</span>
                  <span className="text-[#F3F4F6] font-bold flex items-center gap-1">
                    {p.isFamilyFloater ? <><Users className="w-3 h-3 text-teal-400" /> All Members</> : p.holderName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">{p.isFamilyFloater ? 'Shared Sum Insured:' : 'Sum Assured:'}</span>
                  <span className="text-emerald-700 dark:text-[#32D583] font-bold">{p.formattedSumAssured}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">{p.isFamilyFloater ? 'Combined Premium:' : 'Premium:'}</span>
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

      {/* 5. Family Protection Matrix */}
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
              {familyMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 font-mono">
                    No family members recorded.
                  </td>
                </tr>
              ) : familyMembers.map((member) => (
                <tr key={member.id}>
                  <td className="py-3 px-2 font-semibold text-[#F3F4F6]">{member.name}</td>
                  <td className="py-3 px-2 text-[#9CA3AF]">{member.relationship}</td>
                  <td className="py-3 px-2 font-mono text-emerald-700 dark:text-[#32D583] font-bold">{member.lifeCover}</td>
                  <td className="py-3 px-2 font-mono text-sky-700 dark:text-[#38BDF8] font-bold">
                    {member.healthCover}
                    {member.healthFloater && (
                      <span className="ml-1 text-[10px] text-teal-400 font-normal">(Floater)</span>
                    )}
                  </td>
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

      {/* ─── Add / Edit Policy Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#15161A] border border-slate-200 dark:border-[#2B2E35] rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2B2E35] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F3F4F6] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4F7FFF]" />
                {editingPolicyId ? 'Edit Insurance Policy' : 'Register Insurance Policy'}
              </h3>
              <button type="button" onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-700 dark:text-[#9CA3AF] dark:hover:text-[#F3F4F6]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Policy Type + Insurer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Policy Type</label>
                <select
                  value={form.policyType}
                  onChange={e => setField('policyType', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  <option value="TERM_INSURANCE">Term Life Insurance</option>
                  <option value="HEALTH_INSURANCE">Health Insurance (Individual)</option>
                  <option value="FAMILY_HEALTH_INSURANCE">Family Health Insurance (Floater)</option>
                  <option value="CRITICAL_ILLNESS">Critical Illness Cover</option>
                  <option value="LIC_ENDOWMENT">LIC Endowment Policy</option>
                  <option value="LIC_MONEY_BACK">LIC Money Back</option>
                  <option value="LIC_PENSION">LIC Pension Plan</option>
                  <option value="LIC_CHILD">LIC Child Plan</option>
                  <option value="ULIP">ULIP Investment-Linked</option>
                  <option value="ACCIDENT">Personal Accident Cover</option>
                  <option value="OTHER">Other / Vehicle / Home</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Insurer Name</label>
                <select
                  value={form.insurerName}
                  onChange={e => setField('insurerName', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  {INSURERS.map(ins => (
                    <option key={ins} value={ins}>{ins}</option>
                  ))}
                  <option value="OTHER">Other Insurer (Specify Below)</option>
                </select>
              </div>
            </div>

            {form.insurerName === 'OTHER' && (
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Custom Insurer Name</label>
                <input
                  type="text"
                  required
                  value={form.customInsurer}
                  onChange={e => setField('customInsurer', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. Royal Sundaram"
                />
              </div>
            )}

            {/* Floater banner */}
            {isFloaterType && (
              <div className="flex items-start gap-2 p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-700/40 rounded-xl">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-teal-700 dark:text-teal-300">Family Health Insurance (Floater)</p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400/80 mt-0.5">
                    The shared sum insured applies collectively to all selected members. Select which family members are covered below.
                  </p>
                </div>
              </div>
            )}

            {/* Policy Number */}
            <div>
              <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Policy Number</label>
              <input
                type="text"
                required
                value={form.policyNumber}
                onChange={e => setField('policyNumber', e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
                placeholder="e.g. POL-984210"
              />
            </div>

            {/* Holder (individual) OR Covered Members (floater) */}
            {isFloaterType ? (
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-2 font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-500" />
                  Covered Family Members <span className="text-teal-600 dark:text-teal-500">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {rawMembers.map(m => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        form.coveredMemberIds.includes(m.id)
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-400 dark:border-teal-600/60 text-teal-700 dark:text-teal-300'
                          : 'bg-slate-50 dark:bg-[#0B0B0C] border-slate-200 dark:border-[#2B2E35] text-slate-500 dark:text-[#9CA3AF]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.coveredMemberIds.includes(m.id)}
                        onChange={() => toggleCoveredMember(m.id)}
                        className="accent-teal-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium">{m.name}</span>
                    </label>
                  ))}
                </div>
                {form.coveredMemberIds.length === 0 && (
                  <p className="text-[11px] text-rose-500 mt-1.5">⚠ Please select at least one covered member.</p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Policy Holder</label>
                <select
                  value={form.policyHolderId}
                  onChange={e => setField('policyHolderId', Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  {rawMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sum Assured + Premium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">
                  {isFloaterType ? 'Shared Sum Insured / Floater Limit (₹)' : 'Sum Assured / Cover (₹)'}
                </label>
                <input
                  type="number"
                  required
                  value={form.sumAssured}
                  onChange={e => setField('sumAssured', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. 1000000"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">
                  {isFloaterType ? 'Combined Annual Premium (₹)' : 'Premium Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  value={form.premiumAmount}
                  onChange={e => setField('premiumAmount', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
                  placeholder="e.g. 18500"
                />
              </div>
            </div>

            {/* Premium Frequency + Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Premium Frequency</label>
                <select
                  value={form.premiumFrequency}
                  onChange={e => setField('premiumFrequency', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                >
                  <option value="ANNUAL">Annual</option>
                  <option value="SEMI_ANNUAL">Semi-Annual</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Next Due Date</label>
                <input
                  type="date"
                  value={form.nextDueDate}
                  onChange={e => setField('nextDueDate', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                />
              </div>
            </div>

            {/* Nominee (hidden for floater) */}
            {!isFloaterType && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Nominee Name</label>
                  <input
                    type="text"
                    value={form.nomineeName}
                    onChange={e => setField('nomineeName', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
                    placeholder="e.g. Priya Sharma"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-[#9CA3AF] block mb-1 font-medium">Nominee Relationship</label>
                  <input
                    type="text"
                    value={form.nomineeRelationship}
                    onChange={e => setField('nomineeRelationship', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B0B0C] border border-slate-200 dark:border-[#2B2E35] rounded-xl p-2.5 text-xs text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#4F7FFF]"
                    placeholder="e.g. SPOUSE"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#2B2E35]">
              <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                disabled={isFloaterType && form.coveredMemberIds.length === 0}
              >
                {editingPolicyId ? 'Update Policy' : 'Save Policy'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </PageShell>
  );
};
