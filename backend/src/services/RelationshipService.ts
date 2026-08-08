import Database from 'better-sqlite3';
import { SQLiteKnowledgeGraphRepository, GraphNodeRecord, GraphEdgeRecord } from '../repositories/SQLiteKnowledgeGraphRepository';

export class RelationshipService {
  constructor(
    private db: Database.Database,
    private graphRepo: SQLiteKnowledgeGraphRepository
  ) {}

  public syncKnowledgeGraphFromDomainEntities(familyId: number): void {
    const targetFamilyId = Number(familyId) || 1;
    
    // 0. Ensure family record exists for Foreign Keys
    try {
      this.db.prepare("INSERT OR IGNORE INTO families (id, name, currency) VALUES (?, 'My Family', 'INR')").run(targetFamilyId);
    } catch {}

    const ownsRelType = this.graphRepo.getRelationshipTypeByCode('OWNS');
    const policyHolderRel = this.graphRepo.getRelationshipTypeByCode('POLICY_HOLDER');

    // 1. Sync Family Members as PERSON nodes
    const personNodeMap = new Map<number, GraphNodeRecord>();
    try {
      const members = this.db
        .prepare('SELECT * FROM family_members WHERE family_id = ? AND deleted_at IS NULL')
        .all(targetFamilyId) as Array<{ id: number; name: string; relationship: string }>;

      for (const m of members) {
        const node = this.graphRepo.getOrCreateNode(targetFamilyId, 'PERSON', m.id, `${m.name} (${m.relationship || 'Member'})`, { relationship: m.relationship });
        personNodeMap.set(m.id, node);
      }
    } catch (e) {
      console.error('KnowledgeGraph sync error (family_members):', e);
    }

    // Ensure at least one primary PERSON node exists to own assets
    let headPerson = personNodeMap.values().next().value;
    if (!headPerson) {
      try {
        headPerson = this.graphRepo.getOrCreateNode(targetFamilyId, 'PERSON', 1, 'Primary Account Holder', { relationship: 'Head' });
      } catch (e) {
        console.error('KnowledgeGraph sync error (headPerson):', e);
      }
    }

    // 2. Sync Assets from `assets` table (Kite, AngelOne, NPS, EPF, Mutual Funds, Stocks)
    try {
      const assets = this.db
        .prepare(`SELECT id, name, type, category, identifier, family_member_id FROM assets`)
        .all() as Array<{ id: number; name: string; type: string; category: string; identifier: string | null; family_member_id?: number | null }>;

      for (const a of assets) {
        const assetNode = this.graphRepo.getOrCreateNode(targetFamilyId, 'ASSET', a.id, a.name, { assetType: a.type, category: a.category, identifier: a.identifier });
        const ownerPerson = (a.family_member_id && personNodeMap.get(a.family_member_id)) || headPerson;
        if (ownerPerson && ownsRelType) {
          try {
            this.graphRepo.addEdge(targetFamilyId, ownerPerson.id, assetNode.id, ownsRelType.id, 1.0);
          } catch {
            // Ignore duplicate edge
          }
        }
      }
    } catch (e) {
      console.error('KnowledgeGraph sync error (assets):', e);
    }

    // 3. Sync Accounts from `accounts` table (safely check table columns)
    try {
      const accountsTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'").get();
      if (accountsTable) {
        const accounts = this.db
          .prepare(`
            SELECT a.id, a.account_name as name, a.account_type as type, a.masked_account_number as account_number_masked, a.institution_name, a.family_member_id 
            FROM accounts a 
            LEFT JOIN family_members fm ON a.family_member_id = fm.id 
            WHERE (fm.family_id = ? OR a.family_member_id IS NULL) AND a.deleted_at IS NULL
          `)
          .all(targetFamilyId) as Array<{ id: number; name: string; type: string; account_number_masked?: string; institution_name?: string; family_member_id?: number | null }>;

        for (const acc of accounts) {
          const accNode = this.graphRepo.getOrCreateNode(targetFamilyId, 'ACCOUNT', acc.id, `${acc.institution_name || acc.name || 'Account'} (${acc.type})`, { type: acc.type });
          const ownerPerson = (acc.family_member_id && personNodeMap.get(acc.family_member_id)) || headPerson;
          if (ownerPerson && ownsRelType) {
            try {
              this.graphRepo.addEdge(targetFamilyId, ownerPerson.id, accNode.id, ownsRelType.id, 1.0);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('KnowledgeGraph sync error (accounts):', e);
    }

    // 4. Sync Insurance Policies as POLICY nodes
    try {
      const policiesTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='insurance_policies'").get();
      if (policiesTable) {
        const policies = this.db
          .prepare('SELECT id, policy_number, insurer_name, policy_type, sum_assured FROM insurance_policies WHERE family_id = ? AND deleted_at IS NULL')
          .all(targetFamilyId) as Array<{ id: number; policy_number: string; insurer_name: string; policy_type: string; sum_assured: number }>;

        for (const p of policies) {
          const polNode = this.graphRepo.getOrCreateNode(targetFamilyId, 'POLICY', p.id, `${p.insurer_name} (${p.policy_number})`, { policyType: p.policy_type, sumAssured: p.sum_assured });
          if (headPerson && policyHolderRel) {
            try {
              this.graphRepo.addEdge(targetFamilyId, headPerson.id, polNode.id, policyHolderRel.id, 1.0);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('KnowledgeGraph sync error (policies):', e);
    }
  }

  public createRelationship(
    familyId: number,
    sourceNodeType: 'PERSON' | 'ASSET' | 'POLICY' | 'ACCOUNT' | 'DOCUMENT' | 'TAX_PROFILE',
    sourceEntityId: number,
    targetNodeType: 'PERSON' | 'ASSET' | 'POLICY' | 'ACCOUNT' | 'DOCUMENT' | 'TAX_PROFILE',
    targetEntityId: number,
    relationshipCode: string,
    weight: number = 1.0
  ): GraphEdgeRecord {
    const relType = this.graphRepo.getRelationshipTypeByCode(relationshipCode);
    if (!relType) {
      throw new Error(`Relationship type with code '${relationshipCode}' not found.`);
    }

    const sourceNode = this.graphRepo.getOrCreateNode(familyId, sourceNodeType, sourceEntityId, `${sourceNodeType} #${sourceEntityId}`);
    const targetNode = this.graphRepo.getOrCreateNode(familyId, targetNodeType, targetEntityId, `${targetNodeType} #${targetEntityId}`);

    return this.graphRepo.addEdge(familyId, sourceNode.id, targetNode.id, relType.id, weight);
  }

  public removeRelationship(edgeId: number, familyId: number): boolean {
    return this.graphRepo.deleteEdge(edgeId, familyId);
  }
}
