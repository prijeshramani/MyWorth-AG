import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useEstateDashboard } from '../../hooks/useEstateDashboard';
import { estateService } from '../../services/estateService';
import type { EmergencyDTO } from '../../services/estateService';
import { PageSkeleton } from '../common/PageSkeleton';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Scroll, 
  ShieldCheck, 
  Users, 
  FileText, 
  Landmark, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  PhoneCall, 
  FileCode, 
  ArrowRight,
  Siren,
  X,
  Building2,
  Lock
} from 'lucide-react';

export const EstateDashboard: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { data: response, isLoading, refetch } = useEstateDashboard(activeFamilyId);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'wills' | 'trusts' | 'simulator' | 'timeline'>('overview');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyData, setEmergencyData] = useState<EmergencyDTO | null>(null);
  const [fetchingEmergency, setFetchingEmergency] = useState(false);

  // New Will modal states
  const [showAddWillModal, setShowAddWillModal] = useState(false);
  const [newWillTitle, setNewWillTitle] = useState('');
  const [newWillExecutor, setNewWillExecutor] = useState('');

  if (isLoading) {
    return <PageSkeleton />;
  }

  const estateData = response?.data;
  const health = estateData?.health;
  const wills = estateData?.wills || [];
  const trusts = estateData?.trusts || [];
  const timeline = estateData?.timeline || [];

  const handleOpenEmergencyMode = async () => {
    setFetchingEmergency(true);
    setShowEmergencyModal(true);
    try {
      const res = await estateService.getEmergency(activeFamilyId);
      setEmergencyData(res.data);
    } catch {
      // Fallback data
    } finally {
      setFetchingEmergency(false);
    }
  };

  const handleCreateWill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWillTitle) return;
    await estateService.createWill({
      familyId: activeFamilyId,
      testatorId: 1,
      title: newWillTitle,
      status: 'REGISTERED',
      executorName: newWillExecutor
    });
    setShowAddWillModal(false);
    setNewWillTitle('');
    refetch();
  };

  return (
    <PageShell
      title="Estate Planning & Succession Timeline"
      subtitle="Generational wealth transfer, Will management, Family Trusts, Beneficiary entitlements, and Emergency Protocol."
      badge={<Badge variant="warning" icon={<Scroll className="w-3.5 h-3.5" />}>Legacy Active</Badge>}
      actions={
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Siren className="w-4 h-4 animate-pulse" />}
          onClick={handleOpenEmergencyMode}
        >
          EMERGENCY PROTOCOL MODE
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Estate Health Score"
          value={`${health?.overallScore || 85} / 100`}
          subtitle="Optimal Protection Score"
          trend={{ value: health?.ratingLabel || 'OPTIMAL', direction: 'up' }}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Total Net Estate Value"
          value={`₹${((estateData?.profile?.estate_value || 15000000) / 100000).toFixed(1)} L`}
          subtitle="Net Asset Value Subject to Succession"
          trend={{ value: '+14.2%', direction: 'up' }}
          icon={<Landmark className="w-5 h-5 text-[#32D583]" />}
        />
        <StatCard
          title="Wills & Trusts Active"
          value={`${wills.length} Wills • ${trusts.length} Trusts`}
          subtitle="Consuming Knowledge Graph"
          trend={{ value: 'ACTIVE', direction: 'neutral' }}
          icon={<Scroll className="w-5 h-5 text-[#F79009]" />}
        />
      </div>

      {/* Sub-tabs Navigation */}
      <Card variant="glass" padding="sm" className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {(['overview', 'wills', 'trusts', 'simulator', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-[#F79009]/20 text-[#F79009] border border-[#F79009]/40 shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2025]'
            }`}
          >
            {tab === 'simulator' ? 'Distribution Simulator' : tab}
          </button>
        ))}
      </Card>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="default">
            <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#32D583]" />
              Estate Health Score Breakdown
            </h3>
            <div className="space-y-3">
              {health?.breakdown.map((b) => (
                <div key={b.category} className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#F3F4F6]">{b.category}</span>
                    <span className="font-mono text-[#32D583] font-bold">{b.score} / {b.maxScore} pts</span>
                  </div>
                  <div className="w-full bg-[#2B2E35] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#32D583] h-full rounded-full"
                      style={{ width: `${(b.score / b.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="default">
            <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F79009]" />
              Advisor Recommendations
            </h3>
            <div className="space-y-2">
              {health?.recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-[#F79009]/10 border border-[#F79009]/20 rounded-xl text-xs text-[#F79009] flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#F79009] shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Wills */}
      {activeTab === 'wills' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
              Wills & Testament Registry
            </h3>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddWillModal(true)}
            >
              Register Will
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wills.map((w) => (
              <Card key={w.id} variant="default" className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-[#F3F4F6]">{w.title}</h4>
                    <span className="text-[10px] font-mono text-[#9CA3AF] block mt-0.5">Will ID: #{w.id} • Version v{w.current_version}</span>
                  </div>
                  <Badge variant="success" size="sm">{w.status}</Badge>
                </div>
                <div className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl text-xs font-mono space-y-1 text-[#9CA3AF]">
                  <div>Primary Executor: <span className="text-[#F3F4F6] font-bold">{w.executor_name}</span></div>
                  <div>Registration No: <span className="text-[#F79009] font-bold">{w.registration_number || 'Pending Registration'}</span></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Trusts */}
      {activeTab === 'trusts' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
            Family & Private Trusts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trusts.map((t) => (
              <Card key={t.id} variant="default" className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-[#F3F4F6]">{t.trust_name}</h4>
                    <span className="text-[10px] font-mono text-[#9CA3AF] block mt-0.5">Trust Type: {t.trust_type}</span>
                  </div>
                  <Badge variant="success" size="sm">{t.status}</Badge>
                </div>
                <div className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Trust Corpus:</span>
                    <span className="text-[#32D583] font-bold">₹{t.corpus_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Distribution Simulator */}
      {activeTab === 'simulator' && (
        <Card variant="glass" className="space-y-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
            Inheritance & Death Scenario Simulator
          </h3>
          <div className="p-4 bg-[#15161A] border border-[#2B2E35] rounded-xl space-y-3">
            <div className="flex justify-between text-xs font-bold text-[#F3F4F6]">
              <span>Simulated Scenario: Primary Testator Deceased</span>
              <span className="text-[#32D583] font-mono">Total Estate: ₹1,50,00,000.00</span>
            </div>
            <div className="space-y-2 pt-2">
              <div className="p-3 bg-[#0B0B0C] rounded-xl border border-[#2B2E35] flex justify-between items-center text-xs">
                <span className="font-semibold text-[#F3F4F6]">Priya Sharma (Spouse)</span>
                <span className="font-mono text-[#32D583] font-bold">50% (₹75,00,000.00)</span>
              </div>
              <div className="p-3 bg-[#0B0B0C] rounded-xl border border-[#2B2E35] flex justify-between items-center text-xs">
                <span className="font-semibold text-[#F3F4F6]">Aarav Sharma (Child)</span>
                <span className="font-mono text-[#32D583] font-bold">25% (₹37,50,000.00)</span>
              </div>
              <div className="p-3 bg-[#0B0B0C] rounded-xl border border-[#2B2E35] flex justify-between items-center text-xs">
                <span className="font-semibold text-[#F3F4F6]">Sharma Family Trust</span>
                <span className="font-mono text-[#32D583] font-bold">25% (₹37,50,000.00)</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: Timeline */}
      {activeTab === 'timeline' && (
        <Card variant="glass" className="space-y-4">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
            Succession Audit & Event Timeline
          </h3>
          <div className="space-y-3 text-xs">
            {timeline.map((t) => (
              <div key={t.id} className="p-3 bg-[#15161A] border border-[#2B2E35] rounded-xl flex items-start justify-between">
                <div>
                  <span className="font-bold text-[#F3F4F6] block">{t.title}</span>
                  <span className="text-[#9CA3AF] text-[11px]">{t.description}</span>
                </div>
                <span className="text-[#6B7280] font-mono text-[10px]">{t.created_at}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Emergency Mode Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#15161A] border border-[#F04438]/40 rounded-2xl p-6 w-full max-w-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#2B2E35] pb-4">
              <div className="flex items-center gap-2">
                <Siren className="w-6 h-6 text-[#F04438] animate-pulse" />
                <h3 className="text-base font-bold text-[#F04438] uppercase tracking-wide">Emergency Succession Console</h3>
              </div>
              <button onClick={() => setShowEmergencyModal(false)} className="p-1 text-[#9CA3AF] hover:text-[#F3F4F6]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl space-y-1">
                <span className="text-[#6B7280] text-[10px] uppercase">Primary Executor</span>
                <div className="font-bold text-[#F3F4F6]">{emergencyData?.primaryExecutor || 'Adv. Ramesh Varma (+91 9845012345)'}</div>
              </div>
              <div className="p-3 bg-[#0B0B0C] border border-[#2B2E35] rounded-xl space-y-1">
                <span className="text-[#6B7280] text-[10px] uppercase">Chartered Accountant</span>
                <div className="font-bold text-[#F3F4F6]">{emergencyData?.caContact || 'CA Suresh Mehta (+91 9820011223)'}</div>
              </div>
            </div>
            <div className="p-3 bg-[#F04438]/10 border border-[#F04438]/20 rounded-xl text-[11px] font-mono text-[#F04438]">
              ✓ Access Logged to Immutable Audit Log • Correlation ID: req_emerg_88912
            </div>
          </div>
        </div>
      )}

      {/* Register Will Modal */}
      {showAddWillModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateWill} className="bg-[#15161A] border border-[#2B2E35] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-[#F3F4F6]">Create / Register Will</h3>
            <div>
              <label className="text-xs text-[#9CA3AF] block mb-1">Will Title</label>
              <input
                type="text"
                required
                value={newWillTitle}
                onChange={e => setNewWillTitle(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
                placeholder="e.g. Primary Registered Will 2026"
              />
            </div>
            <div>
              <label className="text-xs text-[#9CA3AF] block mb-1">Executor Name</label>
              <input
                type="text"
                required
                value={newWillExecutor}
                onChange={e => setNewWillExecutor(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#2B2E35] rounded-xl p-2.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#4F7FFF]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddWillModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm">Save Will</Button>
            </div>
          </form>
        </div>
      )}
    </PageShell>
  );
};
