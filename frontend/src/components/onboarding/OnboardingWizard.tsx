import React, { useState, useEffect } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { apiClient } from '../../services/apiClient';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Users, 
  Landmark, 
  FileUp, 
  ShieldAlert, 
  Calculator, 
  FileText, 
  LayoutDashboard,
  Plus,
  Loader2,
  X
} from 'lucide-react';

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  pan?: string;
  email?: string;
  phone?: string;
}

interface AccountItem {
  id: number;
  account_name: string;
  institution_name: string;
  account_type: string;
  account_number_masked?: string;
}

interface InsurancePolicyItem {
  id: number;
  policy_number: string;
  provider_name: string;
  policy_type: string;
  sum_assured: number;
}

export const OnboardingWizard: React.FC = () => {
  const { 
    activeFamilyId, 
    datasetMode, 
    onboardingStep, 
    setOnboardingStep, 
    setIsOnboardingComplete, 
    setActiveTab 
  } = useUiStore();

  const [familyName, setFamilyName] = useState('My Family Wealth Office');
  
  // Real entity states
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicyItem[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Inline Member Form state
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelationship, setNewMemberRelationship] = useState('Spouse');
  const [newMemberPan, setNewMemberPan] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Inline Account Form state
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newBankName, setNewBankName] = useState('HDFC Bank');
  const [newAccountType, setNewAccountType] = useState('SAVINGS');
  const [addingAccount, setAddingAccount] = useState(false);

  // Fetch real database entities
  const fetchEntities = async () => {
    setLoadingEntities(true);
    try {
      if (datasetMode === 'DEMO') {
        setMembers([
          { id: 1, name: 'Rajesh Sharma', relationship: 'Head', pan: 'ABCDE1234F' },
          { id: 2, name: 'Priya Sharma', relationship: 'Spouse', pan: 'FGHIJ5678K' }
        ]);
        setAccounts([
          { id: 101, account_name: 'HDFC Wealth Savings', institution_name: 'HDFC Bank', account_type: 'SAVINGS', account_number_masked: '•••• 4901' }
        ]);
        setPolicies([
          { id: 201, policy_number: 'POL-9921', provider_name: 'Max Life Insurance', policy_type: 'TERM_LIFE', sum_assured: 10000000 }
        ]);
      } else {
        // Fetch Real Family Members
        const memRes = await apiClient.get<any[]>(`/family-members?familyId=${activeFamilyId}`).catch(() => ({ data: [] }));
        const rawMem = Array.isArray(memRes.data) ? memRes.data : [];
        setMembers(rawMem.map((m: any) => ({
          id: m.id,
          name: m.name,
          relationship: m.relationship || 'Member',
          pan: m.pan || m.pan_number || 'NOT_PROVIDED'
        })));

        // Fetch Real Bank Accounts
        const accRes = await apiClient.get<any[]>(`/accounts?familyId=${activeFamilyId}`).catch(() => ({ data: [] }));
        const rawAcc = Array.isArray(accRes.data) ? accRes.data : [];
        setAccounts(rawAcc);

        // Fetch Real Policies
        const polRes = await apiClient.get<any[]>(`/insurance/policies?familyId=${activeFamilyId}`).catch(() => ({ data: [] }));
        const rawPol = Array.isArray(polRes.data) ? polRes.data : [];
        setPolicies(rawPol);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingEntities(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [activeFamilyId, datasetMode]);

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    setMemberError(null);

    if (datasetMode === 'DEMO') {
      const item: FamilyMember = {
        id: Date.now(),
        name: newMemberName.trim(),
        relationship: newMemberRelationship,
        pan: newMemberPan.toUpperCase() || 'NOT_PROVIDED'
      };
      setMembers([...members, item]);
      setAddingMember(false);
      setShowMemberForm(false);
      setNewMemberName('');
      setNewMemberPan('');
      return;
    }

    try {
      await apiClient.post('/family-members', {
        familyId: activeFamilyId,
        family_id: activeFamilyId,
        name: newMemberName.trim(),
        relationship: newMemberRelationship === 'Head' ? 'SELF' : newMemberRelationship.toUpperCase(),
        dateOfBirth: '1990-01-01',
        date_of_birth: '1990-01-01'
      });
      setShowMemberForm(false);
      setNewMemberName('');
      setNewMemberPan('');
      await fetchEntities();
    } catch (err: any) {
      console.error('Error creating family member:', err);
      setMemberError(err.response?.data?.error?.message || err.message || 'Failed to add family member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    setAddingAccount(true);

    if (datasetMode === 'DEMO') {
      setAccounts([...accounts, {
        id: Date.now(),
        account_name: newAccountName.trim(),
        institution_name: newBankName,
        account_type: newAccountType,
        account_number_masked: '•••• 1234'
      }]);
      setAddingAccount(false);
      setShowAccountForm(false);
      setNewAccountName('');
      return;
    }

    try {
      await apiClient.post('/v1/accounts', {
        familyId: activeFamilyId,
        accountName: newAccountName.trim(),
        institutionName: newBankName,
        accountType: newAccountType,
        currency: 'INR'
      });
      setShowAccountForm(false);
      setNewAccountName('');
      await fetchEntities();
    } catch {
      // Ignored
    } finally {
      setAddingAccount(false);
    }
  };

  const steps = [
    { num: 1, title: 'Family Setup', icon: <ShieldCheck className="w-4 h-4" /> },
    { num: 2, title: 'Add Members', icon: <Users className="w-4 h-4" /> },
    { num: 3, title: 'Bank Accounts', icon: <Landmark className="w-4 h-4" /> },
    { num: 4, title: 'Broker / Statement Import', icon: <FileUp className="w-4 h-4" /> },
    { num: 5, title: 'Insurance Policies', icon: <ShieldAlert className="w-4 h-4" /> },
    { num: 6, title: 'Tax Profile', icon: <Calculator className="w-4 h-4" /> },
    { num: 7, title: 'Document Upload', icon: <FileText className="w-4 h-4" /> },
    { num: 8, title: 'Dashboard Ready', icon: <LayoutDashboard className="w-4 h-4" /> }
  ];

  const handleNext = () => {
    if (onboardingStep < 8) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setIsOnboardingComplete(true);
      setActiveTab('dashboard');
    }
  };

  const handlePrev = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Step Stepper Header */}
      <div className="card-glass p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-2">Welcome to FamilyWealthOS Onboarding</h2>
        <p className="text-xs text-slate-400 mb-6">Complete these 8 steps to set up your family wealth workspace.</p>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setOnboardingStep(s.num)}
              className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                onboardingStep === s.num
                  ? 'bg-sky-600/20 text-sky-400 border-sky-500/40 font-bold'
                  : onboardingStep > s.num
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {onboardingStep > s.num ? <Check className="w-4 h-4 text-emerald-400" /> : s.icon}
              </div>
              <span className="text-[10px] block truncate">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card-glass p-8 space-y-6">
        {/* Step 1: Family Setup */}
        {onboardingStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 1: Family Entity Setup</h3>
            <p className="text-xs text-slate-400">Specify the name of your family wealth office entity.</p>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Family Entity Name</label>
              <input
                type="text"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 max-w-md"
              />
            </div>
          </div>
        )}

        {/* Step 2: Add Family Members (REAL Data & Inline Add Form) */}
        {onboardingStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Step 2: Add Family Members</h3>
                <p className="text-xs text-slate-400">Configure family members, roles, and KYC credentials.</p>
              </div>
              <button
                onClick={() => setShowMemberForm(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Family Member
              </button>
            </div>

            {/* List of Real Members */}
            {members.length === 0 ? (
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg text-center space-y-2">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">No family members added yet.</p>
                <p className="text-[11px] text-slate-400">Click "+ Add Family Member" to register your family members.</p>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-2.5">
                {members.map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-slate-200 border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold">{m.name}</span>
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 capitalize font-mono">
                        {m.relationship}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px]">PAN: {m.pan}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add Member Modal */}
            {showMemberForm && (
              <form onSubmit={handleAddMemberSubmit} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-100">Add New Family Member</h4>
                  <button type="button" onClick={() => setShowMemberForm(false)} className="text-slate-400 hover:text-slate-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {memberError && (
                  <div className="p-2 text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                    {memberError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Relationship</label>
                    <select
                      value={newMemberRelationship}
                      onChange={e => setNewMemberRelationship(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                    >
                      <option value="Head">Head (Primary Owner)</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">PAN Number (Optional)</label>
                    <input
                      type="text"
                      value={newMemberPan}
                      onChange={e => setNewMemberPan(e.target.value)}
                      placeholder="ABCDE1234F"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowMemberForm(false)} className="px-3 py-1 text-xs text-slate-400">Cancel</button>
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="px-3.5 py-1 bg-sky-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                  >
                    {addingMember && <Loader2 className="w-3 h-3 animate-spin" />}
                    {addingMember ? 'Saving...' : 'Save Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 3: Connect Savings & Demat Accounts */}
        {onboardingStep === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Step 3: Connect Savings & Demat Accounts</h3>
                <p className="text-xs text-slate-400">Link your primary savings bank and Demat broker accounts.</p>
              </div>
              <button
                onClick={() => setShowAccountForm(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Account
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg text-center space-y-2">
                <Landmark className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">No bank accounts or Demat accounts linked yet.</p>
                <button
                  onClick={() => setActiveTab('accounts')}
                  className="px-3 py-1 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded text-xs font-semibold"
                >
                  Manage Accounts in Console
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-2">
                {accounts.map(a => (
                  <div key={a.id} className="flex justify-between items-center text-slate-200">
                    <span className="font-bold">{a.account_name} ({a.institution_name})</span>
                    <span className="font-mono text-sky-400">{a.account_type}</span>
                  </div>
                ))}
              </div>
            )}

            {showAccountForm && (
              <form onSubmit={handleAddAccountSubmit} className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-100">Link New Bank Account</h4>
                  <button type="button" onClick={() => setShowAccountForm(false)} className="text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Account Display Name</label>
                    <input
                      type="text"
                      required
                      value={newAccountName}
                      onChange={e => setNewAccountName(e.target.value)}
                      placeholder="e.g. HDFC Primary Wealth"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Institution Bank</label>
                    <input
                      type="text"
                      value={newBankName}
                      onChange={e => setNewBankName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Type</label>
                    <select
                      value={newAccountType}
                      onChange={e => setNewAccountType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100"
                    >
                      <option value="SAVINGS">Savings Account</option>
                      <option value="DEMAT">Demat / Trading</option>
                      <option value="MUTUAL_FUND">MF Folio</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAccountForm(false)} className="px-3 py-1 text-xs text-slate-400">Cancel</button>
                  <button type="submit" disabled={addingAccount} className="px-3.5 py-1 bg-sky-600 text-white rounded text-xs font-semibold">
                    {addingAccount ? 'Linking...' : 'Link Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 4: Broker & Statement Import */}
        {onboardingStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 4: Broker & Statement Import</h3>
            <p className="text-xs text-slate-400">Import portfolio transactions using CAMS CAS, NSDL/CDSL, Excel, or Broker APIs.</p>
            <button
              onClick={() => setActiveTab('import')}
              className="px-3.5 py-2 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded text-xs font-semibold flex items-center gap-1.5"
            >
              <FileUp className="w-4 h-4" /> Open Import Center
            </button>
          </div>
        )}

        {/* Step 5: Insurance Policies */}
        {onboardingStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 5: Protection & Insurance Setup</h3>
            <p className="text-xs text-slate-400">Configure Term, Health, and Endowment insurance policies.</p>
            {policies.length === 0 ? (
              <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">No insurance policies recorded yet in database.</p>
                <button
                  onClick={() => setActiveTab('protection')}
                  className="px-3 py-1 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded text-xs font-semibold"
                >
                  Open Protection Dashboard
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-2">
                {policies.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-slate-200">
                    <span>{p.provider_name} ({p.policy_type})</span>
                    <span className="font-mono text-emerald-400">Cover: ₹{p.sum_assured.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Configure Tax Profile */}
        {onboardingStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 6: Configure Tax Profile</h3>
            <p className="text-xs text-slate-400">Set residential status, age category, and preferred tax regime (Old vs New).</p>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span>FY 2025-26 Preferred Tax Regime:</span>
                <span className="font-bold text-emerald-400">NEW TAX REGIME (Recommended)</span>
              </div>
              <button
                onClick={() => setActiveTab('tax')}
                className="mt-2 px-3 py-1 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded text-xs font-semibold"
              >
                Review Tax Intelligence Console
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Upload Identity & Tax Documents */}
        {onboardingStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 7: Upload Identity & Tax Documents</h3>
            <p className="text-xs text-slate-400">Store PAN cards, policy documents, and tax acknowledgements in Document Vault.</p>
            <button
              onClick={() => setActiveTab('documents')}
              className="px-3.5 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded text-xs font-semibold flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Open Document Vault
            </button>
          </div>
        )}

        {/* Step 8: Dashboard Ready */}
        {onboardingStep === 8 && (
          <div className="space-y-4 text-center py-4">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-100">Workspace Setup Complete!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your family wealth workspace is configured with {members.length} registered member(s) and {accounts.length} linked account(s).
            </p>
          </div>
        )}

        {/* Stepper Footer Controls */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={onboardingStep === 1}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <span>{onboardingStep === 8 ? 'Finish & Open Dashboard' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
