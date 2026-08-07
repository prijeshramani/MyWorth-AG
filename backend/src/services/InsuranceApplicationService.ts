import { InsuranceRepository } from '../repositories/InsuranceRepository';
import { SQLiteFamilyRepository } from '../repositories/SQLiteFamilyRepository';

export interface ProtectionSummaryDTO {
  familyId: number;
  familyName: string;
  asOfDate: string;
  protectionScore: number;
  protectionRating: 'OPTIMAL' | 'MODERATE' | 'AT_RISK' | 'CRITICAL_GAP';
  lifeCover: {
    totalSumAssured: number;
    formattedTotalSumAssured: string;
    targetCoverage: number;
    formattedTargetCoverage: string;
    coverageGapPercent: number;
  };
  healthCover: {
    totalSumAssured: number;
    formattedTotalSumAssured: string;
    targetCoverage: number;
    formattedTargetCoverage: string;
    coverageGapPercent: number;
  };
  upcomingPremiumsCount: number;
  policies: Array<{
    policyId: number;
    policyNumber: string;
    insurerName: string;
    policyType: string;
    holderName: string;
    sumAssured: number;
    formattedSumAssured: string;
    premiumAmount: number;
    formattedPremiumAmount: string;
    nextPremiumDueDate: string;
    status: string;
    nomineeName?: string;
    isFamilyFloater: boolean;
    coveredMemberIds: number[];
    coveredMemberIdsRaw: string;
  }>;
}

const LIFE_TYPES = ['TERM_INSURANCE', 'LIC_ENDOWMENT', 'LIC_MONEY_BACK', 'LIC_PENSION', 'LIC_CHILD', 'ULIP'];
const HEALTH_TYPES = ['HEALTH_INSURANCE', 'FAMILY_FLOATER', 'FAMILY_HEALTH_INSURANCE', 'CRITICAL_ILLNESS'];

export class InsuranceApplicationService {
  constructor(
    private insuranceRepo: InsuranceRepository,
    private familyRepo: SQLiteFamilyRepository
  ) {}

  public getProtectionSummary(familyId: number): ProtectionSummaryDTO {
    const family = this.familyRepo.findById(familyId) || this.familyRepo.findAll()[0] || { id: familyId, name: 'My Household' };

    const policies = this.insuranceRepo.findByFamilyId(familyId);

    let totalLifeCover = 0;
    let totalHealthCover = 0;
    let compliantNomineeCount = 0;

    const mappedPolicies = policies.map((p) => {
      const isFamilyFloater = Number(p.is_family_floater) === 1;
      const coveredMemberIdsRaw = p.covered_member_ids || '';
      const coveredMemberIds = coveredMemberIdsRaw
        ? coveredMemberIdsRaw.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
        : [];

      if (LIFE_TYPES.includes(p.policy_type)) {
        totalLifeCover += p.sum_assured;
      }
      if (HEALTH_TYPES.includes(p.policy_type)) {
        // Count floater once towards total health cover (not per member)
        totalHealthCover += p.sum_assured;
      }
      if (p.nominee_name && p.nominee_name.trim().length > 0) {
        compliantNomineeCount++;
      }

      return {
        policyId: p.id,
        policyNumber: p.policy_number,
        insurerName: p.insurer_name,
        policyType: p.policy_type,
        holderName: isFamilyFloater ? 'All Family Members' : (p.holder_name || 'Family Member'),
        sumAssured: p.sum_assured,
        formattedSumAssured: `₹${p.sum_assured.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        premiumAmount: p.premium_amount,
        formattedPremiumAmount: `₹${p.premium_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        nextPremiumDueDate: p.next_premium_due_date,
        status: p.status,
        nomineeName: p.nominee_name || undefined,
        isFamilyFloater,
        coveredMemberIds,
        coveredMemberIdsRaw
      };
    });

    const targetLifeCoverage = 25000000; // ₹2.5 Cr Target
    const targetHealthCoverage = 3500000; // ₹35 Lakh Target

    const lifeScore = Math.min(100, (totalLifeCover / targetLifeCoverage) * 100);
    const healthScore = Math.min(100, (totalHealthCover / targetHealthCoverage) * 100);
    const nomineeScore = policies.length > 0 ? (compliantNomineeCount / policies.length) * 100 : 100;

    const protectionScore = Math.round(0.5 * lifeScore + 0.35 * healthScore + 0.15 * nomineeScore);

    let protectionRating: ProtectionSummaryDTO['protectionRating'] = 'OPTIMAL';
    if (protectionScore < 45) protectionRating = 'CRITICAL_GAP';
    else if (protectionScore < 65) protectionRating = 'AT_RISK';
    else if (protectionScore < 85) protectionRating = 'MODERATE';

    return {
      familyId,
      familyName: family.name,
      asOfDate: new Date().toISOString().split('T')[0],
      protectionScore,
      protectionRating,
      lifeCover: {
        totalSumAssured: totalLifeCover,
        formattedTotalSumAssured: `₹${totalLifeCover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        targetCoverage: targetLifeCoverage,
        formattedTargetCoverage: `₹${targetLifeCoverage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        coverageGapPercent: Math.max(0, 100 - lifeScore)
      },
      healthCover: {
        totalSumAssured: totalHealthCover,
        formattedTotalSumAssured: `₹${totalHealthCover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        targetCoverage: targetHealthCoverage,
        formattedTargetCoverage: `₹${targetHealthCoverage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        coverageGapPercent: Math.max(0, 100 - healthScore)
      },
      upcomingPremiumsCount: mappedPolicies.filter((p) => p.status === 'ACTIVE').length,
      policies: mappedPolicies
    };
  }

  public getPoliciesByFamily(familyId: number) {
    return this.insuranceRepo.findByFamilyId(familyId);
  }

  public createPolicy(policyData: any) {
    const isFamilyFloater = policyData.isFamilyFloater === true || policyData.policyType === 'FAMILY_HEALTH_INSURANCE';

    return this.insuranceRepo.create({
      family_id: policyData.familyId || 1,
      policy_number: policyData.policyNumber,
      insurer_name: policyData.insurerName,
      policy_type: policyData.policyType,
      policy_holder_id: policyData.policyHolderId || 1,
      sum_assured: Number(policyData.sumAssured || 0),
      premium_amount: Number(policyData.premiumAmount || 0),
      premium_frequency: policyData.premiumFrequency || 'ANNUAL',
      start_date: policyData.startDate || new Date().toISOString().split('T')[0],
      maturity_date: policyData.maturityDate || undefined,
      next_premium_due_date: policyData.nextPremiumDueDate || new Date().toISOString().split('T')[0],
      status: policyData.status || 'ACTIVE',
      nominee_name: policyData.nomineeName || undefined,
      nominee_relationship: policyData.nomineeRelationship || undefined,
      notes: policyData.notes || undefined,
      is_family_floater: isFamilyFloater ? 1 : 0,
      covered_member_ids: Array.isArray(policyData.coveredMemberIds)
        ? policyData.coveredMemberIds.join(',')
        : (policyData.coveredMemberIds || undefined)
    });
  }

  public updatePolicy(id: number, policyData: any) {
    const isFamilyFloater = policyData.isFamilyFloater === true || policyData.policyType === 'FAMILY_HEALTH_INSURANCE';

    return this.insuranceRepo.update(id, {
      policy_number: policyData.policyNumber,
      insurer_name: policyData.insurerName,
      policy_type: policyData.policyType,
      policy_holder_id: policyData.policyHolderId,
      sum_assured: policyData.sumAssured !== undefined ? Number(policyData.sumAssured) : undefined,
      premium_amount: policyData.premiumAmount !== undefined ? Number(policyData.premiumAmount) : undefined,
      premium_frequency: policyData.premiumFrequency,
      start_date: policyData.startDate,
      maturity_date: policyData.maturityDate,
      next_premium_due_date: policyData.nextPremiumDueDate,
      status: policyData.status,
      nominee_name: policyData.nomineeName,
      nominee_relationship: policyData.nomineeRelationship,
      notes: policyData.notes,
      is_family_floater: isFamilyFloater ? 1 : 0,
      covered_member_ids: Array.isArray(policyData.coveredMemberIds)
        ? policyData.coveredMemberIds.join(',')
        : policyData.coveredMemberIds
    });
  }

  public deletePolicy(id: number): boolean {
    return this.insuranceRepo.delete(id);
  }
}
