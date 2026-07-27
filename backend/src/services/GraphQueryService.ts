import { SQLiteKnowledgeGraphRepository, GraphNodeRecord, GraphEdgeRecord } from '../repositories/SQLiteKnowledgeGraphRepository';

export interface EgoNetworkDTO {
  centerNode: GraphNodeRecord;
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
  totalRelationships: number;
}

export interface EstateReadinessGraphDTO {
  totalAssetsCount: number;
  assetsWithNomineesCount: number;
  nomineeCoveragePercent: number;
  missingNomineeAssetIds: number[];
  readinessScore: number;
}

export class GraphQueryService {
  constructor(private graphRepo: SQLiteKnowledgeGraphRepository) {}

  public getOverviewGraph(familyId: number): { nodes: GraphNodeRecord[]; edges: GraphEdgeRecord[]; nodeCount: number; edgeCount: number } {
    const nodes = this.graphRepo.getNodesByFamily(familyId);
    const edges = this.graphRepo.getEdgesByFamily(familyId);
    return {
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length
    };
  }

  public getPersonEgoNetwork(familyId: number, personEntityId: number): EgoNetworkDTO {
    const allNodes = this.graphRepo.getNodesByFamily(familyId);
    const allEdges = this.graphRepo.getEdgesByFamily(familyId);

    const centerNode = allNodes.find(n => n.entity_type === 'PERSON' && n.entity_id === personEntityId);
    if (!centerNode) {
      throw new Error(`Person with ID ${personEntityId} not found in knowledge graph.`);
    }

    const connectedEdges = allEdges.filter(
      e => e.source_node_id === centerNode.id || e.target_node_id === centerNode.id
    );

    const connectedNodeIds = new Set<number>([centerNode.id]);
    connectedEdges.forEach(e => {
      connectedNodeIds.add(e.source_node_id);
      connectedNodeIds.add(e.target_node_id);
    });

    const connectedNodes = allNodes.filter(n => connectedNodeIds.has(n.id));

    return {
      centerNode,
      nodes: connectedNodes,
      edges: connectedEdges,
      totalRelationships: connectedEdges.length
    };
  }

  public getAssetOwnershipTree(familyId: number, assetEntityId: number): EgoNetworkDTO {
    const allNodes = this.graphRepo.getNodesByFamily(familyId);
    const allEdges = this.graphRepo.getEdgesByFamily(familyId);

    const centerNode = allNodes.find(n => n.entity_type === 'ASSET' && n.entity_id === assetEntityId);
    if (!centerNode) {
      throw new Error(`Asset with ID ${assetEntityId} not found in knowledge graph.`);
    }

    const connectedEdges = allEdges.filter(
      e => e.source_node_id === centerNode.id || e.target_node_id === centerNode.id
    );

    const connectedNodeIds = new Set<number>([centerNode.id]);
    connectedEdges.forEach(e => {
      connectedNodeIds.add(e.source_node_id);
      connectedNodeIds.add(e.target_node_id);
    });

    const connectedNodes = allNodes.filter(n => connectedNodeIds.has(n.id));

    return {
      centerNode,
      nodes: connectedNodes,
      edges: connectedEdges,
      totalRelationships: connectedEdges.length
    };
  }

  public evaluateEstateReadiness(familyId: number): EstateReadinessGraphDTO {
    const allNodes = this.graphRepo.getNodesByFamily(familyId);
    const allEdges = this.graphRepo.getEdgesByFamily(familyId);

    const assetNodes = allNodes.filter(n => n.entity_type === 'ASSET' || n.entity_type === 'POLICY');
    if (assetNodes.length === 0) {
      return {
        totalAssetsCount: 0,
        assetsWithNomineesCount: 0,
        nomineeCoveragePercent: 100,
        missingNomineeAssetIds: [],
        readinessScore: 100
      };
    }

    const assetIdsWithNominees = new Set<number>();
    allEdges.forEach(e => {
      if (e.relationship_code === 'NOMINEE' || e.relationship_code === 'BENEFICIARY') {
        assetIdsWithNominees.add(e.source_node_id);
        assetIdsWithNominees.add(e.target_node_id);
      }
    });

    const coveredAssets = assetNodes.filter(a => assetIdsWithNominees.has(a.id));
    const missingAssets = assetNodes.filter(a => !assetIdsWithNominees.has(a.id));

    const coveragePercent = Math.round((coveredAssets.length / assetNodes.length) * 100);

    return {
      totalAssetsCount: assetNodes.length,
      assetsWithNomineesCount: coveredAssets.length,
      nomineeCoveragePercent: coveragePercent,
      missingNomineeAssetIds: missingAssets.map(a => a.entity_id),
      readinessScore: coveragePercent
    };
  }
}
