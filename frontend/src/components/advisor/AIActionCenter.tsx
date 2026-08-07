import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw, 
  ListFilter, 
  FileText, 
  ChevronRight, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

interface AIAction {
  id: string;
  name: string;
  ownerEngine: string;
  category: string;
  description: string;
  preconditions: string[];
  blockingConditions: string[];
  requiresConfirmation: boolean;
  supportsUndo: boolean;
  rollbackStrategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedDuration: string;
}

interface ActionItem {
  id: string;
  familyId: number;
  actionId: string;
  status: 'PENDING' | 'DRAFT' | 'RECOMMENDED' | 'COMPLETED' | 'SCHEDULED' | 'DISMISSED';
  title: string;
  description: string;
  impactSummary: any;
  createdAt: string;
}

interface AuditRecord {
  id: number;
  actionId: string;
  question: string;
  skillsUsed: string[];
  userDecision: string;
  createdAt: string;
}

export const AIActionCenter: React.FC = () => {
  const [activeStatusTab, setActiveStatusTab] = useState<string>('RECOMMENDED');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [registryActions, setRegistryActions] = useState<AIAction[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedActionModal, setSelectedActionModal] = useState<AIAction | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetchActionData();
  }, [activeStatusTab]);

  const fetchActionData = async () => {
    setLoading(true);
    try {
      const [regRes, itemRes, auditRes] = await Promise.all([
        fetch('/api/v1/ai/actions/registry'),
        fetch(`/api/v1/ai/actions/action-center?status=${activeStatusTab === 'ALL' ? '' : activeStatusTab}`),
        fetch('/api/v1/ai/actions/audit-trail?limit=20')
      ]);

      if (regRes.ok) {
        const data = await regRes.json();
        setRegistryActions(data.actions || []);
      }
      if (itemRes.ok) {
        const data = await itemRes.json();
        setActionItems(data.items || []);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to fetch AI Action Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action: AIAction) => {
    setExecuting(true);
    try {
      const res = await fetch('/api/v1/ai/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: action.id,
          userConfirmed: true,
          familyId: 1
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(`Action "${action.name}" executed successfully! Audit ID: #${data.auditId}`);
        setSelectedActionModal(null);
        fetchActionData();
      } else {
        const err = await res.json();
        alert(`Action Execution Failed: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Error executing action: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleUndoAction = async (actionId: string, auditId: number) => {
    if (!confirm('Are you sure you want to rollback this executed action?')) return;

    try {
      const res = await fetch('/api/v1/ai/actions/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, auditId })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(data.message);
        fetchActionData();
      }
    } catch (err: any) {
      alert(`Rollback error: ${err.message}`);
    }
  };

  const statusCategories = [
    { id: 'RECOMMENDED', label: 'Recommended', count: actionItems.length },
    { id: 'PENDING', label: 'Pending Approval' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'AUDIT_LOG', label: 'Audit Trail' },
    { id: 'REGISTRY', label: 'Action Registry' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">AI Action Center</h1>
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-md">
                  Preview-First Workflow
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Safe Decision Execution • Precondition Validation • Auditable User Confirmation
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveStatusTab(cat.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeStatusTab === cat.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/40 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeStatusTab === 'AUDIT_LOG' ? (
        /* Audit Trail Table */
        <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              AI Action Audit Trail ({auditEntries.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 px-3">Audit ID</th>
                  <th className="pb-3 px-3">Action ID</th>
                  <th className="pb-3 px-3">Question / Description</th>
                  <th className="pb-3 px-3">User Decision</th>
                  <th className="pb-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400">#{entry.id}</td>
                    <td className="py-3 px-3 font-bold text-amber-300">{entry.actionId}</td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{entry.question}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${entry.userDecision === 'EXECUTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                        {entry.userDecision}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{entry.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeStatusTab === 'REGISTRY' ? (
        /* Action Registry List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registryActions.map(act => (
            <div key={act.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{act.name}</span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${act.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : act.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {act.riskLevel} RISK
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
              <div className="text-[10px] text-slate-500 font-mono space-y-1">
                <div>Engine: <span className="text-indigo-300">{act.ownerEngine}</span></div>
                <div>Duration: <span className="text-slate-300">{act.expectedDuration}</span></div>
              </div>
              <button
                onClick={() => setSelectedActionModal(act)}
                className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition-all"
              >
                Preview & Execute Action
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Action Items List */
        <div className="space-y-4">
          {actionItems.map(item => {
            const regAction = registryActions.find(r => r.id === item.actionId);
            return (
              <div key={item.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded">
                      {item.status}
                    </span>
                    <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (regAction) setSelectedActionModal(regAction);
                      else handleExecuteAction({ id: item.actionId, name: item.title, ownerEngine: 'ActionEngine', category: 'PORTFOLIO', description: item.description, preconditions: [], blockingConditions: [], requiresConfirmation: true, supportsUndo: true, rollbackStrategy: 'Restore baseline', riskLevel: 'LOW', expectedDuration: '< 500ms' });
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
                  >
                    Execute Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safe Execution Preview Modal */}
      {selectedActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-sm">{selectedActionModal.name}</h4>
              </div>
              <button
                onClick={() => setSelectedActionModal(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">{selectedActionModal.description}</p>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-400 text-[11px] block">Preconditions Check</span>
                {selectedActionModal.preconditions.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block">Owner Engine</span>
                  <span className="font-bold text-indigo-300">{selectedActionModal.ownerEngine}</span>
                </div>
                <div className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block">Risk Level</span>
                  <span className="font-bold text-amber-300">{selectedActionModal.riskLevel}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedActionModal(null)}
                className="flex-1 py-2.5 border border-slate-700 text-slate-400 hover:text-white rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteAction(selectedActionModal)}
                disabled={executing}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {executing ? 'Executing...' : 'Confirm & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
