import Database from 'better-sqlite3';

export interface RelationshipTypeDefinition {
  code: string;
  name: string;
  category: 'FAMILY' | 'OWNERSHIP' | 'INSURANCE' | 'TAX' | 'ACCOUNT' | 'DOCUMENT' | 'ESTATE';
  inverse_code?: string;
  description: string;
}

export const BASELINE_RELATIONSHIP_TYPES: RelationshipTypeDefinition[] = [
  { code: 'OWNS', name: 'Owns Asset', category: 'OWNERSHIP', inverse_code: 'OWNED_BY', description: 'Primary ownership link to asset' },
  { code: 'JOINT_OWNER', name: 'Joint Owner', category: 'OWNERSHIP', inverse_code: 'JOINT_OWNER_OF', description: 'Secondary joint owner of holding or property' },
  { code: 'NOMINEE', name: 'Assigned Nominee', category: 'ESTATE', inverse_code: 'NOMINATED_BY', description: 'Designated nominee for asset or policy' },
  { code: 'BENEFICIARY', name: 'Trust Beneficiary', category: 'ESTATE', inverse_code: 'BENEFICIARY_OF', description: 'Designated beneficiary of asset, trust, or policy' },
  { code: 'INSURED', name: 'Insured Life', category: 'INSURANCE', inverse_code: 'INSURED_BY', description: 'Life covered under insurance policy' },
  { code: 'POLICY_HOLDER', name: 'Policy Holder', category: 'INSURANCE', inverse_code: 'HOLDS_POLICY', description: 'Owner/proposer of insurance policy' },
  { code: 'DEPENDENT', name: 'Financial Dependent', category: 'FAMILY', inverse_code: 'DEPENDS_ON', description: 'Financial dependency relationship' },
  { code: 'GUARDIAN', name: 'Legal Guardian', category: 'FAMILY', inverse_code: 'WARD_OF', description: 'Legal guardian for minor family member' },
  { code: 'PARENT_OF', name: 'Parent of', category: 'FAMILY', inverse_code: 'CHILD_OF', description: 'Parent-child family relationship' },
  { code: 'CHILD_OF', name: 'Child of', category: 'FAMILY', inverse_code: 'PARENT_OF', description: 'Child-parent family relationship' },
  { code: 'SPOUSE_OF', name: 'Spouse of', category: 'FAMILY', inverse_code: 'SPOUSE_OF', description: 'Spousal marital relationship' },
  { code: 'DOCUMENT_FOR', name: 'Document for Entity', category: 'DOCUMENT', inverse_code: 'HAS_DOCUMENT', description: 'Document attachment link' },
  { code: 'TAX_PROFILE_OF', name: 'Tax Profile of', category: 'TAX', inverse_code: 'HAS_TAX_PROFILE', description: 'Tax profile link to person/family' },
  { code: 'ACCOUNT_HOLDER', name: 'Account Holder', category: 'ACCOUNT', inverse_code: 'HOLDS_ACCOUNT', description: 'Primary bank/Demat account holder' }
];

export class KnowledgeGraphSeedLoader {
  public static seedRelationshipTypes(db: Database.Database): void {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='relationship_types'").get();
    if (!tableCheck) {
      return;
    }

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO relationship_types (code, name, category, inverse_code, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const rel of BASELINE_RELATIONSHIP_TYPES) {
        stmt.run(rel.code, rel.name, rel.category, rel.inverse_code || null, rel.description);
      }
    })();

    console.log('Knowledge Graph relationship types baseline successfully verified/seeded.');
  }
}
