import { SQLiteAIContextRepository, AIEvidenceRecord } from '../repositories/SQLiteAIContextRepository';
import crypto from 'crypto';

export class EvidenceService {
  constructor(private repo: SQLiteAIContextRepository) {}

  public createEvidence(familyId: number, evidenceCode: string, sourceEngine: string, proofData: any, correlationId?: string): AIEvidenceRecord {
    const proofStr = JSON.stringify(proofData);
    const hash = crypto.createHash('sha256').update(proofStr).digest('hex').substring(0, 16);
    const corrId = correlationId || `corr_ev_${Date.now()}`;

    return this.repo.saveEvidence({
      family_id: familyId,
      evidence_code: evidenceCode,
      source_engine: sourceEngine,
      source_engine_version: '1.0.0',
      rule_version: '1.0.0',
      calculation_hash: hash,
      correlation_id: corrId,
      proof_data_json: proofStr
    });
  }

  public getEvidence(id: number): AIEvidenceRecord | undefined {
    return this.repo.getEvidenceById(id);
  }
}
