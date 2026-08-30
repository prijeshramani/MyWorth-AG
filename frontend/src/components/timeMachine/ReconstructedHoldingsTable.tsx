import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ReconstructedAssetHolding, ProvenanceType } from '../../types/familyOffice';

interface ReconstructedHoldingsTableProps {
  holdings: ReconstructedAssetHolding[];
}

const getProvenanceBadge = (provenance: ProvenanceType, lagDays: number) => {
  switch (provenance) {
    case 'EXACT_HISTORICAL':
      return <Badge variant="success" size="sm">Exact Date Price</Badge>;
    case 'PROXY_HISTORICAL':
      return <Badge variant="info" size="sm">Proxy Date ({lagDays}d lag)</Badge>;
    case 'KNOWN_ACQUISITION_COST':
      return <Badge variant="warning" size="sm">Cost Basis</Badge>;
    case 'CALCULATED':
      return <Badge variant="primary" size="sm">Calculated / Accrued</Badge>;
    case 'HISTORICAL_SOURCE_UNAVAILABLE':
    default:
      return <Badge variant="neutral" size="sm">Source Unavailable</Badge>;
  }
};

export const ReconstructedHoldingsTable: React.FC<ReconstructedHoldingsTableProps> = ({ holdings }) => {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#9CA3AF] bg-[#1E2025]/30 rounded-xl border border-dashed border-[#2B2E35]">
        No active asset holdings recorded as of this date.
      </div>
    );
  }

  return (
    <Card variant="glass" className="overflow-hidden border border-[#2B2E35]">
      <div className="p-4 border-b border-[#2B2E35] flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#F3F4F6]">Reconstructed Asset Holdings</h4>
          <p className="text-xs text-[#9CA3AF]">
            5-level valuation hierarchy with strict null-safety and valuation provenance
          </p>
        </div>
        <span className="text-xs text-[#9CA3AF] font-mono">{holdings.length} Assets</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2B2E35] bg-[#1E2025]/60 text-[#9CA3AF] font-semibold text-[11px]">
              <th className="py-3 px-4">Asset Name</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4 text-right">Units</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-right">Market Value</th>
              <th className="py-3 px-4">Valuation Type</th>
              <th className="py-3 px-4">Provenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B2E35]/40 text-[#F3F4F6]">
            {holdings.map((h) => {
              const isUnpriced = h.totalMarketValue === null || h.provenance === 'HISTORICAL_SOURCE_UNAVAILABLE';

              return (
                <tr key={h.assetId} className="hover:bg-[#1E2025]/40 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    <div className="font-semibold text-xs text-[#F3F4F6]">{h.assetName}</div>
                    {h.lifecycleStatus && (
                      <div className="text-[10px] text-[#6B7280] font-mono">{h.lifecycleStatus}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#9CA3AF]">{h.assetClass}</td>
                  <td className="py-3 px-4 text-right font-mono">{h.units.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {h.unitPrice !== undefined && h.unitPrice !== null ? (
                      `₹${h.unitPrice.toLocaleString('en-IN')}`
                    ) : (
                      <span className="text-[#6B7280]">--</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {isUnpriced ? (
                      <span className="text-amber-400 font-normal italic text-[11px]">
                        Historical value unavailable
                      </span>
                    ) : (
                      `₹${h.totalMarketValue!.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#9CA3AF]">
                    {h.valuationType}
                  </td>
                  <td className="py-3 px-4">
                    {getProvenanceBadge(h.provenance, h.daysOfProxyLag)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
