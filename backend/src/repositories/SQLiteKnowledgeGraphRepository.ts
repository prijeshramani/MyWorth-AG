import Database from 'better-sqlite3';

export interface GraphNodeRecord {
  id: number;
  family_id: number;
  entity_type: 'PERSON' | 'ASSET' | 'POLICY' | 'ACCOUNT' | 'DOCUMENT' | 'TAX_PROFILE';
  entity_id: number;
  label: string;
  metadata_json?: string;
  created_at: string;
}

export interface GraphEdgeRecord {
  id: number;
  family_id: number;
  source_node_id: number;
  target_node_id: number;
  relationship_type_id: number;
  weight: number;
  effective_from: string;
  effective_to?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  created_at: string;
  relationship_code?: string;
  relationship_name?: string;
  source_label?: string;
  target_label?: string;
}

export interface RelationshipTypeRecord {
  id: number;
  code: string;
  name: string;
  category: string;
  inverse_code?: string;
  description?: string;
}

export class SQLiteKnowledgeGraphRepository {
  constructor(private db: Database.Database) {}

  public getOrCreateNode(
    familyId: number,
    entityType: 'PERSON' | 'ASSET' | 'POLICY' | 'ACCOUNT' | 'DOCUMENT' | 'TAX_PROFILE',
    entityId: number,
    label: string,
    metadata?: Record<string, any>
  ): GraphNodeRecord {
    let node = this.db
      .prepare('SELECT * FROM graph_nodes WHERE family_id = ? AND entity_type = ? AND entity_id = ?')
      .get(familyId, entityType, entityId) as GraphNodeRecord | undefined;

    if (!node) {
      const stmt = this.db.prepare(`
        INSERT INTO graph_nodes (family_id, entity_type, entity_id, label, metadata_json)
        VALUES (?, ?, ?, ?, ?)
      `);
      const res = stmt.run(familyId, entityType, entityId, label, metadata ? JSON.stringify(metadata) : null);
      node = {
        id: Number(res.lastInsertRowid),
        family_id: familyId,
        entity_type: entityType,
        entity_id: entityId,
        label,
        metadata_json: metadata ? JSON.stringify(metadata) : undefined,
        created_at: new Date().toISOString()
      };
    }

    return node;
  }

  public getNodesByFamily(familyId: number): GraphNodeRecord[] {
    const fid = familyId || 1;
    return this.db
      .prepare('SELECT * FROM graph_nodes WHERE family_id = ? OR family_id = 1 ORDER BY entity_type, label ASC')
      .all(fid) as GraphNodeRecord[];
  }

  public getRelationshipTypeByCode(code: string): RelationshipTypeRecord | undefined {
    return this.db
      .prepare('SELECT * FROM relationship_types WHERE code = ?')
      .get(code) as RelationshipTypeRecord | undefined;
  }

  public getRelationshipTypes(): RelationshipTypeRecord[] {
    return this.db.prepare('SELECT * FROM relationship_types ORDER BY category, name ASC').all() as RelationshipTypeRecord[];
  }

  public addEdge(
    familyId: number,
    sourceNodeId: number,
    targetNodeId: number,
    relationshipTypeId: number,
    weight: number = 1.0
  ): GraphEdgeRecord {
    // Check validation: source and target must belong to same family
    const sourceNode = this.db.prepare('SELECT family_id FROM graph_nodes WHERE id = ?').get(sourceNodeId) as { family_id: number } | undefined;
    const targetNode = this.db.prepare('SELECT family_id FROM graph_nodes WHERE id = ?').get(targetNodeId) as { family_id: number } | undefined;

    if (!sourceNode || !targetNode) {
      throw new Error('Invalid source or target node ID.');
    }
    if (sourceNode.family_id !== familyId || targetNode.family_id !== familyId) {
      throw new Error('Cross-family relationships are prohibited.');
    }
    if (sourceNodeId === targetNodeId) {
      throw new Error('Self-referencing relationship edges are prohibited.');
    }

    // Check if active edge already exists between source and target for this relationship type
    const existingEdge = this.db.prepare(`
      SELECT * FROM graph_edges 
      WHERE family_id = ? AND source_node_id = ? AND target_node_id = ? AND relationship_type_id = ? AND status = 'ACTIVE'
    `).get(familyId, sourceNodeId, targetNodeId, relationshipTypeId) as GraphEdgeRecord | undefined;

    if (existingEdge) {
      return existingEdge;
    }

    const stmt = this.db.prepare(`
      INSERT INTO graph_edges (family_id, source_node_id, target_node_id, relationship_type_id, weight, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `);
    const res = stmt.run(familyId, sourceNodeId, targetNodeId, relationshipTypeId, weight);

    return {
      id: Number(res.lastInsertRowid),
      family_id: familyId,
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      relationship_type_id: relationshipTypeId,
      weight,
      effective_from: new Date().toISOString(),
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
  }

  public getEdgesByFamily(familyId: number): GraphEdgeRecord[] {
    const fid = familyId || 1;
    return this.db
      .prepare(`
        SELECT e.*, r.code as relationship_code, r.name as relationship_name,
               sn.label as source_label, tn.label as target_label
        FROM graph_edges e
        JOIN relationship_types r ON e.relationship_type_id = r.id
        JOIN graph_nodes sn ON e.source_node_id = sn.id
        JOIN graph_nodes tn ON e.target_node_id = tn.id
        WHERE (e.family_id = ? OR e.family_id = 1) AND e.status = 'ACTIVE'
      `)
      .all(fid) as GraphEdgeRecord[];
  }

  public deleteEdge(edgeId: number, familyId: number): boolean {
    const res = this.db
      .prepare('UPDATE graph_edges SET status = "INACTIVE", effective_to = CURRENT_TIMESTAMP WHERE id = ? AND family_id = ?')
      .run(edgeId, familyId);
    return res.changes > 0;
  }
}
