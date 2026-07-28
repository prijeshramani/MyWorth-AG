import React, { useState, useEffect } from 'react';
import { dxService } from '../../services/dxService';
import type { SystemHealthDTO, BackupMetadataDTO } from '../../services/dxService';
import { PageSkeleton } from '../common/PageSkeleton';
import { MetricCard } from '../ui/MetricCard';
import { RiskGauge } from '../ui/RiskGauge';
import { 
  Terminal, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  HardDrive, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  Cpu, 
  Zap 
} from 'lucide-react';

export const DeveloperConsole: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthDTO | null>(null);
  const [backups, setBackups] = useState<BackupMetadataDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const hRes = await dxService.getHealth();
      const bRes = await dxService.listBackups();
      setHealth(hRes.data);
      setBackups(bRes.data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBackup = async () => {
    setActionMessage('Creating Beta Safe Mode backup...');
    try {
      await dxService.createBackup('Manual Safe Mode Backup');
      setActionMessage('Backup created successfully!');
      fetchData();
    } catch {
      setActionMessage('Failed to create backup.');
    }
  };

  const handleRestoreLast = async () => {
    setActionMessage('Restoring last backup...');
    try {
      const res = await dxService.restoreBackup();
      if (res.data?.isValid) {
        setActionMessage('Restored database successfully and verified integrity (Migration v11)!');
      } else {
        setActionMessage('Restore completed with integrity warnings.');
      }
      fetchData();
    } catch {
      setActionMessage('Failed to restore backup.');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-100">Developer Experience (DX) & Developer Console</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-world local onboarding, Beta Safe Mode automatic recovery points, system health monitoring, and engine recalculation triggers.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreateBackup}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Create Backup
          </button>
          <button
            onClick={handleRestoreLast}
            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Last Backup
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs font-mono text-purple-300">
          {actionMessage}
        </div>
      )}

      {/* KPI Cards & Health Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge
          label="System Health Score (S_Health)"
          value={health?.systemHealthScore || 98}
          minValue={0}
          maxValue={100}
          ratingLabel="OPTIMAL"
          statusColor="#10b981"
        />

        <MetricCard
          title="Beta Safe Recovery Points"
          value={`${backups.length} Available Backup(s)`}
          subtext={`Last backup: ${health?.lastBackupAgeHours || 0} hour(s) ago`}
          changePercent={100.0}
          trend="UP"
          icon={<HardDrive className="w-4 h-4 text-sky-400" />}
        />

        <MetricCard
          title="Migration & DB Version"
          value={`v${health?.migrationVersion || 11} (SQLite WAL)`}
          subtext={`Size: ${((health?.databaseSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB`}
          changePercent={0.0}
          trend="NEUTRAL"
          icon={<Database className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Component Health Cards */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          Component Health Diagnostics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {Object.entries(health?.components || {}).map(([key, item]) => (
            <div key={key} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 capitalize">{key}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">{item.message}</span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Backup Recovery Points List */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Beta Safe Mode Recovery Points
        </h3>

        <div className="space-y-2">
          {backups.map((b) => (
            <div key={b.filename} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex justify-between items-center text-xs font-mono">
              <div>
                <span className="font-bold text-slate-100 mr-2">{b.recoveryPointName}</span>
                <span className="text-slate-400 text-[11px]">{b.filename}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-300 block">{new Date(b.createdAt).toLocaleString()}</span>
                <span className="text-slate-500 text-[10px]">{(b.sizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
