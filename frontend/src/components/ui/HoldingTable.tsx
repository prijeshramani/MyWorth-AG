import React, { useState } from 'react';
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Inbox, AlertTriangle, User } from 'lucide-react';

export interface HoldingRow {
  holdingId: number;
  assetName: string;
  symbol?: string;
  assetType: string;
  quantity: number;
  unitPrice: number;
  formattedMarketValue: string;
  unrealizedGainPercent: number;
  familyMemberId?: number;
  familyMemberName?: string;
  familyMemberRelationship?: string;
}

export interface HoldingTableProps {
  data: HoldingRow[];
  loading?: boolean;
  error?: Error | null;
  familyMembers?: Array<{ id: number; name: string; relationship: string }>;
  onReassignOwner?: (assetId: number, memberId: number) => void;
  onRowClick?: (holdingId: number) => void;
}

export const HoldingTable: React.FC<HoldingTableProps> = ({
  data,
  loading = false,
  error = null,
  familyMembers = [],
  onReassignOwner,
  onRowClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'assetName' | 'unrealizedGainPercent'>('assetName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Loading State
  if (loading) {
    return (
      <div className="card-glass p-6 animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded w-1/4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-800/60 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="card-glass p-8 text-center border border-rose-500/30">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-100 mb-1">Failed to Load Holdings</h4>
        <p className="text-xs text-slate-400">{error.message}</p>
      </div>
    );
  }

  const filteredData = data.filter(
    (h) =>
      h.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.symbol && h.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
      h.assetType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.familyMemberName && h.familyMemberName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  const toggleSort = (field: 'assetName' | 'unrealizedGainPercent') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="card-glass overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search holdings by name, symbol, type, or holder name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {sortedData.length} Holdings Listed
        </span>
      </div>

      {/* Empty State */}
      {sortedData.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-medium">No Holdings Found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800/80 uppercase font-semibold text-[10px]">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort('assetName')}
                  >
                    <div className="flex items-center gap-1">
                      Asset Name
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Investment Holder</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Market Value</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort('unrealizedGainPercent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Unrealized Gain
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedData.map((row) => {
                  const isGain = row.unrealizedGainPercent >= 0;
                  return (
                    <tr
                      key={row.holdingId}
                      onClick={() => onRowClick && onRowClick(row.holdingId)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        {row.assetName}
                        {row.symbol && (
                          <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                            ({row.symbol})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {row.assetType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {familyMembers.length > 0 && onReassignOwner ? (
                          <select
                            value={row.familyMemberId || ''}
                            onChange={(e) => onReassignOwner(row.holdingId, Number(e.target.value))}
                            className="bg-slate-900/90 border border-slate-700/70 hover:border-sky-500/50 rounded-lg px-2.5 py-1 text-[11px] font-medium text-sky-300 focus:outline-none focus:border-sky-500 cursor-pointer transition-colors"
                          >
                            {familyMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.relationship || 'Member'})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-semibold">
                            <User className="w-3 h-3 text-sky-400" />
                            {row.familyMemberName || 'Primary Member'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">{row.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono">{row.unitPrice}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        {row.formattedMarketValue}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isGain ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isGain ? '+' : ''}{row.unrealizedGainPercent.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card Fallback */}
          <div className="md:hidden divide-y divide-slate-800/60">
            {sortedData.map((row) => {
              const isGain = row.unrealizedGainPercent >= 0;
              return (
                <div
                  key={row.holdingId}
                  onClick={() => onRowClick && onRowClick(row.holdingId)}
                  className="p-4 flex items-center justify-between active:bg-slate-800/40"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">{row.assetName}</h5>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {row.assetType} • Qty: {row.quantity}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-100">
                      {row.formattedMarketValue}
                    </div>
                    <span
                      className={`text-[11px] font-semibold font-mono ${
                        isGain ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isGain ? '+' : ''}{row.unrealizedGainPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
