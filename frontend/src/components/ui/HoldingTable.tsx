import React, { useState } from 'react';
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Inbox, AlertTriangle, User } from 'lucide-react';

export interface HoldingRow {
  holdingId: number;
  assetName: string;
  symbol?: string;
  assetType: string;
  quantity: number;
  unitPrice: number;
  investedValue?: number;
  formattedInvestedValue?: string;
  marketValue?: number;
  formattedMarketValue: string;
  unrealizedGainAmount?: number;
  formattedUnrealizedGainAmount?: string;
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

const formatQuantity = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return Number(val.toFixed(2)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatUnitPrice = (val: number) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0.00';
  return `₹${Number(val.toFixed(2)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const HoldingTable: React.FC<HoldingTableProps> = ({
  data,
  loading = false,
  error = null,
  familyMembers = [],
  onReassignOwner,
  onRowClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'assetName' | 'investedValue' | 'marketValue' | 'unrealizedGainPercent'>('marketValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
    (h) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (h.assetName || '').toLowerCase().includes(q) ||
        (h.symbol || '').toLowerCase().includes(q) ||
        (h.assetType || '').toLowerCase().includes(q) ||
        (h.familyMemberName || '').toLowerCase().includes(q)
      );
    }
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];
    if (sortField === 'marketValue' && valA === undefined) valA = a.quantity * a.unitPrice;
    if (sortField === 'marketValue' && valB === undefined) valB = b.quantity * b.unitPrice;
    if (sortField === 'investedValue' && valA === undefined) valA = 0;
    if (sortField === 'investedValue' && valB === undefined) valB = 0;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? ((valA || 0) as number) - ((valB || 0) as number) : ((valB || 0) as number) - ((valA || 0) as number);
  });

  const toggleSort = (field: 'assetName' | 'investedValue' | 'marketValue' | 'unrealizedGainPercent') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
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
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort('investedValue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Invested Value
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                    onClick={() => toggleSort('marketValue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Market Value
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
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
                      <td className="py-3.5 px-4 text-right font-mono">{formatQuantity(row.quantity)}</td>
                      <td className="py-3.5 px-4 text-right font-mono">{formatUnitPrice(row.unitPrice)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-medium">
                        {row.formattedInvestedValue || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        {row.formattedMarketValue}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              isGain ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isGain ? '+' : ''}{row.unrealizedGainPercent.toFixed(2)}%
                          </span>
                          {row.formattedUnrealizedGainAmount && (
                            <span className={`text-[10px] font-medium ${isGain ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                              {row.formattedUnrealizedGainAmount}
                            </span>
                          )}
                        </div>
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
                      {row.assetType} • Qty: {formatQuantity(row.quantity)}
                    </span>
                    {row.formattedInvestedValue && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Cost: {row.formattedInvestedValue}
                      </div>
                    )}
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
