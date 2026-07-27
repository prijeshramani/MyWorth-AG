import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { Check, ArrowRight, ArrowLeft, ShieldCheck, Users, Landmark, FileUp, ShieldAlert, Calculator, FileText, LayoutDashboard } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { onboardingStep, setOnboardingStep, setIsOnboardingComplete, setActiveTab } = useUiStore();
  const [familyName, setFamilyName] = useState('Sharma Family Office');
  const [memberCount, setMemberCount] = useState(3);

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

        {onboardingStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 2: Add Family Members</h3>
            <p className="text-xs text-slate-400">Configure family members, roles, and KYC credentials.</p>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-2">
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>Rajesh Sharma (Head)</span>
                <span className="text-emerald-400">PAN: ABCDE1234F</span>
              </div>
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>Priya Sharma (Spouse)</span>
                <span className="text-emerald-400">PAN: FGHIJ5678K</span>
              </div>
            </div>
          </div>
        )}

        {onboardingStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 3: Connect Savings & Demat Accounts</h3>
            <p className="text-xs text-slate-400">Link your primary savings bank and Demat broker accounts.</p>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300">
              HDFC Bank Savings A/c (•••• 4901) & Zerodha Demat Connected.
            </div>
          </div>
        )}

        {onboardingStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 4: Broker & Statement Import</h3>
            <p className="text-xs text-slate-400">Import portfolio transactions using CAMS CAS, NSDL/CDSL, Excel, or Broker APIs.</p>
            <button
              onClick={() => setActiveTab('import')}
              className="px-3 py-1.5 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded text-xs font-semibold"
            >
              Open Import Center
            </button>
          </div>
        )}

        {onboardingStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 5: Protection & Insurance Setup</h3>
            <p className="text-xs text-slate-400">Configure Term, Health, and Endowment insurance policies.</p>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300">
              Max Life Term Plan (₹1.0 Cr Sum Assured) Recorded.
            </div>
          </div>
        )}

        {onboardingStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 6: Configure Tax Profile</h3>
            <p className="text-xs text-slate-400">Set residential status, age category, and preferred tax regime (Old vs New).</p>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300">
              FY 2025-26 Preferred Regime: NEW TAX REGIME (Recommended).
            </div>
          </div>
        )}

        {onboardingStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Step 7: Upload Identity & Tax Documents</h3>
            <p className="text-xs text-slate-400">Store PAN cards, policy documents, and tax acknowledgements in Document Vault.</p>
            <button
              onClick={() => setActiveTab('documents')}
              className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded text-xs font-semibold"
            >
              Open Document Vault
            </button>
          </div>
        )}

        {onboardingStep === 8 && (
          <div className="space-y-4 text-center py-4">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-100">Workspace Setup Complete!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your family wealth workspace is fully configured and ready for daily wealth management.
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
