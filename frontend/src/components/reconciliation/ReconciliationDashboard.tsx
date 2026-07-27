import React, { useState } from 'react';
import { GitCompare, CheckCircle, AlertCircle, ArrowRightLeft, RefreshCw, FileText } from 'lucide-react';

interface ReconPair {
  id: string;
  sourceA: string;
  sourceB: string;
  matchedCount: number;
  mismatchCount: number;
  status: 'MATCHED' | 'MISMATCH_DETECTED';
  details: string;
}

const RECON_ITEMS: ReconPair[] = [
  { id: '1', sourceA: 'Zerodha Demat Statement', sourceB: 'Portfolio Tree Holdings', matchedCount: 18, mismatchCount: 0, status: 'MATCHED', details: 'All 18 demat quantities match portfolio holdings perfectly.' },
  { id: '2', sourceA: 'CAMS CAS Statement', sourceB: 'Mutual Fund Holdings', matchedCount: 14, mismatchCount: 1, status: 'MISMATCH_DETECTED', details: 'HDFC Top 100 Fund has 5.2 units difference between CAS statement and portfolio.' },
  { id: '3', sourceA: 'Realized Gains (FIFO)', sourceB: 'Form 26AS Tax Record', matchedCount: 6, mismatchCount: 0, status: 'MATCHED', details: 'Capital gains STCG/LTCG match Form 26AS AIS/TIS summary.' },
  { id: '4', sourceA: 'HDFC Bank Statement', sourceB: 'Cash Flow Transactions', matchedCount: 42, mismatchCount: 0, status: 'MATCHED', details: 'Bank inflows and interest credits reconciled.' }
];

export const ReconciliationDashboard: React.FC = () => {
  const [items, setItems] = useState<ReconPair[]>(RECON_ITEMS);
  const [reconciling, setReconciling] = useState(false);

  const handleRunRecon = () => {
    setReconciling(true);
    setTimeout(() => {
      setReconciling(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">Reconciliation Dashboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated multi-way reconciliation matching Broker Statements vs Portfolio, Portfolio vs Tax, and Bank vs Cash Flow.
          </p>
        </div>

        <button
          onClick={handleRunRecon}
          disabled={reconciling}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
          {reconciling ? 'Reconciling Data...' : 'Run Auto Reconciliation'}
        </button>
      </div>

      {/* Reconciliation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="card-glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span>{item.sourceA}</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                <span>{item.sourceB}</span>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                item.status === 'MATCHED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {item.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{item.details}</p>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">Matched: {item.matchedCount}</span>
              <span className={item.mismatchCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                Mismatches: {item.mismatchCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
