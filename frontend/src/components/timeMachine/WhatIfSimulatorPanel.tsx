import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { timeMachineService } from '../../services/timeMachineService';
import { 
  Sparkles, 
  TrendingUp, 
  Calculator, 
  Target, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { 
  WhatIfScenarioType, 
  WhatIfScenarioInput, 
  WhatIfSimulationResult,
  AssumptionProvenance 
} from '../../types/familyOffice';

interface WhatIfSimulatorPanelProps {
  baselineAsOfDate?: string;
}

const SCENARIOS: Array<{ id: WhatIfScenarioType; label: string; description: string }> = [
  { 
    id: 'RECURRING_SIP_STEP_UP', 
    label: 'Recurring SIP Step-Up', 
    description: 'Model annual percentage step-ups to ongoing mutual fund SIPs.' 
  },
  { 
    id: 'ONE_TIME_LUMP_SUM_INVESTMENT', 
    label: 'One-Time Lump Sum', 
    description: 'Project compounded growth of a windfall or liquidity event.' 
  },
  { 
    id: 'RETIREMENT_AGE_ADJUSTMENT', 
    label: 'Retirement Age Target', 
    description: 'Evaluate corpus required & readiness score at different retirement ages.' 
  },
  { 
    id: 'GOAL_CONTRIBUTION_REALLOCATION', 
    label: 'Goal Reallocation', 
    description: 'Redirect surplus monthly cashflow toward a prioritized financial goal.' 
  },
  { 
    id: 'TAX_REGIME_OPTIMIZATION_SCENARIO', 
    label: 'Tax Regime Optimization', 
    description: 'Simulate Old vs New tax regime benefits with hypothetical 80C & 80CCD deductions.' 
  }
];

const getProvenanceBadge = (prov: AssumptionProvenance) => {
  switch (prov) {
    case 'USER_PROVIDED':
      return <Badge variant="info" size="sm">User Provided</Badge>;
    case 'FAMILY_PROFILE':
      return <Badge variant="primary" size="sm">Family Profile</Badge>;
    case 'SYSTEM_ASSUMPTION':
    default:
      return <Badge variant="warning" size="sm">System Default</Badge>;
  }
};

export const WhatIfSimulatorPanel: React.FC<WhatIfSimulatorPanelProps> = ({ baselineAsOfDate }) => {
  const [selectedScenario, setSelectedScenario] = useState<WhatIfScenarioType>('RECURRING_SIP_STEP_UP');

  // Input states
  const [monthlySip, setMonthlySip] = useState<number>(25000);
  const [stepUpPct, setStepUpPct] = useState<number>(10);
  const [years, setYears] = useState<number>(15);
  const [lumpSum, setLumpSum] = useState<number>(500000);
  const [assumedReturn, setAssumedReturn] = useState<number>(12);
  const [targetAge, setTargetAge] = useState<number>(55);
  const [salaryIncome, setSalaryIncome] = useState<number>(2400000);
  const [deduction80C, setDeduction80C] = useState<number>(150000);
  const [deduction80CCD, setDeduction80CCD] = useState<number>(50000);

  // Simulation Mutation (Calls authoritative backend engine)
  const simulationMutation = useMutation<WhatIfSimulationResult, any, WhatIfScenarioInput>({
    mutationFn: (input) => timeMachineService.simulateWhatIf(input)
  });

  const handleRunSimulation = () => {
    let payload: WhatIfScenarioInput = {
      scenarioType: selectedScenario,
      baselineAsOf: baselineAsOfDate
    };

    switch (selectedScenario) {
      case 'RECURRING_SIP_STEP_UP':
        payload.monthlySipAmount = monthlySip;
        payload.sipStepUpPercent = stepUpPct;
        payload.years = years;
        break;
      case 'ONE_TIME_LUMP_SUM_INVESTMENT':
        payload.lumpSumAmount = lumpSum;
        payload.investmentHorizonYears = years;
        payload.assumedReturnPct = assumedReturn;
        break;
      case 'RETIREMENT_AGE_ADJUSTMENT':
        payload.targetRetirementAge = targetAge;
        break;
      case 'GOAL_CONTRIBUTION_REALLOCATION':
        payload.reallocatedMonthlySip = monthlySip;
        break;
      case 'TAX_REGIME_OPTIMIZATION_SCENARIO':
        payload.salaryIncome = salaryIncome;
        payload.hypothetical80CAmount = deduction80C;
        payload.hypothetical80CCDAmount = deduction80CCD;
        break;
    }

    simulationMutation.mutate(payload);
  };

  const result = simulationMutation.data;

  return (
    <Card variant="glass" className="p-6 border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/5 via-[#15161A] to-[#15161A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-[#2B2E35]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            <h3 className="text-base font-bold text-[#F3F4F6]">What-If Simulation Sandbox</h3>
            <Badge variant="primary" size="sm">0 Database Writes</Badge>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Simulate hypothetical adjustments against current or historical balance sheet state without altering actual records.
          </p>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {SCENARIOS.map((sc) => {
          const active = selectedScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenario(sc.id);
                simulationMutation.reset();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                active
                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/50 shadow-sm'
                  : 'bg-[#1E2025] text-[#9CA3AF] border-[#2B2E35] hover:text-[#F3F4F6]'
              }`}
            >
              {sc.label}
            </button>
          );
        })}
      </div>

      {/* Scenario Controls & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 space-y-4 bg-[#1E2025]/40 p-4 rounded-xl border border-[#2B2E35]">
          <h4 className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
            Scenario Parameters
          </h4>

          {selectedScenario === 'RECURRING_SIP_STEP_UP' && (
            <>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Monthly SIP Amount (₹)</label>
                <input
                  type="number"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#15161A] border border-[#2B2E35] rounded-lg text-xs text-[#F3F4F6] font-mono focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Annual Step-Up (%): {stepUpPct}%</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={stepUpPct}
                  onChange={(e) => setStepUpPct(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Horizon (Years): {years} Years</label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>
            </>
          )}

          {selectedScenario === 'ONE_TIME_LUMP_SUM_INVESTMENT' && (
            <>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Lump Sum Amount (₹)</label>
                <input
                  type="number"
                  value={lumpSum}
                  onChange={(e) => setLumpSum(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#15161A] border border-[#2B2E35] rounded-lg text-xs text-[#F3F4F6] font-mono focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Expected Return (%): {assumedReturn}%</label>
                <input
                  type="range"
                  min="4"
                  max="25"
                  value={assumedReturn}
                  onChange={(e) => setAssumedReturn(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Horizon (Years): {years} Years</label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>
            </>
          )}

          {selectedScenario === 'RETIREMENT_AGE_ADJUSTMENT' && (
            <>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Target Retirement Age: {targetAge} Years</label>
                <input
                  type="range"
                  min="40"
                  max="70"
                  value={targetAge}
                  onChange={(e) => setTargetAge(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Simulates retirement corpus requirements, readiness %, and funding gap adjustments.
              </p>
            </>
          )}

          {selectedScenario === 'GOAL_CONTRIBUTION_REALLOCATION' && (
            <>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Reallocated Monthly SIP (₹)</label>
                <input
                  type="number"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#15161A] border border-[#2B2E35] rounded-lg text-xs text-[#F3F4F6] font-mono focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Redirects monthly surplus toward the primary retirement or family goal.
              </p>
            </>
          )}

          {selectedScenario === 'TAX_REGIME_OPTIMIZATION_SCENARIO' && (
            <>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Gross Salary Income (₹)</label>
                <input
                  type="number"
                  value={salaryIncome}
                  onChange={(e) => setSalaryIncome(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#15161A] border border-[#2B2E35] rounded-lg text-xs text-[#F3F4F6] font-mono focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">80C Deduction (₹)</label>
                <input
                  type="number"
                  max="150000"
                  value={deduction80C}
                  onChange={(e) => setDeduction80C(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#15161A] border border-[#2B2E35] rounded-lg text-xs text-[#F3F4F6] font-mono focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">80CCD(1B) NPS (₹)</label>
                <input
                  type="number"
                  max="50000"
                  value={deduction80CCD}
                  onChange={(e) => setDeduction80CCD(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#15161A] border border-[#2B2E35] rounded-lg text-xs text-[#F3F4F6] font-mono focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
            </>
          )}

          <Button
            variant="primary"
            onClick={handleRunSimulation}
            disabled={simulationMutation.isPending}
            className="w-full text-xs font-bold"
          >
            {simulationMutation.isPending ? 'Simulating...' : 'Run In-Memory Simulation'}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {simulationMutation.isError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Simulation Error</div>
                <div>{simulationMutation.error?.response?.data?.error?.message || 'Unable to execute scenario simulation.'}</div>
              </div>
            </div>
          )}

          {!result && !simulationMutation.isPending && (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-[#1E2025]/30 rounded-xl border border-dashed border-[#2B2E35] text-center">
              <Sparkles className="w-8 h-8 text-[#8B5CF6] mb-2 opacity-60" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Ready to Simulate</h4>
              <p className="text-xs text-[#9CA3AF] max-w-sm mt-1">
                Select your parameters and click "Run In-Memory Simulation" to project outcomes.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Output Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.projectedValue !== undefined && result.projectedValue !== null && (
                  <div className="p-4 rounded-xl bg-[#1E2025] border border-[#2B2E35]">
                    <div className="text-[11px] text-[#9CA3AF] mb-1">Projected Corpus</div>
                    <div className="text-xl font-extrabold text-[#32D583] font-mono">
                      ₹{result.projectedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}

                {result.corpusAtRetirement !== undefined && result.corpusAtRetirement !== null && (
                  <div className="p-4 rounded-xl bg-[#1E2025] border border-[#2B2E35]">
                    <div className="text-[11px] text-[#9CA3AF] mb-1">Corpus At Retirement</div>
                    <div className="text-xl font-extrabold text-[#38BDF8] font-mono">
                      ₹{result.corpusAtRetirement.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}

                {result.readinessPercent !== undefined && result.readinessPercent !== null && (
                  <div className="p-4 rounded-xl bg-[#1E2025] border border-[#2B2E35]">
                    <div className="text-[11px] text-[#9CA3AF] mb-1">Readiness Score</div>
                    <div className="text-xl font-extrabold text-[#4F7FFF] font-mono">
                      {result.readinessPercent.toFixed(1)}%
                    </div>
                  </div>
                )}

                {result.taxSavingsBenefit !== undefined && result.taxSavingsBenefit !== null && (
                  <div className="p-4 rounded-xl bg-[#1E2025] border border-[#2B2E35]">
                    <div className="text-[11px] text-[#9CA3AF] mb-1">Tax Savings Benefit</div>
                    <div className="text-xl font-extrabold text-[#32D583] font-mono">
                      ₹{result.taxSavingsBenefit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}

                {result.optimalRegime && (
                  <div className="p-4 rounded-xl bg-[#1E2025] border border-[#2B2E35]">
                    <div className="text-[11px] text-[#9CA3AF] mb-1">Optimal Tax Regime</div>
                    <div className="text-xl font-extrabold text-[#F79009] font-mono">
                      {result.optimalRegime} REGIME
                    </div>
                  </div>
                )}
              </div>

              {/* Growth Trajectory Schedule Chart */}
              {result.yearlySchedule && result.yearlySchedule.length > 0 && (() => {
                const chartData = result.yearlySchedule.map((pt: any) => ({
                  year: pt.yearNumber ? `Yr ${pt.yearNumber}` : (pt.calendarYear ? `${pt.calendarYear}` : (pt.year ? `Yr ${pt.year}` : 'Yr')),
                  corpusValue: pt.corpusValue ?? pt.totalCorpusProjected ?? 0,
                  investedAmount: pt.investedAmount ?? pt.sipInvestedCumulative ?? pt.lumpSumCompounded ?? 0
                }));

                const formatYAxis = (val: number) => {
                  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
                  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                  return `₹${val}`;
                };

                return (
                  <div className="p-4 rounded-xl bg-[#1E2025] border border-[#2B2E35]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-[#F3F4F6]">Projected Growth Schedule</div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1]" />
                          <span className="text-[#9CA3AF]">Cumulative Invested</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
                          <span className="text-[#9CA3AF]">Projected Corpus</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <XAxis dataKey="year" stroke="#6B7280" fontSize={10} tickLine={false} />
                          <YAxis stroke="#6B7280" fontSize={10} tickFormatter={formatYAxis} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#15161A', borderColor: '#2B2E35', borderRadius: '8px', fontSize: '11px' }}
                            formatter={(value: any, name: string) => [
                              `₹${Number(value).toLocaleString('en-IN')}`,
                              name === 'corpusValue' ? 'Projected Corpus' : 'Cumulative Invested'
                            ]}
                          />
                          <Bar dataKey="investedAmount" fill="#6366F1" radius={[3, 3, 0, 0]} name="investedAmount" />
                          <Bar dataKey="corpusValue" fill="#8B5CF6" radius={[3, 3, 0, 0]} name="corpusValue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}

              {/* Assumption Provenance Card */}
              {result.assumptionsUsed && Object.keys(result.assumptionsUsed).length > 0 && (() => {
                const assumptions = result.assumptionsUsed || {};
                const provenanceMap = assumptions.provenance || {};
                const entries = Object.entries(assumptions).filter(([k]) => k !== 'provenance' && k !== 'baselineLimitations');

                if (entries.length === 0) return null;

                return (
                  <div className="p-4 rounded-xl bg-[#1E2025]/50 border border-[#2B2E35]">
                    <div className="text-xs font-bold text-[#F3F4F6] mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#32D583]" />
                      <span>Assumption Provenance Audit</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {entries.map(([k, rawVal]) => {
                        const prov: AssumptionProvenance = (typeof rawVal === 'object' && rawVal?.provenance)
                          ? rawVal.provenance
                          : (provenanceMap[k] || 'SYSTEM_ASSUMPTION');

                        let valDisplay: string;
                        if (typeof rawVal === 'object' && rawVal !== null && 'value' in (rawVal as any)) {
                          valDisplay = String((rawVal as any).value);
                        } else if (typeof rawVal === 'number') {
                          const num = Number(rawVal);
                          const lowerKey = k.toLowerCase();
                          if (lowerKey.includes('amount') || lowerKey.includes('sip') || lowerKey.includes('income') || lowerKey.includes('corpus') || lowerKey.includes('gain') || lowerKey.includes('benefit')) {
                            valDisplay = `₹${num.toLocaleString('en-IN')}`;
                          } else if (lowerKey.includes('pct') || lowerKey.includes('rate') || lowerKey.includes('percent')) {
                            valDisplay = `${num}%`;
                          } else if (lowerKey.includes('year') || lowerKey.includes('age')) {
                            valDisplay = `${num} Yrs`;
                          } else {
                            valDisplay = String(num);
                          }
                        } else {
                          valDisplay = String(rawVal);
                        }

                        return (
                          <div key={k} className="p-2 rounded-lg bg-[#15161A] border border-[#2B2E35] flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-[#F3F4F6] capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                              <div className="text-[10px] text-[#9CA3AF] font-mono">{valDisplay}</div>
                            </div>
                            {getProvenanceBadge(prov)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
