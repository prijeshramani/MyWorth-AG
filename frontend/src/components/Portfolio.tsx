import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Trash2, 
  ChevronRight, 
  Calendar, 
  Tag, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  History
} from 'lucide-react';

interface Asset {
  id: number;
  name: string;
  type: string;
  category: string;
  identifier: string | null;
  currentUnits: number;
  totalCost: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  absoluteReturn: number;
  absoluteReturnPercent: number;
  priceDate: string;
  lastTransactionDate: string;
}

interface Transaction {
  id: number;
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST' | 'BONUS';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  source: string;
}

export default function Portfolio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Drill-down asset details
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetTxs, setAssetTxs] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState<boolean>(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        setError('Failed to fetch portfolio assets.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetTransactions = async (assetId: number) => {
    try {
      setTxLoading(true);
      const res = await fetch(`http://localhost:5000/api/transactions?assetId=${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setAssetTxs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    fetchAssetTransactions(asset.id);
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('Are you sure you want to delete this asset? This will permanently delete all its transactions and prices.')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${assetId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedAsset(null);
        fetchAssets();
      } else {
        alert('Failed to delete asset');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting asset');
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    if (!window.confirm('Delete this transaction from history? Net worth and cost basis will be updated instantly.')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${txId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedAsset) {
          // Re-fetch transactions
          fetchAssetTransactions(selectedAsset.id);
          // Re-fetch overall assets
          const prevAssetId = selectedAsset.id;
          await fetchAssets();
          // Update selected asset state from the fresh list
          const updatedAssets = await (await fetch('http://localhost:5000/api/assets')).json();
          const fresh = updatedAssets.find((a: any) => a.id === prevAssetId);
          if (fresh) {
            setSelectedAsset(fresh);
          } else {
            setSelectedAsset(null);
          }
        }
      } else {
        alert('Failed to delete transaction');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading holdings data...</span>
      </div>
    );
  }

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Group Assets by Type
  const assetTypes = ['MUTUAL_FUND', 'STOCK', 'NPS', 'GOLD', 'BOND', 'PROPERTY', 'BANK_ACCOUNT', 'OTHER'];
  const assetLabels: Record<string, string> = {
    MUTUAL_FUND: 'Mutual Funds',
    STOCK: 'Stocks',
    NPS: 'National Pension Scheme',
    GOLD: 'Gold & Metal',
    BOND: 'Bonds & Debentures',
    PROPERTY: 'Real Estate',
    BANK_ACCOUNT: 'Cash & Savings',
    OTHER: 'Other Assets'
  };

  // Filter out asset types that have no records to keep UI clean
  const activeAssetTypes = assetTypes.filter(type => 
    assets.some(asset => asset.type === type)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Side drawer detail / normal list view split */}
      {selectedAsset ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detail Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Back Button */}
            <button 
              onClick={() => setSelectedAsset(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Holdings
            </button>

            {/* Asset KPI Card */}
            <div className="card-glass p-6 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Holding Summary</span>
                <button 
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                  className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl transition-all"
                  title="Delete Asset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mt-2 leading-snug">{selectedAsset.name}</h3>
              {selectedAsset.identifier && (
                <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full inline-block mt-1">
                  {selectedAsset.identifier}
                </span>
              )}

              <div className="mt-6 space-y-3.5 border-t border-slate-800/40 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Capital Cost</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(selectedAsset.totalCost)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Valuation</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(selectedAsset.currentValue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Profit / Loss</span>
                  <span className={`font-bold ${selectedAsset.absoluteReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedAsset.absoluteReturn >= 0 ? '+' : ''}{formatCurrency(selectedAsset.absoluteReturn)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Absolute Yield</span>
                  <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${selectedAsset.absoluteReturn >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {selectedAsset.absoluteReturnPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800/40 pt-4 space-y-2">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Balance Units:</span>
                  <span className="font-medium text-slate-400">{selectedAsset.currentUnits.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Avg Purchase Price:</span>
                  <span className="font-medium text-slate-400">{formatCurrency(selectedAsset.avgBuyPrice)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Current Price (NAV):</span>
                  <span className="font-medium text-slate-400">{formatCurrency(selectedAsset.currentPrice)}</span>
                </div>
                {selectedAsset.priceDate && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Last Updated:</span>
                    <span className="font-medium text-slate-400">{new Date(selectedAsset.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Ledger Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-glass p-6 rounded-2xl">
              <h4 className="font-bold text-lg text-slate-100 mb-4 border-b border-slate-800/40 pb-3 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" /> Transaction Ledger
              </h4>

              {txLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : assetTxs.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500">
                  No transactions found for this asset.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800/60 pb-2.5 font-bold uppercase tracking-wider">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Units / Shares</th>
                        <th className="pb-3 text-right">NAV / Rate</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {assetTxs.map((tx) => {
                        const isBuy = tx.type === 'BUY' || tx.type === 'REINVEST';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-800/10">
                            <td className="py-3 text-slate-300 font-medium">
                              {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                                isBuy ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3 text-right font-medium text-slate-300">{tx.quantity.toFixed(4)}</td>
                            <td className="py-3 text-right font-medium text-slate-300">{formatCurrency(tx.price)}</td>
                            <td className="py-3 text-right font-bold text-slate-200">{formatCurrency(tx.amount)}</td>
                            <td className="py-3 text-center">
                              <button 
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Portfolio List Grouped */
        <div className="space-y-8">
          {activeAssetTypes.length === 0 ? (
            <div className="card-glass p-8 text-center rounded-2xl max-w-lg mx-auto">
              <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg text-slate-200">No assets in portfolio</h3>
              <p className="text-xs text-slate-400 mt-1">
                Import a PDF statement or add transactions manually in the Ledger to track holdings.
              </p>
            </div>
          ) : (
            activeAssetTypes.map((type) => {
              const groupedAssets = assets.filter(a => a.type === type);
              
              // Sum holdings valuation for this category
              const totalCatWorth = groupedAssets.reduce((sum, current) => sum + current.currentValue, 0);
              const totalCatCost = groupedAssets.reduce((sum, current) => sum + current.totalCost, 0);
              const totalCatGains = totalCatWorth - totalCatCost;
              const totalCatReturns = totalCatCost > 0 ? (totalCatGains / totalCatCost) * 100 : 0;

              return (
                <div key={type} className="space-y-3">
                  {/* Category Header Card */}
                  <div className="card-glass px-6 py-3.5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center border-l-4 border-l-indigo-500/80 bg-slate-900/40 gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        {assetLabels[type] || type}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {groupedAssets.length} asset{groupedAssets.length > 1 ? 's' : ''} active
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Current Value</span>
                        <span className="text-sm font-bold text-slate-200 block">{formatCurrency(totalCatWorth)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Return</span>
                        <span className={`text-xs font-bold block ${totalCatGains >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {totalCatGains >= 0 ? '+' : ''}{totalCatReturns.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assets Grid list inside category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedAssets.map((asset) => {
                      const isHoldingProfit = asset.absoluteReturn >= 0;
                      return (
                        <div 
                          key={asset.id} 
                          onClick={() => handleSelectAsset(asset)}
                          className="card-glass p-5 rounded-2xl card-glass-hover cursor-pointer relative overflow-hidden flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-100 truncate pr-4">{asset.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {asset.identifier && (
                                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-800 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                    {asset.identifier}
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-500 font-medium">{asset.category}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 hover:text-indigo-400 transition-colors flex-shrink-0" />
                          </div>

                          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/30">
                            <div>
                              <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Investment</span>
                              <span className="text-xs font-bold text-slate-300 block mt-0.5">{formatCurrency(asset.totalCost)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Valuation</span>
                              <span className="text-xs font-bold text-slate-200 block mt-0.5">{formatCurrency(asset.currentValue)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider block">Yield</span>
                              <span className={`text-xs font-extrabold block mt-0.5 ${isHoldingProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isHoldingProfit ? '+' : ''}{asset.absoluteReturnPercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
