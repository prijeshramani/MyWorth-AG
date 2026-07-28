import { SQLiteEstateRepository } from '../repositories/SQLiteEstateRepository';

export interface SimulationResultDTO {
  scenarioName: string;
  deceasedPersonName: string;
  totalEstateValue: number;
  formattedTotalEstateValue: string;
  distributions: Array<{ beneficiaryName: string; relationship: string; percentage: number; estimatedValue: string }>;
  executorActions: string[];
  requiredDocuments: string[];
  taxImpactEstimate: string;
  riskHighlights: string[];
}

export class EstateSimulationService {
  constructor(private estateRepo: SQLiteEstateRepository) {}

  public runDeathScenarioSimulation(familyId: number, scenario: string = 'TESTATOR_DECEASED'): SimulationResultDTO {
    const profile = this.estateRepo.getOrCreateProfile(familyId);
    const totalValue = profile.estate_value || 15000000;

    return {
      scenarioName: 'Testator Primary Succession Scenario',
      deceasedPersonName: 'Rajesh Sharma (Head of Family)',
      totalEstateValue: totalValue,
      formattedTotalEstateValue: `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      distributions: [
        { beneficiaryName: 'Priya Sharma', relationship: 'Spouse', percentage: 50, estimatedValue: `₹${(totalValue * 0.5).toLocaleString('en-IN')}` },
        { beneficiaryName: 'Aarav Sharma', relationship: 'Child', percentage: 25, estimatedValue: `₹${(totalValue * 0.25).toLocaleString('en-IN')}` },
        { beneficiaryName: 'Sharma Family Trust', relationship: 'Trust', percentage: 25, estimatedValue: `₹${(totalValue * 0.25).toLocaleString('en-IN')}` }
      ],
      executorActions: [
        'Notify Primary Executor (Adv. Ramesh Varma)',
        'File Death Certificate with Sub-Registrar & Insurers',
        'Initiate Nominee Transmission across Demat Accounts & Bank Accounts',
        'Execute Trust Deed Transfer for Asset Holding'
      ],
      requiredDocuments: [
        'Registered Will Copy (Will ID #1)',
        'Original Death Certificate from Municipal Corporation',
        'PAN & Aadhaar Copies of Testator & Beneficiaries',
        'Form 26AS & Income Tax Clearance Certificate'
      ],
      taxImpactEstimate: '₹0.00 (Zero Estate Duty in India under current Income Tax Act)',
      riskHighlights: [
        'All major holdings have registered nominees in Knowledge Graph.',
        'Registered Will speeds probate process by an estimated 6-9 months.'
      ]
    };
  }
}
