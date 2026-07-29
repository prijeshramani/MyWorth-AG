import Database from 'better-sqlite3';
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
  constructor(
    private estateRepo: SQLiteEstateRepository,
    private db: Database.Database
  ) {}

  public getEmergencyConsoleData(familyId: number): EmergencyConsoleDTO {
    const profile = this.estateRepo.getOrCreateProfile(familyId);

    // Audit log emergency mode access
    this.estateRepo.logTimeline(familyId, 'EMERGENCY_MODE_ACCESS', 'Emergency Mode Accessed', 'Emergency console data accessed under secure audit protocol.');

    // Fetch real insurance policies
    let keyInsurancePolicies: Array<{ policyNumber: string; insurer: string; type: string; sumAssured: string }> = [];
    try {
      const realPolicies = this.db
        .prepare("SELECT policy_number, insurer_name as insurer, policy_type as type, sum_assured FROM insurance_policies WHERE family_id = ? AND deleted_at IS NULL")
        .all(familyId) as Array<{ policy_number: string; insurer: string; type: string; sum_assured: number }>;

      keyInsurancePolicies = realPolicies.map(p => ({
        policyNumber: p.policy_number,
        insurer: p.insurer,
        type: p.type,
        sumAssured: `₹${p.sum_assured.toLocaleString('en-IN')}`
      }));
    } catch {}

    // Fetch real documents if any
    let criticalDocuments: Array<{ name: string; category: string; documentId: string }> = [];
    try {
      const docs = this.db
        .prepare("SELECT name, category, id as documentId FROM entity_references WHERE deleted_at IS NULL")
        .all() as Array<{ name: string; category: string; documentId: string }>;
      criticalDocuments = docs;
    } catch {}

    return {
      primaryExecutor: profile.lawyer_contact || 'Not Specified',
      lawyerContact: profile.lawyer_contact || 'Not Specified',
      caContact: profile.ca_contact || 'Not Specified',
      doctorContact: profile.doctor_contact || 'Not Specified',
      keyInsurancePolicies,
      criticalDocuments,
      emergencyAccessAuditLogged: true
    };
  }
}
