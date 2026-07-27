import Database from 'better-sqlite3';
import { SQLiteKnowledgeGraphRepository, GraphNodeRecord, GraphEdgeRecord } from '../repositories/SQLiteKnowledgeGraphRepository';

export class RelationshipService {
  constructor(
    private db: Database.Database,
    private graphRepo: SQLiteKnowledgeGraphRepository
  ) {}

  public syncKnowledgeGraphFromDomainEntities(familyId: number): void {
    // 1. Sync Family Members as PERSON nodes
    const members = this.db
      .prepare('SELECT * FROM family_members WHERE family_id = ? AND deleted_at IS NULL')
      .all(familyId) as Array<{ id: number; name: string; relationship: string }>;

    const personNodeMap = new Map<number, GraphNodeRecord>();
    for (const m of members) {
      const node = this.graphRepo.getOrCreateNode(familyId, 'PERSON', m.id, `${m.name} (${m.relationship})`, { relationship: m.relationship });
      personNodeMap.set(m.id, node);
    }

    // 2. Sync Holdings as ASSET nodes & OWNS edges
    const holdings = this.db
      .prepare(`
        SELECT h.id, h.account_id, a.name as asset_name, a.asset_type
        FROM holdings h
        JOIN assets_master a ON h.asset_id = a.id
        WHERE h.deleted_at IS NULL AND a.deleted_at IS NULL
      `)
      .all() as Array<{ id: number; account_id: number; asset_name: string; asset_type: string }>;

    const ownsRelType = this.graphRepo.getRelationshipTypeByCode('OWNS');
    const headPerson = personNodeMap.values().next().value;

    for (const h of holdings) {
      const assetNode = this.graphRepo.getOrCreateNode(familyId, 'ASSET', h.id, h.asset_name, { assetType: h.asset_type });
      if (headPerson && ownsRelType) {
        try {
          this.graphRepo.addEdge(familyId, headPerson.id, assetNode.id, ownsRelType.id, 1.0);
        } catch {
          // Ignore duplicate edge
        }
      }
    }

    // 3. Sync Insurance Policies as POLICY nodes & POLICY_HOLDER edges
    const policies = this.db
      .prepare('SELECT id, policy_number, insurer_name, policy_type, sum_assured, nominee_name FROM insurance_policies WHERE family_id = ? AND deleted_at IS NULL')
      .all(familyId) as Array<{ id: number; policy_number: string; insurer_name: string; policy_type: string; sum_assured: number; nominee_name?: string }>;

    const policyHolderRel = this.graphRepo.getRelationshipTypeByCode('POLICY_HOLDER');
    const nomineeRel = this.graphRepo.getRelationshipTypeByCode('NOMINEE');

    for (const p of policies) {
      const polNode = this.graphRepo.getOrCreateNode(familyId, 'POLICY', p.id, `${p.insurer_name} (${p.policy_number})`, { policyType: p.policy_type, sumAssured: p.sum_assured });
      if (headPerson && policyHolderRel) {
        try {
          this.graphRepo.addEdge(familyId, headPerson.id, polNode.id, policyHolderRel.id, 1.0);
        } catch {}
      }
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
