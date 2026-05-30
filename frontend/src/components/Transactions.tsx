import React, { useEffect, useState } from 'react';
import { 
  History, 
  Trash2, 
  Search, 
  Filter, 
  PlusCircle, 
  X, 
  Check, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';

interface Transaction {
  id: number;
  asset_id: number;
  type: 'BUY' | 'SELL' | 'REINVEST' | 'DIVIDEND' | 'INTEREST' | 'BONUS';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  source: 'MANUAL' | 'PDF_IMPORT';
  asset_name: string;
  asset_type: string;
  asset_category: string;
  identifier?: string | null;
}

interface Asset {
  id: number;
  name: string;
  type: string;
  category: string;
  identifier: string | null;
}

export default function Transactions() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');

  // Modal State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeFormTab, setActiveFormTab] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // Form State: Existing Asset
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [txType, setTxType] = useState<string>('BUY');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txQty, setTxQty] = useState<string>('');
  const [txPrice, setTxPrice] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');

  // Form State: New Asset
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetType, setNewAssetType] = useState<string>('BANK_ACCOUNT');
  const [newAssetCat, setNewAssetCat] = useState<string>('Cash');
  const [newAssetId, setNewAssetId] = useState<string>('');

  const fetchTxs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTxs(data);
      } else {
        setError('Failed to fetch ledger transactions.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with local server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTxs();
    fetchAssets();
  }, []);

  // Update Amount when Qty or Price changes in manual entry
  useEffect(() => {
    const qtyNum = parseFloat(txQty);
    const priceNum = parseFloat(txPrice);
    if (!isNaN(qtyNum) && !isNaN(priceNum)) {
      setTxAmount((qtyNum * priceNum).toFixed(2));
    }
  }, [txQty, txPrice]);

  const handleDelete = async (txId: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction? Current valuation will be computed instantly.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${txId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTxs();
      } else {
        alert('Failed to delete transaction.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  };

  // Submit manual transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeFormTab === 'EXISTING') {
      if (!selectedAssetId) return alert('Please select an asset.');
      const payload = {
        asset_id: parseInt(selectedAssetId),
        type: txType,
        date: txDate,
        quantity: parseFloat(txQty),
        price: parseFloat(txPrice),
        amount: parseFloat(txAmount),
        source: 'MANUAL'
      };

      if (isNaN(payload.quantity) || isNaN(payload.price) || isNaN(payload.amount)) {
        return alert('Please enter valid numbers.');
      }

      try {
        const res = await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsOpen(false);
          resetForm();
          fetchTxs();
        } else {
          const errorMsg = await res.json();
          alert(`Error: ${errorMsg.error || 'Failed to submit'}`);
        }
      } catch (err) {
        console.error(err);
        alert('Network error.');
      }
    } else {
      // Track New Asset + Transaction
      if (!newAssetName) return alert('Please provide an asset name.');
      const payload = {
        asset: {
          name: newAssetName,
          type: newAssetType,
          category: newAssetCat,
          identifier: newAssetId || undefined
        },
        transaction: txQty && txPrice ? {
          type: txType,
          date: txDate,
          quantity: parseFloat(txQty),
          price: parseFloat(txPrice),
          amount: parseFloat(txAmount)
        } : undefined
      };

      try {
        const res = await fetch('http://localhost:5000/api/transactions/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsOpen(false);
          resetForm();
          fetchTxs();
          fetchAssets();
        } else {
          const errorMsg = await res.json();
          alert(`Error: ${errorMsg.error || 'Failed to bootstrap'}`);
        }
      } catch (err) {
        console.error(err);
        alert('Network error.');
      }
    }
  };

  const resetForm = () => {
    setSelectedAssetId('');
    setTxType('BUY');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxQty('');
    setTxPrice('');
    setTxAmount('');
    setNewAssetName('');
    setNewAssetType('BANK_ACCOUNT');
    setNewAssetCat('Cash');
    setNewAssetId('');
  };

  // Currency formats
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Toggles categories by standard types
  const handleTypeChange = (type: string) => {
    setNewAssetType(type);
    if (type === 'BANK_ACCOUNT') setNewAssetCat('Cash');
    else if (type === 'STOCK' || type === 'MUTUAL_FUND') setNewAssetCat('Equity');
    else if (type === 'BOND' || type === 'EPF') setNewAssetCat('Debt');
    else if (type === 'NPS') setNewAssetCat('Hybrid');
    else setNewAssetCat('Alternative');
  };

  // Filtering
  const filteredTxs = txs.filter((tx) => {
    const matchesSearch = tx.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.identifier && tx.identifier.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter ? tx.type === typeFilter : true;
    const matchesClass = classFilter ? tx.asset_type === classFilter : true;

    return matchesSearch && matchesType && matchesClass;
  });

  const assetLabels: Record<string, string> = {
    MUTUAL_FUND: 'Mutual Fund',
    STOCK: 'Stock',
    NPS: 'NPS Pension',
    EPF: 'EPF (Provident Fund)',
    GOLD: 'Gold Metal',
    BOND: 'Bond',
    PROPERTY: 'Real Estate',
    BANK_ACCOUNT: 'Savings/Cash',
    OTHER: 'Others'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading master ledger entries...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Search and Quick Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between card-glass p-4 rounded-2xl">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search assets, symbols, PRAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111726]/80 text-xs text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all"
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#111726]/80 text-xs text-slate-300 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none cursor-pointer"
            >
              <option value="">All Types (BUY/SELL)</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="REINVEST">REINVEST</option>
              <option value="DIVIDEND">DIVIDEND</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-[#111726]/80 text-xs text-slate-300 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 outline-none cursor-pointer"
            >
              <option value="">All Asset Classes</option>
              {Object.entries(assetLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={() => { resetForm(); setIsOpen(true); }}
          className="flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all w-full md:w-auto justify-center"
        >
          <PlusCircle className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Ledger Table Display */}
      <div className="card-glass p-6 rounded-2xl">
        <h4 className="font-bold text-lg text-slate-100 mb-4 border-b border-slate-800/40 pb-3 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" /> Full Ledger ({filteredTxs.length} items)
        </h4>

        {filteredTxs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No transactions found matching the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/60 pb-2.5 font-bold uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Asset</th>
                  <th className="pb-3">Class</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Units / Quantity</th>
                  <th className="pb-3 text-right">Rate</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Source</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredTxs.map((tx) => {
                  const isBuy = tx.type === 'BUY' || tx.type === 'REINVEST';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/10">
                      <td className="py-3.5 text-slate-300 font-medium whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5">
                        <span className="font-semibold text-slate-200 block truncate max-w-[200px]">{tx.asset_name}</span>
                        {tx.identifier && (
                          <span className="text-[9px] text-slate-500 mt-0.5 block">{tx.identifier}</span>
                        )}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span className="text-slate-400 font-medium">
                          {assetLabels[tx.asset_type] || tx.asset_type}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                          isBuy ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-medium text-slate-300">{tx.quantity.toFixed(4)}</td>
                      <td className="py-3.5 text-right font-medium text-slate-300">{formatCurrency(tx.price)}</td>
                      <td className="py-3.5 text-right font-bold text-slate-200">{formatCurrency(tx.amount)}</td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                          tx.source === 'PDF_IMPORT' ? 'bg-indigo-950/40 text-indigo-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {tx.source === 'PDF_IMPORT' ? 'PDF' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <button 
                          onClick={() => handleDelete(tx.id)}
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

      {/* Manual Insertion Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#04060b]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-glass w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between bg-slate-900/20">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Record Investment
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Wizard Tabs */}
            <div className="flex border-b border-slate-800/40 text-xs">
              <button
                type="button"
                onClick={() => setActiveFormTab('EXISTING')}
                className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                  activeFormTab === 'EXISTING' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Add to Existing Asset
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('NEW')}
                className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                  activeFormTab === 'NEW' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Track Brand New Asset
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {activeFormTab === 'EXISTING' ? (
                /* EXISTING ASSET TAB */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Select Asset</label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      required
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="">-- Choose Asset --</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({assetLabels[a.type] || a.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* BRAND NEW ASSET TAB */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Asset Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Regular Savings"
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        required
                        className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Asset Class</label>
                      <select
                        value={newAssetType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                      >
                        {Object.entries(assetLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Identifier (ISIN / Ticker)</label>
                      <input
                        type="text"
                        placeholder="e.g. RELIANCE.NS, optional"
                        value={newAssetId}
                        onChange={(e) => setNewAssetId(e.target.value)}
                        className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Category exposure</label>
                      <select
                        value={newAssetCat}
                        onChange={(e) => setNewAssetCat(e.target.value)}
                        className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                      >
                        <option value="Equity">Equity</option>
                        <option value="Debt">Debt (Fixed Income)</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Cash">Cash (Liquid)</option>
                        <option value="Alternative">Alternative (Gold, Prop)</option>
                        <option value="Other">Others</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Metrics (Shown in both flows, optional in new asset) */}
              <div className="mt-4 border-t border-slate-800/40 pt-4 space-y-4">
                <h5 className="font-bold text-slate-300">Transaction Details</h5>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Type</label>
                    <select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value)}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                      <option value="REINVEST">REINVEST</option>
                      <option value="DIVIDEND">DIVIDEND</option>
                      <option value="INTEREST">INTEREST</option>
                    </select>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-slate-400 font-semibold block">Trading Date</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      required
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Quantity (Units)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 10"
                      value={txQty}
                      onChange={(e) => setTxQty(e.target.value)}
                      required={activeFormTab === 'EXISTING'}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Unit Price (NAV)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 2450"
                      value={txPrice}
                      onChange={(e) => setTxPrice(e.target.value)}
                      required={activeFormTab === 'EXISTING'}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Total Amount (Rs)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Computed"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required={activeFormTab === 'EXISTING'}
                      className="w-full bg-[#111726]/80 text-slate-200 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 border border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
