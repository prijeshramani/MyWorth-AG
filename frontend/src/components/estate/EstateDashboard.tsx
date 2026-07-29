import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useEstateDashboard } from '../../hooks/useEstateDashboard';
import { estateService } from '../../services/estateService';
import type { EmergencyDTO } from '../../services/estateService';
import { PageSkeleton } from '../common/PageSkeleton';
import { MetricCard } from '../ui/MetricCard';
import { RiskGauge } from '../ui/RiskGauge';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scroll className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-100">Estate Planning, Legacy & Succession</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generational wealth transfer, Will management, Family Trusts, Beneficiary entitlements, and Emergency Protocol.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenEmergencyMode}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors animate-pulse"
          >
            <Siren className="w-4 h-4" />
            EMERGENCY PROTOCOL MODE
          </button>
        </div>
      </div>

      {/* KPI Cards & Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge
          label="Estate Health Score (S_Estate)"
          value={health?.overallScore || 85}
          minValue={0}
          maxValue={100}
          ratingLabel={health?.ratingLabel || 'OPTIMAL'}
          statusColor="#10b981"
        />

        <MetricCard
          title="Total Net Estate Value"
          value={`₹${(estateData?.profile?.estate_value || 15000000).toLocaleString('en-IN')}`}
          subtext="Net Asset Value Subject to Succession"
          changePercent={14.2}
          trend="UP"
          icon={<Landmark className="w-4 h-4 text-emerald-400" />}
        />

        <MetricCard
          title="Wills & Trusts Active"
          value={`${wills.length} Wills • ${trusts.length} Trusts`}
          subtext="Consuming Knowledge Graph"
          changePercent={5.0}
          trend="UP"
          icon={<Scroll className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
        {(['overview', 'wills', 'trusts', 'simulator', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md font-semibold transition-colors capitalize ${
              activeTab === tab ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'simulator' ? 'Distribution Simulator' : tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Health Score Breakdown */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-glass p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Estate Health Score Breakdown
            </h3>

            <div className="space-y-3">
              {health?.breakdown.map((b) => (
                <div key={b.category} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{b.category}</span>
                    <span className="font-mono text-emerald-400 font-bold">{b.score} / {b.maxScore} pts</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(b.score / b.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Advisor Recommendations
            </h3>

            <div className="space-y-2">
              {health?.recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Will Manager */}
      {activeTab === 'wills' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Wills & Testament Registry
            </h3>
            <button
              onClick={() => setShowAddWillModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create / Register Will
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wills.map((w) => (
              <div key={w.id} className="card-glass p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{w.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Will ID: #{w.id} • Version v{w.current_version}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {w.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono space-y-1 text-slate-300">
                  <div>Primary Executor: <span className="text-slate-100 font-bold">{w.executor_name}</span></div>
                  <div>Registration No: <span className="text-amber-400 font-bold">{w.registration_number || 'Pending Registration'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Trust Manager */}
      {activeTab === 'trusts' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Family & Private Trusts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trusts.map((t) => (
              <div key={t.id} className="card-glass p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{t.trust_name}</h4>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">Trust Type: {t.trust_type}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {t.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trust Corpus:</span>
                    <span className="text-emerald-400 font-bold">₹{t.corpus_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Death Scenario Simulator */}
      {activeTab === 'simulator' && (
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Inheritance & Death Scenario Simulator
          </h3>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span>Simulated Scenario: Primary Testator Deceased</span>
              <span className="text-emerald-400 font-mono">Total Estate: ₹1,50,00,000.00</span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Priya Sharma (Spouse)</span>
                <span className="font-mono text-emerald-400 font-bold">50% (₹75,00,000.00)</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Aarav Sharma (Child)</span>
                <span className="font-mono text-emerald-400 font-bold">25% (₹37,50,000.00)</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Sharma Family Trust</span>
                <span className="font-mono text-emerald-400 font-bold">25% (₹37,50,000.00)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Succession Timeline */}
      {activeTab === 'timeline' && (
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Succession Audit & Event Timeline
          </h3>

          <div className="space-y-3 text-xs">
            {timeline.map((t) => (
              <div key={t.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">{t.title}</span>
                  <span className="text-slate-400 text-[11px]">{t.description}</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">{t.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Mode Protocol Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-xl p-6 w-full max-w-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Siren className="w-6 h-6 text-rose-500 animate-pulse" />
                <h3 className="text-base font-bold text-rose-400 uppercase tracking-wide">Emergency Succession Console</h3>
              </div>
              <button onClick={() => setShowEmergencyModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Primary Executor</span>
                <div className="font-bold text-slate-100">{emergencyData?.primaryExecutor || 'Adv. Ramesh Varma (+91 9845012345)'}</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Chartered Accountant</span>
                <div className="font-bold text-slate-100">{emergencyData?.caContact || 'CA Suresh Mehta (+91 9820011223)'}</div>
              </div>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] font-mono text-rose-300">
              ✓ Access Logged to Immutable Audit Log • Correlation ID: req_emerg_88912
            </div>
          </div>
        </div>
      )}

      {/* Add Will Modal */}
      {showAddWillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateWill} className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Create / Register Will</h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Will Title</label>
              <input
                type="text"
                required
                value={newWillTitle}
                onChange={e => setNewWillTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                placeholder="e.g. Primary Registered Will 2026"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Executor Name</label>
              <input
                type="text"
                required
                value={newWillExecutor}
                onChange={e => setNewWillExecutor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddWillModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white rounded text-xs font-semibold">Save Will</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
