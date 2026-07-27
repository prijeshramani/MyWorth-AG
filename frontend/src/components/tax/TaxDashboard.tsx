import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useTaxSummary } from '../../hooks/useTaxSummary';
import { MetricCard } from '../ui/MetricCard';
import { RiskGauge } from '../ui/RiskGauge';
import { InsightCard } from '../ui/InsightCard';
import { Timeline, type TimelineEvent } from '../ui/Timeline';
import { PageSkeleton } from '../common/PageSkeleton';
import { Calculator, Award, ArrowRightLeft, Calendar, FileText } from 'lucide-react';

export const TaxDashboard: React.FC = () => {
  const { activeFamilyId } = useUiStore();
  const { data: response, isLoading } = useTaxSummary(activeFamilyId);

  if (isLoading) {
    return <PageSkeleton />;
  }

  const taxData = response?.data;

  const timelineEvents: TimelineEvent[] = (taxData?.calendarEvents || []).map((c, idx) => ({
    id: idx.toString(),
    title: c.title,
    timestamp: c.dueDate,
    amount: c.category,
    type: 'VALUATION'
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">Indian Tax Intelligence Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            FY {taxData?.financialYear || '2025-26'} (AY {taxData?.assessmentYear || '2026-27'}) Tax Planning & Optimization Dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Recommended: {taxData?.recommendedRegime} Tax Regime
          </span>
        </div>
      </div>

      {/* 1. Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskGauge
          label="Tax Efficiency Score"
          value={taxData?.taxHealthScore || 88}
          minValue={0}
          maxValue={100}
          ratingLabel="OPTIMAL"
          statusColor="#10b981"
        />

        <MetricCard
          title="Gross Annual Income"
          value={taxData?.formattedGrossIncome || '₹18,00,000.00'}
          subtext="Salary & Investment Incomes"
          changePercent={12.0}
          trend="UP"
          icon={<FileText className="w-4 h-4 text-sky-400" />}
        />

        <MetricCard
          title="Estimated Tax Savings"
          value={taxData?.formattedEstimatedSavings || '₹32,500.00'}
          subtext={`By choosing ${taxData?.recommendedRegime} Regime`}
          changePercent={15.0}
          trend="UP"
          icon={<ArrowRightLeft className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* 2. Old vs New Regime Comparison Table */}
      <div className="card-glass p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-sky-400" />
          Old vs New Regime Liability Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 px-2">Regime</th>
                <th className="pb-3 px-2">Gross Income</th>
                <th className="pb-3 px-2">Total Deductions</th>
                <th className="pb-3 px-2">Net Taxable Income</th>
                <th className="pb-3 px-2">Base Tax + Cess</th>
                <th className="pb-3 px-2">Effective Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <tr className={taxData?.recommendedRegime === 'NEW' ? 'bg-emerald-500/5 font-semibold' : ''}>
                <td className="py-3 px-2 text-slate-200">
                  New Regime {taxData?.recommendedRegime === 'NEW' && <span className="ml-2 text-[10px] text-emerald-400 font-bold">(RECOMMENDED)</span>}
                </td>
                <td className="py-3 px-2 font-mono">₹{taxData?.newRegime.grossTotalIncome.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono text-slate-400">₹{taxData?.newRegime.totalDeductions.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono">₹{taxData?.newRegime.netTaxableIncome.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono text-emerald-400 font-bold">₹{taxData?.newRegime.totalTaxPayable.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono">{taxData?.newRegime.effectiveTaxRatePercent.toFixed(2)}%</td>
              </tr>
              <tr className={taxData?.recommendedRegime === 'OLD' ? 'bg-emerald-500/5 font-semibold' : ''}>
                <td className="py-3 px-2 text-slate-200">
                  Old Regime {taxData?.recommendedRegime === 'OLD' && <span className="ml-2 text-[10px] text-emerald-400 font-bold">(RECOMMENDED)</span>}
                </td>
                <td className="py-3 px-2 font-mono">₹{taxData?.oldRegime.grossTotalIncome.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono text-sky-400">₹{taxData?.oldRegime.totalDeductions.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono">₹{taxData?.oldRegime.netTaxableIncome.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono text-slate-300">₹{taxData?.oldRegime.totalTaxPayable.toLocaleString('en-IN')}</td>
                <td className="py-3 px-2 font-mono">{taxData?.oldRegime.effectiveTaxRatePercent.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Section 80C / 80D Deduction Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-glass p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Deduction Tracker (Old Regime)
          </h3>
          <div className="space-y-4">
            {(taxData?.deductions || []).map((d) => (
              <div key={d.section} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-200 font-semibold">Section {d.section}</span>
                  <span className="text-slate-400">₹{d.claimed.toLocaleString('en-IN')} / ₹{d.maxLimit.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (d.claimed / d.maxLimit) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Optimization Recommendations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tax Optimization Recommendations
          </h3>
          {(taxData?.recommendations || []).map((r, i) => (
            <InsightCard
              key={i}
              type={r.priority === 'HIGH' ? 'GAIN' : 'INFO'}
              title={r.title}
              message={r.description}
              actionText={`Est. Savings: ₹${r.estimatedSavings.toLocaleString('en-IN')}`}
            />
          ))}
        </div>
      </div>

      {/* 5. Tax Compliance Calendar */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          Tax Compliance & Advance Tax Calendar
        </h3>
        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
};
