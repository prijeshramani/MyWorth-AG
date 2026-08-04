import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Download, 
  Cpu, 
  Database, 
  Layers, 
  Sliders, 
  Plug, 
  Activity, 
  CheckCircle2, 
  RefreshCw,
  FileCode,
  Sparkles
} from 'lucide-react';

export const DeveloperDiagnosticConsole: React.FC = () => {
  const [registryData, setRegistryData] = useState<any>(null);
  const [featureData, setFeatureData] = useState<any>(null);
  const [pluginData, setPluginData] = useState<any>(null);
  const [observabilityData, setObservabilityData] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('FEATURES');

  useEffect(() => {
    fetchAllDiagnostics();
  }, []);

  const fetchAllDiagnostics = async () => {
    setLoading(true);
    try {
      const [regRes, featRes, plugRes, obsRes, bmRes, secRes] = await Promise.all([
        fetch('/api/v1/platform/registry'),
        fetch('/api/v1/platform/features'),
        fetch('/api/v1/platform/plugins'),
        fetch('/api/v1/platform/observability'),
        fetch('/api/v1/platform/benchmarks'),
        fetch('/api/v1/platform/security')
      ]);

      if (regRes.ok) setRegistryData(await regRes.json());
      if (featRes.ok) setFeatureData(await featRes.json());
      if (plugRes.ok) setPluginData(await plugRes.json());
      if (obsRes.ok) setObservabilityData(await obsRes.json());
      if (bmRes.ok) setBenchmarkData(await bmRes.json());
      if (secRes.ok) setSecurityData(await secRes.json());
    } catch (err) {
      console.error('Failed to fetch developer diagnostic telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (featureId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/v1/platform/features/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId,
          enabled: !currentEnabled,
          user: 'developer_console',
          reason: 'Manual Developer Console Toggle'
        })
      });

      if (res.ok) {
        fetchAllDiagnostics();
      }
    } catch (err: any) {
      alert(`Toggle error: ${err.message}`);
    }
  };

  const handleExportDiagnosticsJson = () => {
    const fullDiagnostics = {
      exportedAt: new Date().toISOString(),
      platformVersion: 'v2.0.0',
      migrationVersion: 12,
      registry: registryData,
      features: featureData,
      plugins: pluginData,
      observability: observabilityData,
      benchmarks: benchmarkData,
      security: securityData
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDiagnostics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `familywealthos_diagnostics_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Developer Diagnostic Console</h1>
                <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-md font-mono">
                  v2.0.0 (Mig v12)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Runtime Inspection • Registry Audit • Feature Flags • JSON Export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllDiagnostics}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Diagnostics
            </button>
            <button
              onClick={handleExportDiagnosticsJson}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Diagnostics JSON
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'FEATURES', label: 'Feature Flags' },
            { id: 'PLUGINS', label: 'Plugins' },
            { id: 'BENCHMARKS', label: 'Engine Benchmarks' },
            { id: 'REGISTRY', label: 'Platform Inventory' },
            { id: 'SECURITY', label: 'Security Hardening' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/40 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'FEATURES' ? (
        <div className="space-y-4">
          <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Feature Flags Registry ({featureData?.features?.length || 0})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureData?.features?.map((f: any) => (
                <div key={f.id} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{f.name}</span>
                      <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {f.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{f.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">Env: {f.environment}</span>
                    <button
                      onClick={() => handleToggleFeature(f.id, f.enabled)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        f.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {f.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'PLUGINS' ? (
        <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Plug className="w-4 h-4 text-purple-400" />
            Active Integration Plugins ({pluginData?.plugins?.length || 0})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pluginData?.plugins?.map((p: any) => (
              <div key={p.id} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{p.name}</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded">
                    {p.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{p.description}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60 flex justify-between">
                  <span>Version: {p.version}</span>
                  <span>Health: {p.health}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'BENCHMARKS' ? (
        <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Calculation Engine Latency Benchmarks
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {benchmarkData?.latestReport?.regressionComparison?.performanceDeltaPercent}% Performance Improvement
            </span>
          </h3>

          <div className="space-y-3">
            {benchmarkData?.latestReport?.results?.map((bm: any, idx: number) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-xs">{bm.engineName}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Max Threshold: {bm.thresholdMaxMs}ms</span>
                </div>
                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>Avg Latency: <strong className="text-indigo-300">{bm.avgTimeMs}ms</strong></div>
                  <div>P95 Latency: <strong className="text-purple-300">{bm.p95TimeMs}ms</strong></div>
                  <div>Throughput: <strong className="text-emerald-400">{bm.throughputPerSec}/s</strong></div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">
                    {bm.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'SECURITY' ? (
        <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Security & Hardening Audit Checks
          </h3>

          <div className="space-y-3">
            {securityData?.checks?.map((sc: any, idx: number) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{sc.name}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded font-mono">
                      {sc.checkId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{sc.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            Unified Platform Inventory ({registryData?.items?.length || 0})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Name</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Owner Engine</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {registryData?.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-3 font-mono text-indigo-300">{item.id}</td>
                    <td className="py-3 px-3 font-bold text-white">{item.name}</td>
                    <td className="py-3 px-3 text-slate-400">{item.category}</td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{item.owner}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
