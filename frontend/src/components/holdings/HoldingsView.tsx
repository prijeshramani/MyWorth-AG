import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, FileUp } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';
import { HoldingTable, type HoldingRow } from '../ui/HoldingTable';

const DEMO_HOLDINGS: HoldingRow[] = [
  { holdingId: 1, assetName: 'Reliance Industries Ltd', symbol: 'RELIANCE', assetType: 'STOCK', quantity: 150, unitPrice: 2850, formattedMarketValue: '₹4,27,500.00', unrealizedGainPercent: 18.5 },
  { holdingId: 2, assetName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', assetType: 'STOCK', quantity: 200, unitPrice: 1620, formattedMarketValue: '₹3,24,000.00', unrealizedGainPercent: 8.2 },
  { holdingId: 3, assetName: 'Parag Parikh Flexi Cap Fund', symbol: 'PPFCF-GR', assetType: 'MUTUAL_FUND', quantity: 500, unitPrice: 75.4, formattedMarketValue: '₹3,77,000.00', unrealizedGainPercent: 24.6 },
  { holdingId: 4, assetName: 'SBI Bluechip Mutual Fund', symbol: 'SBIBLUE-GR', assetType: 'MUTUAL_FUND', quantity: 800, unitPrice: 82.1, formattedMarketValue: '₹6,56,800.00', unrealizedGainPercent: 12.4 },
  { holdingId: 5, assetName: 'Employee Provident Fund (EPF)', symbol: 'EPF-ACC', assetType: 'EPF', quantity: 1, unitPrice: 850000, formattedMarketValue: '₹8,50,000.00', unrealizedGainPercent: 8.25 }
];

export const HoldingsView: React.FC = () => {
  const { datasetMode, setActiveTab } = useUiStore();
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (datasetMode === 'DEMO') {
      setHoldings(DEMO_HOLDINGS);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
      apiClient.get<any[]>('/assets')
        .then((res) => {
          const raw = Array.isArray(res.data) ? res.data : [];
          const mapped: HoldingRow[] = raw.map((a: any) => ({
            holdingId: a.id,
            assetName: a.name,
            symbol: a.identifier || undefined,
            assetType: a.type || 'OTHER',
            quantity: a.currentUnits || 0,
            unitPrice: a.currentPrice || 0,
            formattedMarketValue: `₹${(a.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            unrealizedGainPercent: a.absoluteReturnPercent || 0
          }));
          setHoldings(mapped);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
    }
  }, [datasetMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">Holdings & Asset Inventory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time portfolio holdings breakdown, quantity positions, market valuation, and unrealized gains.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('import')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileUp className="w-4 h-4" />
            Import Statement
          </button>
        </div>
      </div>

      {/* Holdings Table Component */}
      <HoldingTable data={holdings} loading={loading} error={error} />
    </div>
  );
};
