import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Trash2, CheckCircle, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';

interface AccountItem {
  id: number;
  institutionName: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'DEMAT' | 'NPS' | 'EPF' | 'PPF';
  holderName: string;
  balance: number;
  syncStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

const INITIAL_ACCOUNTS: AccountItem[] = [
  { id: 1, institutionName: 'HDFC Bank', accountNumber: '50100234901', accountType: 'SAVINGS', holderName: 'Rajesh Sharma', balance: 345000, syncStatus: 'CONNECTED' },
  { id: 2, institutionName: 'ICICI Bank', accountNumber: '00040156891', accountType: 'SAVINGS', holderName: 'Priya Sharma', balance: 185000, syncStatus: 'CONNECTED' },
  { id: 3, institutionName: 'Zerodha Kite', accountNumber: '1208160001', accountType: 'DEMAT', holderName: 'Rajesh Sharma', balance: 1270000, syncStatus: 'CONNECTED' },
  { id: 4, institutionName: 'AngelOne SmartAPI', accountNumber: 'ANG-987123', accountType: 'DEMAT', holderName: 'Priya Sharma', balance: 450000, syncStatus: 'CONNECTED' }
];

export const AccountsManager: React.FC = () => {
  const { datasetMode, activeFamilyId } = useUiStore();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAcc, setNewAcc] = useState<Partial<AccountItem>>({
    institutionName: '',
    accountNumber: '',
    accountType: 'SAVINGS',
    holderName: 'Prijesh Ramani',
    balance: 0,
    syncStatus: 'CONNECTED'
  });

  const loadAccounts = () => {
    setLoading(true);
    if (datasetMode === 'DEMO') {
      setAccounts(INITIAL_ACCOUNTS);
      setLoading(false);
    } else {
      apiClient.get<any[]>(`/accounts?familyId=${activeFamilyId}`)
        .then(res => {
          const raw = Array.isArray(res.data) ? res.data : [];
          setAccounts(raw.map((a: any) => ({
            id: a.id,
            institutionName: a.institutionName || a.provider || 'Bank/Broker',
            accountNumber: a.accountNumber || a.maskedAccountNumber || 'N/A',
            accountType: (a.accountType === 'BANK' ? 'SAVINGS' : a.accountType) || 'SAVINGS',
            holderName: a.holderName || a.accountName || 'Prijesh Ramani',
            balance: Number(a.balance) || 0,
            syncStatus: 'CONNECTED'
          })));
        })
        .catch(() => setAccounts([]))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [datasetMode, activeFamilyId]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.institutionName || !newAcc.accountNumber) return;

    try {
      // Get head member for active family
      const membersRes = await apiClient.get<any[]>(`/family/members?familyId=${activeFamilyId}`).catch(() => ({ data: [] }));
      const members = Array.isArray(membersRes.data) ? membersRes.data : [];
      const familyMemberId = members[0]?.id;

      const assetType = newAcc.accountType === 'SAVINGS' ? 'BANK_ACCOUNT' : (newAcc.accountType === 'DEMAT' ? 'STOCK' : newAcc.accountType);
      const category = newAcc.accountType === 'SAVINGS' ? 'Cash' : 'Equity';

      await apiClient.post('/assets', {
        name: newAcc.institutionName,
        type: assetType,
        category,
        identifier: newAcc.accountNumber,
        currentValue: Number(newAcc.balance) || 0,
        familyMemberId
      });
    } catch (err) {
      console.error('Failed to create account asset:', err);
    }

    setShowAddModal(false);
    setNewAcc({ institutionName: '', accountNumber: '', accountType: 'SAVINGS', balance: 0, holderName: 'Prijesh Ramani' });
    loadAccounts();
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/accounts/${id}`);
    } catch (e) {
      try {
        await apiClient.delete(`/assets/${id}`);
      } catch (err) {
        console.error('Failed to delete account:', err);
      }
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">Bank & Demat Accounts</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage savings bank accounts, Demat trading accounts, and API credentials.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account / Broker
        </button>
      </div>

      {/* Accounts Table */}
      <div className="card-glass p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 px-2">Institution</th>
                <th className="pb-3 px-2">Type</th>
                <th className="pb-3 px-2">Account Number</th>
                <th className="pb-3 px-2">Primary Holder</th>
                <th className="pb-3 px-2">Balance / Value</th>
                <th className="pb-3 px-2">Sync Status</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-2 font-bold text-slate-200">{a.institutionName}</td>
                  <td className="py-3 px-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                      {a.accountType}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono text-slate-300">{a.accountNumber}</td>
                  <td className="py-3 px-2 text-slate-300">{a.holderName}</td>
                  <td className="py-3 px-2 font-mono font-semibold text-emerald-400">
                    ₹{a.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-2 font-mono">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> CONNECTED
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddAccount} className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Add Bank or Broker Account</h3>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Institution Name</label>
              <input
                type="text"
                required
                value={newAcc.institutionName}
                onChange={e => setNewAcc({ ...newAcc, institutionName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                placeholder="e.g. Axis Bank / Zerodha"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Account Type</label>
                <select
                  value={newAcc.accountType}
                  onChange={e => setNewAcc({ ...newAcc, accountType: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="SAVINGS">Savings Bank</option>
                  <option value="DEMAT">Demat / Broker</option>
                  <option value="NPS">NPS Account</option>
                  <option value="EPF">EPF Account</option>
                  <option value="PPF">PPF Account</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={newAcc.accountNumber}
                  onChange={e => setNewAcc({ ...newAcc, accountNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
                  placeholder="e.g. 9180100234"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Opening Balance / Value (₹)</label>
              <input
                type="number"
                value={newAcc.balance}
                onChange={e => setNewAcc({ ...newAcc, balance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
              >
                Save Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
