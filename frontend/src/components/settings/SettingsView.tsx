import React, { useState, useRef } from 'react';
import { Settings, Lock, Database, Download, Upload, CheckCircle, AlertCircle, Loader2, FileJson, HardDrive } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';

export const SettingsView: React.FC = () => {
  const { datasetMode, setDatasetMode, reportingCurrency, setReportingCurrency } = useUiStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const sqliteInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      setStatusMessage(null);
      const res = await apiClient.get('/platform/backup/export/json', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `myworth_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'JSON backup archive downloaded successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `JSON export failed: ${err.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSqlite = async () => {
    try {
      setIsExporting(true);
      setStatusMessage(null);
      const res = await apiClient.get('/platform/backup/export/sqlite', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/x-sqlite3' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `myworth_database_${new Date().toISOString().slice(0, 10)}.sqlite`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'SQLite database backup (.sqlite) downloaded successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `SQLite export failed: ${err.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Are you sure you want to restore workspace data from "${file.name}"? This will update your database records.`)) {
      e.target.value = '';
      return;
    }

    try {
      setIsRestoring(true);
      setStatusMessage(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/platform/backup/restore/json', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMessage({ type: 'success', text: res.data.message || 'JSON backup restored successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || `JSON restore failed: ${err.message}` });
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  const handleRestoreSqlite = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Are you sure you want to restore SQLite database from "${file.name}"? This will overwrite existing database records.`)) {
      e.target.value = '';
      return;
    }

    try {
      setIsRestoring(true);
      setStatusMessage(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/platform/backup/restore/sqlite', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMessage({ type: 'success', text: res.data.message || 'SQLite database restored successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || `SQLite restore failed: ${err.message}` });
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={jsonInputRef}
        accept=".json"
        onChange={handleRestoreJson}
        className="hidden"
      />
      <input
        type="file"
        ref={sqliteInputRef}
        accept=".sqlite,.db"
        onChange={handleRestoreSqlite}
        className="hidden"
      />

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 flex items-center gap-2">
        <Settings className="w-6 h-6 text-sky-500" />
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Platform Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system preferences, security, dataset modes, notifications, and data backups.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Dataset & Workspace Settings */}
        <div className="card-glass p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            Dataset & Workspace Mode
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Dataset Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Switch between Demo Sample Dataset and Real Personal Workspace.</span>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
                <button
                  onClick={() => setDatasetMode('DEMO')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    datasetMode === 'DEMO' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  DEMO
                </button>
                <button
                  onClick={() => setDatasetMode('REAL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    datasetMode === 'REAL' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  REAL
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Reporting Currency</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Global currency valuation format.</span>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-lg">
                <button
                  onClick={() => setReportingCurrency('INR')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    reportingCurrency === 'INR' ? 'bg-sky-600 text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  onClick={() => setReportingCurrency('USD')}
                  className={`px-2.5 py-1 text-xs font-bold rounded ${
                    reportingCurrency === 'USD' ? 'bg-sky-600 text-white' : 'text-slate-500 dark:text-slate-400'
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
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            Security & Session Management
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Password & JWT Authentication</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">PBKDF2 Salt Hashing • 15-min Access Tokens</span>
              </div>
              <button className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-semibold text-[11px]">
                Change Password
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Active User Sessions</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">1 Active Refresh Token Session</span>
              </div>
              <button className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800/50 rounded-lg font-semibold text-[11px] transition-colors">
                Revoke All Sessions
              </button>
            </div>
          </div>
        </div>

        {/* 3. Backup & Data Export / Import */}
        <div className="card-glass md:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-500" />
              Backup & Database Management
            </h3>
            {(isExporting || isRestoring) && (
              <div className="flex items-center gap-2 text-xs text-sky-500 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isExporting ? 'Generating Backup...' : 'Restoring Database...'}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export a full JSON archive or live SQLite database file (`.sqlite`). You can restore from either JSON or SQLite file formats to restore workspace data.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Export Group */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Download className="w-4 h-4 text-sky-500" />
                <span>Export Data & Database</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Download a complete copy of your workspace data to local storage.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={handleExportJson}
                  disabled={isExporting || isRestoring}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <FileJson className="w-4 h-4" /> Export JSON Archive
                </button>
                <button
                  onClick={handleExportSqlite}
                  disabled={isExporting || isRestoring}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <HardDrive className="w-4 h-4" /> Export SQLite (.sqlite)
                </button>
              </div>
            </div>

            {/* Restore Group */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Upload className="w-4 h-4 text-amber-500" />
                <span>Restore Data & Database</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Restore workspace tables and records from a JSON file or SQLite database file.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() => jsonInputRef.current?.click()}
                  disabled={isExporting || isRestoring}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <FileJson className="w-4 h-4 text-amber-500" /> Restore from JSON
                </button>
                <button
                  onClick={() => sqliteInputRef.current?.click()}
                  disabled={isExporting || isRestoring}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <HardDrive className="w-4 h-4 text-indigo-500" /> Restore from SQLite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

