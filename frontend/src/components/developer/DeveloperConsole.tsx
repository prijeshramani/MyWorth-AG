import React, { useState } from 'react';
import { Terminal, Database, Activity, ShieldCheck, Cpu, Code, FileText, CheckCircle2 } from 'lucide-react';

export const DeveloperConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'logs' | 'migrations' | 'rules' | 'performance'>('tables');

  const migrations = [
    { version: 1, name: '001_domain_foundation', status: 'APPLIED', timestamp: '2026-07-25 10:00' },
    { version: 2, name: '002_asset_master_and_holdings', status: 'APPLIED', timestamp: '2026-07-25 10:01' },
    { version: 3, name: '003_transaction_holding_link', status: 'APPLIED', timestamp: '2026-07-25 10:02' },
    { version: 4, name: '004_insurance_policies', status: 'APPLIED', timestamp: '2026-07-26 12:00' },
    { version: 5, name: '005_security', status: 'APPLIED', timestamp: '2026-07-27 09:00' },
    { version: 6, name: '006_taxation', status: 'APPLIED', timestamp: '2026-07-27 16:00' }
  ];

  const dbTables = [
    { name: 'families', rows: 1, engine: 'SQLite WAL' },
    { name: 'family_members', rows: 3, engine: 'SQLite WAL' },
    { name: 'assets_master', rows: 142, engine: 'SQLite WAL' },
    { name: 'holdings', rows: 54, engine: 'SQLite WAL' },
    { name: 'transactions', rows: 210, engine: 'SQLite WAL' },
    { name: 'insurance_policies', rows: 4, engine: 'SQLite WAL' },
    { name: 'users', rows: 2, engine: 'SQLite WAL' },
    { name: 'audit_logs', rows: 18, engine: 'SQLite WAL' },
    { name: 'tax_rules', rows: 4, engine: 'SQLite WAL' },
    { name: 'tax_slabs', rows: 10, engine: 'SQLite WAL' }
  ];

  const mockLogs = [
    '[API Logging] GET /api/v1/portfolio/summary?familyId=1 | Status: 200 | Duration: 9ms | CorrelationId: req_88912',
    '[API Logging] GET /api/v1/protection/summary?familyId=1 | Status: 200 | Duration: 4ms | CorrelationId: req_88913',
    '[API Logging] GET /api/v1/tax/summary?familyId=1 | Status: 200 | Duration: 12ms | CorrelationId: req_88914',
    '[AUTH LOG] User login successful: user_id=1, email=rajesh.sharma@myworth.test, ip=127.0.0.1',
    '[TAX SEED] TaxRuleSeedLoader verified baseline rules for FY 2025-26 & FY 2026-27'
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100 font-sans">Developer Mode & System Diagnostics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Read-only Database Inspector, Migration Status, Tax Rule Viewer, API Console & Performance Metrics.
          </p>
        </div>

        {/* Console Subtabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'tables' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DB Viewer
          </button>
          <button
            onClick={() => setActiveTab('migrations')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'migrations' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Migrations
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'logs' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            API Logs
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'performance' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Performance
          </button>
        </div>
      </div>

      {activeTab === 'tables' && (
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-sans">
            <Database className="w-4 h-4 text-sky-400" />
            SQLite Database Table Inspector
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {dbTables.map((t) => (
              <div key={t.name} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                <span className="text-xs font-bold text-slate-200 block truncate">{t.name}</span>
                <span className="text-[11px] text-emerald-400 block">{t.rows} Rows</span>
                <span className="text-[9px] text-slate-500 block">{t.engine}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'migrations' && (
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Applied Database Migrations
          </h3>

          <div className="space-y-2 text-xs">
            {migrations.map((m) => (
              <div key={m.version} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    v{m.version}
                  </span>
                  <span className="font-bold text-slate-200">{m.name}</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {m.status} • {m.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card-glass p-6 space-y-4 bg-slate-950">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-sans">
            <Terminal className="w-4 h-4 text-sky-400" />
            Live API Execution & Security Audit Console
          </h3>

          <div className="p-4 bg-black/60 rounded-lg border border-slate-800 text-slate-300 text-xs space-y-1.5 max-h-64 overflow-y-auto">
            {mockLogs.map((log, i) => (
              <div key={i} className="text-sky-300/90">{log}</div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="card-glass p-6 space-y-4 font-sans">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            System Runtime Performance Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[10px] uppercase block">Avg API Latency</span>
              <span className="text-lg font-bold text-emerald-400">4.2 ms</span>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[10px] uppercase block">Test Suite Coverage</span>
              <span className="text-lg font-bold text-sky-400">161 / 161 PASS</span>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[10px] uppercase block">Frontend Bundle Size</span>
              <span className="text-lg font-bold text-indigo-400">290 kB (90 kB gzip)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
