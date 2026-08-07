import React from 'react';
import { Settings, User, Lock, Bell, Database, Download, Upload, IndianRupee, ShieldCheck } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

export const SettingsView: React.FC = () => {
  const { datasetMode, setDatasetMode, reportingCurrency, setReportingCurrency } = useUiStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex items-center gap-2">
        <Settings className="w-6 h-6 text-sky-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-100">Platform Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure system preferences, security, dataset modes, notifications, and data backups.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Dataset & Workspace Settings */}
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            Dataset & Workspace Mode
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Dataset Mode</span>
                <span className="text-[11px] text-slate-400">Switch between Demo Sample Dataset and Real Personal Workspace.</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg">
                <button
                  onClick={() => setDatasetMode('DEMO')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    datasetMode === 'DEMO' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'
                  }`}
                >
                  DEMO
                </button>
                <button
                  onClick={() => setDatasetMode('REAL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    datasetMode === 'REAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  REAL
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Reporting Currency</span>
                <span className="text-[11px] text-slate-400">Global currency valuation format.</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg">
                <button
                  onClick={() => setReportingCurrency('INR')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    reportingCurrency === 'INR' ? 'bg-sky-600 text-white' : 'text-slate-400'
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  onClick={() => setReportingCurrency('USD')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    reportingCurrency === 'USD' ? 'bg-sky-600 text-white' : 'text-slate-400'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Security & Sessions */}
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Security & Session Management
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Password & JWT Authentication</span>
                <span className="text-slate-400 text-[11px]">PBKDF2 Salt Hashing • 15-min Access Tokens</span>
              </div>
              <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px]">
                Change Password
              </button>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Active User Sessions</span>
                <span className="text-slate-400 text-[11px]">1 Active Refresh Token Session</span>
              </div>
              <button className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800/50 rounded-lg font-semibold text-[11px] transition-colors">
                Revoke All Sessions
              </button>
            </div>
          </div>
        </div>

        {/* 3. Backup & Data Export */}
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-400" />
            Backup & Data Export
          </h3>

          <p className="text-xs text-slate-400">
            Export complete SQLite database backup or full JSON workspace archive.
          </p>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export Backup Archive (.json)
            </button>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Restore Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
