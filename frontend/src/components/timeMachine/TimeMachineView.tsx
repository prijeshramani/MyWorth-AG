import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '../layout/PageShell';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CardSkeleton } from '../ui/Skeleton';
import { timeMachineService } from '../../services/timeMachineService';
import { HistoricalBalanceSheet } from './HistoricalBalanceSheet';
import { ReconstructedHoldingsTable } from './ReconstructedHoldingsTable';
import { WhatIfSimulatorPanel } from './WhatIfSimulatorPanel';
import { 
  Clock, 
  Calendar, 
  RefreshCw, 
  AlertCircle, 
  Sliders,
  ChevronDown
} from 'lucide-react';
import type { TimeMachineReconstruction } from '../../types/familyOffice';

export const TimeMachineView: React.FC = () => {
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 1);
  const defaultDateStr = defaultDate.toISOString().slice(0, 10);

  const [asOfDate, setAsOfDate] = useState<string>(defaultDateStr);
  const [selectedPreset, setSelectedPreset] = useState<string>('1_YEAR_AGO');
  const [activeTab, setActiveTab] = useState<'RECONSTRUCTION' | 'WHAT_IF'>('RECONSTRUCTION');

  // Read-only historical reconstruction query
  const { data: reconstruction, isLoading, error, refetch } = useQuery<TimeMachineReconstruction>({
    queryKey: ['timeMachineReconstruction', asOfDate],
    queryFn: () => timeMachineService.reconstruct(asOfDate)
  });

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();
    if (preset === '1_YEAR_AGO') {
      now.setFullYear(now.getFullYear() - 1);
      setAsOfDate(now.toISOString().slice(0, 10));
    } else if (preset === 'FY24_END') {
      setAsOfDate('2024-03-31');
    } else if (preset === 'FY23_END') {
      setAsOfDate('2023-03-31');
    }
  };

  return (
    <PageShell
      title="Financial Time Machine & What-If Sandbox"
      subtitle="Point-in-time balance sheet reconstruction and zero-write scenario modeling"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1E2025] p-0.5 rounded-xl border border-[#2B2E35]">
            <button
              onClick={() => setActiveTab('RECONSTRUCTION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'RECONSTRUCTION'
                  ? 'bg-[#4F7FFF] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5" />
              Time Machine
            </button>
            <button
              onClick={() => setActiveTab('WHAT_IF')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'WHAT_IF'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 inline mr-1.5" />
              What-If Sandbox
            </button>
          </div>
        </div>
      }
    >
      {/* Historical Date Picker Bar */}
      <div className="bg-[#15161A] p-4 rounded-xl border border-[#2B2E35] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F3F4F6]">
            <Calendar className="w-4 h-4 text-[#4F7FFF]" />
            <span>As-Of Date:</span>
          </div>
          <input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={asOfDate}
            onChange={(e) => {
              setAsOfDate(e.target.value);
              setSelectedPreset('CUSTOM');
            }}
            className="px-3 py-1.5 bg-[#1E2025] border border-[#2B2E35] rounded-xl text-xs text-[#F3F4F6] font-mono focus:border-[#4F7FFF] focus:outline-none"
          />

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => handlePresetSelect('1_YEAR_AGO')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                selectedPreset === '1_YEAR_AGO'
                  ? 'bg-[#4F7FFF]/20 text-[#4F7FFF] border-[#4F7FFF]/40 font-semibold'
                  : 'bg-[#1E2025] text-[#9CA3AF] border-[#2B2E35]'
              }`}
            >
              1 Year Ago
            </button>
            <button
              onClick={() => handlePresetSelect('FY24_END')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                selectedPreset === 'FY24_END'
                  ? 'bg-[#4F7FFF]/20 text-[#4F7FFF] border-[#4F7FFF]/40 font-semibold'
                  : 'bg-[#1E2025] text-[#9CA3AF] border-[#2B2E35]'
              }`}
            >
              FY 23-24 (Mar 31)
            </button>
            <button
              onClick={() => handlePresetSelect('FY23_END')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                selectedPreset === 'FY23_END'
                  ? 'bg-[#4F7FFF]/20 text-[#4F7FFF] border-[#4F7FFF]/40 font-semibold'
                  : 'bg-[#1E2025] text-[#9CA3AF] border-[#2B2E35]'
              }`}
            >
              FY 22-23 (Mar 31)
            </button>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => refetch()}
          className="text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reconstruct State
        </Button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'RECONSTRUCTION' && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <Card variant="glass" className="p-8 text-center border-rose-500/30">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Reconstruction Failed</h4>
              <p className="text-xs text-[#9CA3AF] my-2">{(error as any)?.message || 'Unable to reconstruct historical state.'}</p>
              <Button variant="primary" onClick={() => refetch()} className="text-xs mt-2">
                Retry Reconstruction
              </Button>
            </Card>
          ) : reconstruction ? (
            <>
              <HistoricalBalanceSheet reconstruction={reconstruction} />
              <ReconstructedHoldingsTable holdings={reconstruction.holdings} />
            </>
          ) : null}
        </>
      )}

      {activeTab === 'WHAT_IF' && (
        <WhatIfSimulatorPanel baselineAsOfDate={asOfDate} />
      )}
    </PageShell>
  );
};
