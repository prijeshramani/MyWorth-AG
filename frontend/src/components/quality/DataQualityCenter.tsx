import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert, CheckCircle, ArrowRight, UserCheck, FileText, AlertTriangle } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

interface QualityIssue {
  id: string;
  category: 'PAN' | 'Nominee' | 'Cost Price' | 'Tax Profile' | 'Duplicate';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  targetTab: string;
}

const INITIAL_ISSUES: QualityIssue[] = [
  { id: '1', category: 'Nominee', severity: 'HIGH', title: 'Missing Nominee on Insurance Policy POL-9901', description: 'Max Life Term Insurance policy has no assigned nominee contact.', targetTab: 'protection' },
  { id: '2', category: 'Cost Price', severity: 'MEDIUM', title: 'Missing Acquisition Cost for TCS Holdings', description: '250 shares of TCS have ₹0 cost price recorded. XIRR computation requires cost basis.', targetTab: 'holdings' },
  { id: '3', category: 'Tax Profile', severity: 'HIGH', title: 'Missing Aadhaar-PAN Link Status for Priya Sharma', description: 'Tax optimization engine requires verified Aadhaar-PAN linking status.', targetTab: 'family' },
  { id: '4', category: 'PAN', severity: 'LOW', title: 'Missing PAN for Minor Child Aarav Sharma', description: 'Consider updating PAN for future minor investment tracking.', targetTab: 'family' }
];

export const DataQualityCenter: React.FC = () => {
  const { datasetMode, setActiveTab } = useUiStore();
  const [issues, setIssues] = useState<QualityIssue[]>([]);

  useEffect(() => {
    if (datasetMode === 'DEMO') {
      setIssues(INITIAL_ISSUES);
    } else {
      setIssues([]);
    }
  }, [datasetMode]);

  const handleResolve = (id: string, targetTab: string) => {
    setIssues(issues.filter(i => i.id !== id));
    setActiveTab(targetTab);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-100">Data Quality & Compliance Audit Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated health checks scanning for missing PAN numbers, unassigned nominees, zero cost prices, and tax profile gaps.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold">
            {issues.length} Pending Audit Issues
          </span>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="space-y-3">
        {issues.length === 0 ? (
          <div className="card-glass p-8 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">All Data Quality Audits Passed!</h3>
            <p className="text-xs text-slate-400">No missing PANs, nominees, cost prices, or validation warnings detected.</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="card-glass p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  issue.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  issue.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{issue.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{issue.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleResolve(issue.id, issue.targetTab)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-end sm:self-center shrink-0"
              >
                <span>Fix Issue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
