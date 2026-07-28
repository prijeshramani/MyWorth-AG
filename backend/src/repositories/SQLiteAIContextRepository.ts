import Database from 'better-sqlite3';

export interface AICapabilityRecord {
  id: number;
  capability_code: string;
  name: string;
  description: string;
  required_context_providers_json: string;
  required_permissions_json: string;
  safety_policy_json: string;
  is_active: number;
}

export interface AIMemoryRecord {
  id: number;
  family_id: number;
  memory_type: 'PERMANENT' | 'SESSION' | 'EXPIRING' | 'USER_REMOVABLE';
  key: string;
  value_json: string;
  confidence_score: number;
  expires_at?: string;
  created_at: string;
}

export interface AIEvidenceRecord {
  id: number;
  family_id: number;
  evidence_code: string;
  source_engine: string;
  source_engine_version: string;
  rule_version: string;
  calculation_hash: string;
  correlation_id: string;
  proof_data_json: string;
  created_at: string;
}

export interface AIPromptTemplateRecord {
  id: number;
  template_code: string;
  system_prompt_template: string;
  user_prompt_template: string;
  version: number;
  is_active: number;
}

export class SQLiteAIContextRepository {
  constructor(private db: Database.Database) {}

  public seedCapabilitiesAndPrompts(): void {
    // 1. Seed AI Capabilities
    const capabilities = [
      {
        code: 'PORTFOLIO_ANALYSIS',
        name: 'Portfolio Analysis & XIRR Review',
        description: 'Analyzes asset allocation, holding concentrations, asset class performance, and historical returns.',
        providers: ['InvestmentContextProvider', 'PortfolioContextProvider'],
        permissions: ['READ_PORTFOLIO']
      },
      {
        code: 'TAX_EXPLANATION',
        name: 'Tax Intelligence & Regime Comparison',
        description: 'Explains Old vs New tax regime trade-offs, capital gains tax rules, and Section 80C deductions.',
        providers: ['TaxContextProvider'],
        permissions: ['READ_TAX']
      },
      {
        code: 'ESTATE_REVIEW',
        name: 'Estate Readiness & Will Review',
        description: 'Evaluates Estate Health Score (S_Estate), Will registration status, and Trust entitlements.',
        providers: ['EstateContextProvider', 'KnowledgeGraphContextProvider'],
        permissions: ['READ_ESTATE']
      },
      {
        code: 'RETIREMENT_COACHING',
        name: 'Retirement Readiness & Goal Planning',
        description: 'Evaluates inflation-adjusted retirement corpus requirements and SIP step-up schedules.',
        providers: ['PlanningContextProvider'],
        permissions: ['READ_PLANNING']
      }
    ];

    const capStmt = this.db.prepare(`
      INSERT OR IGNORE INTO ai_capabilities (capability_code, name, description, required_context_providers_json, required_permissions_json, safety_policy_json, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    for (const c of capabilities) {
      capStmt.run(c.code, c.name, c.description, JSON.stringify(c.providers), JSON.stringify(c.permissions), JSON.stringify({ piiRedaction: true }));
    }

    // 2. Seed Prompt Templates
    const promptStmt = this.db.prepare(`
      INSERT OR IGNORE INTO ai_prompt_templates (template_code, system_prompt_template, user_prompt_template, version, is_active)
      VALUES (?, ?, ?, 1, 1)
    `);

    promptStmt.run(
      'WEALTH_ADVISOR_BASE',
      'You are FamilyWealthOS AI Advisor. Act as an expert SEBI Registered Investment Advisor (RIA) for Indian wealth planning. Respond using deterministic mathematical evidence provided in the context payload.',
      'User Query: {userQuery}\n\nContext Payload:\n{contextPayload}\n\nEvidence Proof:\n{evidenceProof}',
    );
  }

  public getCapabilities(): AICapabilityRecord[] {
    this.seedCapabilitiesAndPrompts();
    return this.db.prepare('SELECT * FROM ai_capabilities WHERE is_active = 1').all() as AICapabilityRecord[];
  }

  public getMemory(familyId: number): AIMemoryRecord[] {
    return this.db.prepare('SELECT * FROM ai_memory WHERE family_id = ? ORDER BY id DESC').all(familyId) as AIMemoryRecord[];
  }

  public saveMemory(mem: Omit<AIMemoryRecord, 'id' | 'created_at'>): AIMemoryRecord {
    const stmt = this.db.prepare(`
      INSERT INTO ai_memory (family_id, memory_type, key, value_json, confidence_score, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(mem.family_id, mem.memory_type, mem.key, mem.value_json, mem.confidence_score || 95.0, mem.expires_at || null);
    return { id: Number(res.lastInsertRowid), created_at: new Date().toISOString(), ...mem };
  }

  public saveEvidence(evidence: Omit<AIEvidenceRecord, 'id' | 'created_at'>): AIEvidenceRecord {
    const stmt = this.db.prepare(`
      INSERT INTO ai_evidence (family_id, evidence_code, source_engine, source_engine_version, rule_version, calculation_hash, correlation_id, proof_data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      evidence.family_id,
      evidence.evidence_code,
      evidence.source_engine,
      evidence.source_engine_version || '1.0.0',
      evidence.rule_version || '1.0.0',
      evidence.calculation_hash,
      evidence.correlation_id,
      evidence.proof_data_json
    );
    return { id: Number(res.lastInsertRowid), created_at: new Date().toISOString(), ...evidence };
  }

  public getEvidenceById(id: number): AIEvidenceRecord | undefined {
    return this.db.prepare('SELECT * FROM ai_evidence WHERE id = ?').get(id) as AIEvidenceRecord | undefined;
  }

  public getPromptTemplate(code: string): AIPromptTemplateRecord | undefined {
    this.seedCapabilitiesAndPrompts();
    return this.db.prepare('SELECT * FROM ai_prompt_templates WHERE template_code = ? AND is_active = 1').get(code) as AIPromptTemplateRecord | undefined;
  }
}
