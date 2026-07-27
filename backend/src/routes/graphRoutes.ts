import { Router } from 'express';
import { db } from '../db';
import { KnowledgeGraphSeedLoader } from '../engines/graph/KnowledgeGraphSeedLoader';
import { SQLiteKnowledgeGraphRepository } from '../repositories/SQLiteKnowledgeGraphRepository';
import { GraphQueryService } from '../services/GraphQueryService';
import { RelationshipService } from '../services/RelationshipService';
import { GraphController } from '../controllers/GraphController';

// Seed baseline relationship types
KnowledgeGraphSeedLoader.seedRelationshipTypes(db);

const graphRepo = new SQLiteKnowledgeGraphRepository(db);
const graphQueryService = new GraphQueryService(graphRepo);
const relationshipService = new RelationshipService(db, graphRepo);
const graphController = new GraphController(graphQueryService, relationshipService);

export const graphRouter = Router();

graphRouter.get('/overview', graphController.getOverview);
graphRouter.get('/person/:id', graphController.getPersonGraph);
graphRouter.get('/asset/:id', graphController.getAssetGraph);
graphRouter.post('/relationship', graphController.createRelationship);
graphRouter.delete('/relationship/:id', graphController.deleteRelationship);
