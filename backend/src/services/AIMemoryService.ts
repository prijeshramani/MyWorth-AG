import { SQLiteAIContextRepository, AIMemoryRecord } from '../repositories/SQLiteAIContextRepository';

export class AIMemoryService {
  constructor(private repo: SQLiteAIContextRepository) {}

  public getMemoryTimeline(familyId: number): AIMemoryRecord[] {
    let memory = this.repo.getMemory(familyId);
    if (memory.length === 0) {
      const m1 = this.repo.saveMemory({
        family_id: familyId,
        memory_type: 'PERMANENT',
        key: 'RISK_TOLERANCE',
        value_json: JSON.stringify({ profile: 'MODERATE_AGGRESSIVE', maxEquityPct: 75 }),
        confidence_score: 98.0
      });
      const m2 = this.repo.saveMemory({
        family_id: familyId,
        memory_type: 'PERMANENT',
        key: 'PRIMARY_GOAL',
        value_json: JSON.stringify({ goal: 'RETIREMENT_AT_60', targetCorpus: 45000000 }),
        confidence_score: 95.0
      });
      memory = [m1, m2];
    }
    return memory;
  }

  public saveMemoryItem(familyId: number, type: AIMemoryRecord['memory_type'], key: string, value: any): AIMemoryRecord {
    return this.repo.saveMemory({
      family_id: familyId,
      memory_type: type,
      key,
      value_json: JSON.stringify(value),
      confidence_score: 95.0
    });
  }
}
