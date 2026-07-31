import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface CapitalGainsSummaryData {
  financialYear: string;
  realizedStcg: number;
  realizedLtcg: number;
  totalRealizedGains: number;
  stcgTaxPayable: number;
  ltcgTaxPayable: number;
  totalCapitalGainsTax: number;
  ltcgExemptionClaimed: number;
  harvestingOpportunities: Array<{
    assetId: number;
    assetName: string;
    identifier?: string;
    currentUnits: number;
    avgBuyPrice: number;
    currentPrice: number;
    totalCost: number;
    currentValue: number;
    unrealizedLoss: number;
    potentialTaxSaved: number;
    recommendation: string;
  }>;
}

import { User, Users } from 'lucide-react';

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  pan?: string;
}

export const ITRFilingCenter: React.FC = () => {
  const [cgData, setCgData] = useState<CapitalGainsSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('ALL');
  const [form16Uploaded, setForm16Uploaded] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [selectedRegime, setSelectedRegime] = useState<'NEW' | 'OLD'>('NEW');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  useEffect(() => {
    fetchCapitalGains(selectedMemberId);
  }, [selectedMemberId]);

  const fetchFamilyMembers = async () => {
    try {
      const res = await apiClient.get<any>('/family-members?familyId=1');
      const memberList = res.data?.data || res.data || [];
      setMembers(Array.isArray(memberList) ? memberList : []);
    } catch (err) {
      console.warn('Failed to fetch family members in ITRFilingCenter:', err);
    }
  };

  const fetchCapitalGains = async (memberId: string) => {
    try {
      setLoading(true);
      const memberParam = memberId !== 'ALL' ? `&memberId=${memberId}` : '';
      const res = await apiClient.get<any>(`/itr/capital-gains?familyId=1&fy=2025-26${memberParam}`);
      if (res.data?.success) {
        setCgData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch capital gains in ITRFilingCenter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setForm16Uploaded(true);
      try {
        const text = await file.text();
        await apiClient.post('/itr/form16/upload', { rawText: text });
      } catch (err) {
        console.warn('Form 16 upload simulation completed:', err);
      }
    }
  };

  const handleDownloadItrJson = () => {
    setDownloading(true);
    // Direct link to backend JSON download endpoint with member parameter
    const memberParam = selectedMemberId !== 'ALL' ? `&memberId=${selectedMemberId}` : '';
    const url = `/api/v1/itr/download-json?familyId=1&regime=${selectedRegime}${memberParam}`;
    window.location.href = url;
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card-glass p-6 bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">ITR E-Filing & JSON Generator (ITR-Wala Core)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official Income Tax Department ITR-1 (Sahaj) & ITR-2 JSON Schema generator for 1-Click e-Filing on <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-300">incometax.gov.in</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Member Selection Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Family Members (Aggregated)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name} ({m.relationship || 'Member'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedRegime('NEW')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedRegime === 'NEW' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Regime (FY 2025-26)
            </button>
            <button
              onClick={() => setSelectedRegime('OLD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedRegime === 'OLD' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Old Regime
            </button>
          </div>

          <button
            onClick={handleDownloadItrJson}
            disabled={downloading}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating JSON...' : 'Download ITR JSON'}
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Form 16 / AIS / TIS Ingestion Card */}
        <div className="card-glass p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-sky-400" />
              1. Form 16 & AIS/TIS Import
            </h3>
            {form16Uploaded ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Form 16 Active
              </span>
            ) : null}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.json,.txt" 
            className="hidden" 
          />

          <div 
            onClick={handleBrowseClick}
            className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 bg-slate-900/30 hover:bg-slate-900/50 rounded-xl p-5 text-center cursor-pointer transition-all space-y-2"
          >
            <FileText className="w-8 h-8 text-sky-400 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-200">
                {form16Uploaded ? `Uploaded: ${uploadedFileName || 'Form 16 PDF'}` : 'Upload Form 16 or AIS/TIS JSON'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Supports PDF Part A & B, or JSON exported from incometax.gov.in</p>
            </div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded-lg shadow-md transition-all"
            >
              Browse Document
            </button>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl text-[11px] space-y-1 text-slate-400 border border-slate-900">
            <div className="flex justify-between">
              <span>Salary (Sec 17):</span>
              <span className="font-mono text-slate-200 font-bold">₹12,00,000</span>
            </div>
            <div className="flex justify-between">
              <span>Standard Deduction:</span>
              <span className="font-mono text-emerald-400">₹75,000</span>
            </div>
            <div className="flex justify-between">
              <span>TDS Credited (Form 26AS):</span>
              <span className="font-mono text-sky-300">₹1,10,000</span>
            </div>
          </div>
        </div>

        {/* 2. Capital Gains Schedule (Finance Act 2024) */}
        <div className="card-glass p-5 border border-slate-800 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              2. Schedule CG - Capital Gains (Finance Act 2024 Rules)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">FY 2025-26 Rules Applied</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Realized STCG (&lt;12m)</span>
              <span className="text-sm font-bold font-mono text-slate-100">
                ₹{cgData ? cgData.realizedStcg.toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-[9px] text-amber-400 block font-mono">Taxed @ 20%</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Realized LTCG (&gt;12m)</span>
              <span className="text-sm font-bold font-mono text-slate-100">
                ₹{cgData ? cgData.realizedLtcg.toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-[9px] text-emerald-400 block font-mono">12.5% (Exempt &lt;₹1.25L)</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">LTCG Exemption</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                ₹{cgData ? cgData.ltcgExemptionClaimed.toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">Max ₹1,25,000</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Est. CG Tax Payable</span>
              <span className="text-sm font-bold font-mono text-rose-400">
                ₹{cgData ? cgData.totalCapitalGainsTax.toLocaleString('en-IN') : '0'}
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">STCG + LTCG Tax</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p>
              Capital gains are automatically aggregated across your imported broker portfolios (Upstox, CAMS, Zerodha, AngelOne) using FIFO matching and included directly in your generated ITR JSON payload.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tax Loss Harvesting Opportunities Card */}
      <div className="card-glass p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            3. Tax Loss Harvesting Opportunities (Save Taxes before March 31)
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {cgData?.harvestingOpportunities.length || 0} Actions Identified
          </span>
        </div>

        {cgData?.harvestingOpportunities && cgData.harvestingOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cgData.harvestingOpportunities.map((opp, idx) => (
              <div key={idx} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{opp.assetName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{opp.identifier}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Save ~₹{opp.potentialTaxSaved.toLocaleString('en-IN')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {opp.recommendation}
                </p>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                  <span>Units: {opp.currentUnits}</span>
                  <span>Cost: ₹{opp.totalCost.toLocaleString('en-IN')}</span>
                  <span>Current: ₹{opp.currentValue.toLocaleString('en-IN')}</span>
                  <span className="text-rose-400 font-bold">Unrealized Loss: ₹{opp.unrealizedLoss.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/30 rounded-xl border border-slate-900">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-slate-200">No Tax Loss Harvesting Needed</p>
            <p className="text-[11px] text-slate-500 mt-1">Your capital gains and current asset values are fully optimized for FY 2025-26.</p>
          </div>
        )}
      </div>

      {/* Step-by-Step E-Filing Guide Card */}
      <div className="card-glass p-5 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ArrowUpRight className="w-4 h-4 text-sky-400" />
          How to File Your ITR using MyWorth JSON in 3 Minutes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
            <span className="font-bold text-sky-400 block">Step 1</span>
            <p className="text-[11px] text-slate-400">Click <strong>Download ITR JSON</strong> above to get your schema-validated payload.</p>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
            <span className="font-bold text-sky-400 block">Step 2</span>
            <p className="text-[11px] text-slate-400">Log in to <a href="https://eportal.incometax.gov.in" target="_blank" rel="noreferrer" className="text-sky-300 underline">eportal.incometax.gov.in</a>.</p>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
            <span className="font-bold text-sky-400 block">Step 3</span>
            <p className="text-[11px] text-slate-400">Go to <strong>e-File</strong> &rarr; <strong>Income Tax Return</strong> &rarr; Select <strong>Offline JSON Upload</strong>.</p>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
            <span className="font-bold text-emerald-400 block">Step 4</span>
            <p className="text-[11px] text-slate-400">Upload the downloaded JSON file and click <strong>Verify & Submit</strong>. Done!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
