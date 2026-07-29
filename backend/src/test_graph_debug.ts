import { db, initDb } from './db';
import { SQLiteKnowledgeGraphRepository } from './repositories/SQLiteKnowledgeGraphRepository';
import { RelationshipService } from './services/RelationshipService';
import { GraphQueryService } from './services/GraphQueryService';

initDb();

const repo = new SQLiteKnowledgeGraphRepository(db);
const relService = new RelationshipService(db, repo);
const queryService = new GraphQueryService(repo);

console.log('--- TESTING FAMILY 6 ---');
relService.syncKnowledgeGraphFromDomainEntities(6);

const overview6 = queryService.getOverviewGraph(6);
console.log('Overview 6 result:', JSON.stringify(overview6, null, 2));

console.log('\n--- TESTING FAMILY 1 ---');
relService.syncKnowledgeGraphFromDomainEntities(1);

const overview1 = queryService.getOverviewGraph(1);
console.log('Overview 1 result nodeCount:', overview1.nodeCount, 'edgeCount:', overview1.edgeCount);
