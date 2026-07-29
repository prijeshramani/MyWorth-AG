import { SQLiteEstateRepository } from '../repositories/SQLiteEstateRepository';

export interface EstateHealthScoreDTO {
  overallScore: number;
  ratingLabel: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  willScore: number;
  nomineeScore: number;
  trustScore: number;
  documentScore: number;
  liquidityScore: number;
  breakdown: Array<{ category: string; score: number; maxScore: number; status: string }>;
  recommendations: string[];
}

export class EstateHealthService {
  constructor(private estateRepo: SQLiteEstateRepository) {}

  public calculateEstateHealth(familyId: number): EstateHealthScoreDTO {
    const wills = this.estateRepo.getWills(familyId);
    const trusts = this.estateRepo.getTrusts(familyId);

    // 1. Will Score (Max 25)
    let willScore = 0;
    if (wills.length > 0) {
      const activeWill = wills.find(w => w.status === 'REGISTERED' || w.status === 'ACTIVE');
      if (activeWill) {
        willScore = activeWill.status === 'REGISTERED' ? 25 : 20;
      }
    }

    // 2. Nominee Score (Max 25)
    const nomineeScore = 0;

    // 3. Trust Score (Max 20)
    let trustScore = 0;
    if (trusts.length > 0) trustScore = 20;

    // 4. Document Score (Max 15)
    const documentScore = 0;

    // 5. Liquidity Score (Max 15)
    const liquidityScore = 0;

    const overallScore = Math.min(100, willScore + nomineeScore + trustScore + documentScore + liquidityScore);

    let ratingLabel: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' = overallScore === 0 ? 'CRITICAL' : 'GOOD';
    if (overallScore >= 90) ratingLabel = 'OPTIMAL';
    else if (overallScore >= 75) ratingLabel = 'GOOD';
    else if (overallScore >= 50) ratingLabel = 'NEEDS_ATTENTION';
    else ratingLabel = 'CRITICAL';

    const recommendations: string[] = [];
    if (willScore < 25) recommendations.push('Register Will with Sub-Registrar to ensure 100% legal validity.');
    if (trusts.length === 0) recommendations.push('Consider forming a Family Private Trust for tax-efficient estate transfer.');

    return {
      overallScore,
      ratingLabel,
      willScore,
      nomineeScore,
      trustScore,
      documentScore,
      liquidityScore,
      breakdown: [
        { category: 'Will & Testament', score: willScore, maxScore: 25, status: willScore >= 20 ? 'COMPLETE' : 'INCOMPLETE' },
        { category: 'Nominee Coverage', score: nomineeScore, maxScore: 25, status: 'OPTIMAL' },
        { category: 'Trust Structure', score: trustScore, maxScore: 20, status: trustScore >= 18 ? 'OPTIMAL' : 'PARTIAL' },
        { category: 'Succession Documents', score: documentScore, maxScore: 15, status: 'OPTIMAL' },
        { category: 'Estate Liquidity', score: liquidityScore, maxScore: 15, status: 'OPTIMAL' }
      ],
      recommendations
    };
  }
}
