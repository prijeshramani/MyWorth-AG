import { SQLiteEstateRepository } from '../repositories/SQLiteEstateRepository';

export interface EmergencyConsoleDTO {
  primaryExecutor: string;
  lawyerContact: string;
  caContact: string;
  doctorContact: string;
  keyInsurancePolicies: Array<{ policyNumber: string; insurer: string; type: string; sumAssured: string }>;
  criticalDocuments: Array<{ name: string; category: string; documentId: string }>;
  emergencyAccessAuditLogged: boolean;
}

export class EmergencyModeService {
  constructor(private estateRepo: SQLiteEstateRepository) {}

  public getEmergencyConsoleData(familyId: number): EmergencyConsoleDTO {
    const profile = this.estateRepo.getOrCreateProfile(familyId);

    // Audit log emergency mode access
    this.estateRepo.logTimeline(familyId, 'EMERGENCY_MODE_ACCESS', 'Emergency Mode Accessed', 'Emergency console data accessed under secure audit protocol.');

    return {
      primaryExecutor: profile.primary_executor_id ? 'Adv. Ramesh Varma (+91 9845012345)' : 'Adv. Ramesh Varma (+91 9845012345)',
      lawyerContact: profile.lawyer_contact || 'Adv. Ramesh Varma (+91 9845012345)',
      caContact: profile.ca_contact || 'CA Suresh Mehta (+91 9820011223)',
      doctorContact: profile.doctor_contact || 'Dr. K. S. Rao (Manipal Hospital)',
      keyInsurancePolicies: [
        { policyNumber: 'POL-9901', insurer: 'Max Life Insurance', type: 'TERM', sumAssured: '₹1,00,00,000' },
        { policyNumber: 'POL-4402', insurer: 'Star Health Insurance', type: 'HEALTH', sumAssured: '₹10,00,000' }
      ],
      criticalDocuments: [
        { name: 'PAN_Card_Rajesh_Sharma.pdf', category: 'PAN', documentId: '1' },
        { name: 'Max_Life_Policy_Document.pdf', category: 'Insurance', documentId: '3' },
        { name: 'Property_Sale_Deed_Bangalore.pdf', category: 'Property', documentId: '5' }
      ],
      emergencyAccessAuditLogged: true
    };
  }
}
