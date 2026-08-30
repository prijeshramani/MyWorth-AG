import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  FileText, 
  Target, 
  HelpCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { onboardingCompletenessService } from '../../services/onboardingCompletenessService';
import type { ActionableCompletenessResponse } from '../../types/familyOffice';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completenessData, setCompletenessData] = useState<ActionableCompletenessResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deferredTax, setDeferredTax] = useState<boolean>(false);

  const fetchCompleteness = async () => {
    try {
      setLoading(true);
      const res = await onboardingCompletenessService.getActionableCompleteness();
      setCompletenessData(res);

      // Readiness-driven stage resumption: find earliest incomplete stage
      if (res && res.domainReadiness) {
        const { lineage, balanceSheet, protection, tax, estate, goals } = res.domainReadiness;
        if (!lineage.isReady) {
          setCurrentStep(1);
        } else if (!balanceSheet.isReady) {
          setCurrentStep(2);
        } else if (!protection.isReady || !tax.isReady) {
          setCurrentStep(3);
        } else if (!estate.isReady || !goals.isReady) {
          setCurrentStep(4);
        } else {
          setCurrentStep(1); // Default to review
        }
      }
    } catch (err) {
      console.warn('[OnboardingWizardModal] Failed to fetch completeness:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCompleteness();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const readiness = completenessData?.domainReadiness;

  // Compute Stage 3 sub-statuses (Correction 2)
  const isProtectionComplete = readiness?.protection?.isReady ?? false;
  const isTaxComplete = readiness?.tax?.isReady ?? false;

  const steps = [
    {
      id: 1,
      title: 'Family Lineage',
      description: 'Head of family anchor & members',
      icon: Users,
      isComplete: readiness?.lineage?.isReady ?? false
    },
    {
      id: 2,
      title: 'Balance Sheet',
      description: 'Asset holdings & liquid accounts',
      icon: Briefcase,
      isComplete: (readiness?.balanceSheet?.isReady && readiness?.liquidity?.isReady) ?? false
    },
    {
      id: 3,
      title: 'Protection & Tax',
      description: 'Term/health covers & tax profile',
      icon: ShieldCheck,
      isComplete: isProtectionComplete && (isTaxComplete || deferredTax)
    },
    {
      id: 4,
      title: 'Legacy & Goals',
      description: 'Estate wills & future milestones',
      icon: Target,
      isComplete: (readiness?.estate?.isReady && readiness?.goals?.isReady) ?? false
    }
  ];

  const handleStepAction = (route: string) => {
    onClose();
    onNavigate(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Family Financial Onboarding</h2>
              <p className="text-xs text-slate-400">
                Authoritative multi-pillar baseline setup & digital twin configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Navigator */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-950/50 border-b border-slate-800/50">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  isActive
                    ? 'bg-indigo-600/10 border-indigo-500/40 shadow-lg shadow-indigo-950/40'
                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`p-1.5 rounded-lg text-xs ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  {step.isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-xs text-slate-200">{step.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{step.description}</div>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Analyzing family digital twin completeness...</span>
            </div>
          ) : (
            <>
              {/* Step 1: Lineage & Members */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        Family Lineage & Primary Testator Anchor
                      </h3>
                      {readiness?.lineage?.isReady ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Complete ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Anchor Missing
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Every family requires at least one primary testator / head of family (SELF) to anchor all multi-generational analytics, estate rules, and tax profiles.
                    </p>

                    <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-slate-300 font-medium">Lineage Status: </span>
                        <span className="text-slate-400">{readiness?.lineage?.missingSummary || 'Primary family anchor verified.'}</span>
                      </div>
                      <button
                        onClick={() => handleStepAction('/family')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        Manage Lineage
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Balance Sheet */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                        Balance Sheet & Liquid Reserves
                      </h3>
                      {readiness?.balanceSheet?.isReady && readiness?.liquidity?.isReady ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Complete ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Incomplete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Import your investment portfolio (mutual funds, stocks, fixed deposits) and map primary bank accounts for liquidity runway calculations.
                    </p>

                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-slate-200">Investments</div>
                          <div className="text-[11px] text-slate-400">
                            {readiness?.balanceSheet?.isReady ? 'Holdings recorded' : 'No holdings found'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStepAction('/portfolio')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
                        >
                          Import CAS
                        </button>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-slate-200">Bank & Cash</div>
                          <div className="text-[11px] text-slate-400">
                            {readiness?.liquidity?.isReady ? 'Liquid accounts mapped' : 'Missing bank accounts'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStepAction('/assets/new')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
                        >
                          Add Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Protection & Tax Baseline (Correction 2: Independent Sub-Statuses) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-4">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        Stage 3: Protection Shield & Tax Baseline
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Protection and Tax Baselines are tracked independently to ensure unbiased gap evaluation.
                      </p>
                    </div>

                    {/* Sub-status 1: Protection */}
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-200">Protection Shield</span>
                          {isProtectionComplete ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Complete ✓
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Incomplete
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isProtectionComplete 
                            ? 'Active term / health policies verified.' 
                            : '0 active insurance policies recorded.'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleStepAction('/protection')}
                        className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-all"
                      >
                        Add Policy
                      </button>
                    </div>

                    {/* Sub-status 2: Tax Baseline */}
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-200">Tax Baseline</span>
                          {isTaxComplete ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Complete ✓
                            </span>
                          ) : deferredTax ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Deferred
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Incomplete
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isTaxComplete 
                            ? 'Current FY tax regime configured.' 
                            : (deferredTax 
                                ? 'Tax profile deferred. Next-Best-Action reminders will remain active.' 
                                : 'No tax profile found for current financial year.')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isTaxComplete && (
                          <button
                            onClick={() => setDeferredTax(!deferredTax)}
                            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            {deferredTax ? 'Undefer' : 'Defer for now'}
                          </button>
                        )}
                        <button
                          onClick={() => handleStepAction('/tax/planner')}
                          className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-all"
                        >
                          Setup Tax
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Legacy & Goals */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-400" />
                        Estate Succession & Financial Goals
                      </h3>
                      {readiness?.estate?.isReady && readiness?.goals?.isReady ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Complete ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Enrichment Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Complete your digital twin by recording registered wills / estate trusts and defining your family retirement or milestone goals.
                    </p>

                    <div className="mt-4 grid sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-slate-200">Will / Estate</div>
                          <div className="text-[11px] text-slate-400">
                            {readiness?.estate?.isReady ? 'Will recorded' : 'Missing registered will'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStepAction('/estate')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
                        >
                          Add Will
                        </button>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-slate-200">Financial Goals</div>
                          <div className="text-[11px] text-slate-400">
                            {readiness?.goals?.isReady ? 'Goals defined' : 'No goals defined'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStepAction('/planning')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
                        >
                          Set Goal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Done / Close
            </button>
            {currentStep < 4 && (
              <button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
