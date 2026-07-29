import { SQLiteTaxRepository } from '../repositories/SQLiteTaxRepository';
import { SQLiteFamilyRepository as FamilyRepository } from '../repositories/SQLiteFamilyRepository';
import { TaxCalculationEngine, TaxCalculationResult } from '../engines/tax/TaxCalculationEngine';
import { CapitalGainTaxEngine, CapitalGainResult } from '../engines/tax/CapitalGainTaxEngine';

export interface TaxSummaryDTO {
  familyId: number;
  familyName: string;
  financialYear: string;
  assessmentYear: string;
  taxHealthScore: number;
  grossIncome: number;
  formattedGrossIncome: string;
  oldRegime: TaxCalculationResult;
  newRegime: TaxCalculationResult;
  recommendedRegime: 'OLD' | 'NEW';
  estimatedSavings: number;
  formattedEstimatedSavings: string;
  deductions: Array<{ section: string; claimed: number; maxLimit: number }>;
  capitalGains: CapitalGainResult[];
  recommendations: Array<{ title: string; description: string; estimatedSavings: number; priority: string }>;
  calendarEvents: Array<{ title: string; dueDate: string; category: string }>;
}

export class TaxApplicationService {
  constructor(
    private taxRepo: SQLiteTaxRepository,
    private familyRepo: FamilyRepository
  ) {}

  public getTaxSummary(familyId: number, financialYear: string = '2025-26'): TaxSummaryDTO {
    const family = this.familyRepo.findById(familyId);
    if (!family) {
      throw new Error(`Family with ID ${familyId} not found.`);
    }

    const profile = this.taxRepo.getOrCreateProfile(familyId, financialYear);
    const incomeSources = this.taxRepo.getIncomeSources(familyId, profile.id);
    const deductions = this.taxRepo.getDeductions(familyId, profile.id);

    let grossIncome = incomeSources.reduce((acc, curr) => acc + curr.gross_amount, 0);

    let claimed80C = deductions.find((d) => d.section === '80C')?.claimed_amount || 0;
    let claimed80D = deductions.find((d) => d.section === '80D')?.claimed_amount || 0;
    let claimed80CCD1B = deductions.find((d) => d.section === '80CCD1B')?.claimed_amount || 0;
    let claimed24B = deductions.find((d) => d.section === '24B')?.claimed_amount || 0;

    const calcInput = {
      grossIncome,
      claimed80C,
      claimed80D,
      claimed80CCD1B,
      claimed24B
    };

    const newRegimeRes = TaxCalculationEngine.calculateNewRegimeTax(calcInput);
    const oldRegimeRes = TaxCalculationEngine.calculateOldRegimeTax(calcInput);

    const recommendedRegime = newRegimeRes.totalTaxPayable <= oldRegimeRes.totalTaxPayable ? 'NEW' : 'OLD';
    const estimatedSavings = Math.abs(oldRegimeRes.totalTaxPayable - newRegimeRes.totalTaxPayable);

    const capitalGainsRes: any[] = [];

    const recommendations = grossIncome > 0 ? [
      {
        title: 'Opt for New Tax Regime for FY 2025-26',
        description: `New regime provides ₹${estimatedSavings.toLocaleString('en-IN')} lower tax liability due to expanded slabs and ₹75k standard deduction.`,
        estimatedSavings,
        priority: 'HIGH'
      }
    ] : [];

    const calendarEvents = this.taxRepo.getCalendarEvents().map((e) => ({
      title: e.title,
      dueDate: e.due_date,
      category: e.category
    }));

    return {
      familyId,
      familyName: family.name,
      financialYear,
      assessmentYear: '2026-27',
      taxHealthScore: 88,
      grossIncome,
      formattedGrossIncome: `₹${grossIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      oldRegime: oldRegimeRes,
      newRegime: newRegimeRes,
      recommendedRegime,
      estimatedSavings,
      formattedEstimatedSavings: `₹${estimatedSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      deductions: [
        { section: '80C', claimed: claimed80C, maxLimit: 150000 },
        { section: '80D', claimed: claimed80D, maxLimit: 25000 },
        { section: '80CCD(1B)', claimed: claimed80CCD1B, maxLimit: 50000 },
        { section: '24(b)', claimed: claimed24B, maxLimit: 200000 }
      ],
      capitalGains: capitalGainsRes,
      recommendations,
      calendarEvents
    };
  }
}
