# Phase 6B.0 Implementation Plan — Knowledge Graph Foundation & Relationship Engine

**Goal**: Build a canonical, enterprise-grade **Knowledge Graph Foundation & Relationship Engine** for FamilyWealthOS. Connects Family Members, Entities, Asset Holdings, Insurance Policies, Documents, Tax Profiles, and Bank/Demat Accounts into an interconnected graph node & edge model before Estate Planning without modifying existing calculation engines.

---

## Architecture Rules & Principles
1. **Canonical Relationship Layer**: All entities (Family Members, Assets, Policies, Documents, Accounts, Tax Profiles) are represented as nodes (`graph_nodes`), connected by directed versioned edges (`graph_edges`).
2. **Zero Engine Modifications**: Core calculation engines (XIRR, Net Worth, Tax Engine, Protection Score) remain 100% UNTOUCHED.
3. **Strict Multi-Tenancy**: All graph tables feature `family_id` filtering to guarantee tenant isolation.
4. **Idempotent Seed Loading**: `KnowledgeGraphSeedLoader` populates configurable relationship types versioned idempotently.

---

## Proposed Changes

### 1. Database Migration `007_knowledge_graph.ts`
#### [NEW] [007_knowledge_graph.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations/007_knowledge_graph.ts)
Create SQLite tables:
- `relationship_types`: `id`, `code`, `name`, `category`, `inverse_code`, `description`.
- `graph_nodes`: `id`, `family_id`, `entity_type` ('PERSON' | 'ASSET' | 'POLICY' | 'ACCOUNT' | 'DOCUMENT' | 'TAX_PROFILE'), `entity_id`, `label`, `metadata_json`, `created_at`.
- `graph_edges`: `id`, `family_id`, `source_node_id`, `target_node_id`, `relationship_type_id`, `weight`, `effective_from`, `effective_to`, `status`, `created_at`.
- `entity_references`: Mapping between canonical nodes and native table primary keys.
- `graph_metadata`: Graph versioning and sync tracking.

#### [MODIFY] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)
- Register `migration007` in migration runner array.

---

### 2. Backend Repositories, Seed Loader & Engines
#### [NEW] [KnowledgeGraphSeedLoader.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/graph/KnowledgeGraphSeedLoader.ts)
- Idempotently seed relationship types: `OWNS`, `JOINT_OWNER`, `NOMINEE`, `BENEFICIARY`, `INSURED`, `POLICY_HOLDER`, `DEPENDENT`, `GUARDIAN`, `PARENT_OF`, `CHILD_OF`, `SPOUSE_OF`, `DOCUMENT_FOR`, `TAX_PROFILE_OF`, `ACCOUNT_HOLDER`.

#### [NEW] [SQLiteKnowledgeGraphRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteKnowledgeGraphRepository.ts)
- Data access repository for nodes, edges, relationship types, and traversal queries.

#### [NEW] [GraphQueryService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/GraphQueryService.ts)
- Graph traversal engine computing ego-networks, shortest paths, nominee linkages, asset ownership trees, and estate readiness graphs.

#### [NEW] [RelationshipService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/RelationshipService.ts)
- Application service managing node/edge creation, relationship validation, and automatic edge extraction from existing family holdings and policies.

#### [NEW] [GraphController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/GraphController.ts) & [graphRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/graphRoutes.ts)
- REST endpoints mounted at `/api/v1/graph`:
  - `GET /api/v1/graph/overview?familyId=:id`
  - `GET /api/v1/graph/person/:id`
  - `GET /api/v1/graph/asset/:id`
  - `POST /api/v1/graph/relationship`
  - `DELETE /api/v1/graph/relationship/:id`

---

### 3. Backend Unit & Integration Tests
#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
- Add Section 24 tests: KnowledgeGraphSeedLoader, Node/Edge creation, GraphQueryService traversal, REST APIs. (Target: **168+ tests passing**).

---

### 4. Frontend Knowledge Graph Explorer Module
#### [NEW] [graphService.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/services/graphService.ts) & [useGraphOverview.ts](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/hooks/useGraphOverview.ts)
- Typed API client and TanStack Query hooks.

#### [NEW] [RelationshipExplorer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/graph/RelationshipExplorer.tsx)
- Visual Knowledge Graph Explorer featuring:
  - Interactive Ego-Network Node Map (Family, Assets, Insurance, Tax, Documents)
  - Relationship Inspector Side Panel
  - Node & Edge Search Filter
  - Relationship Matrix & Nominee Coverage Grid
  - Add New Relationship Modal

#### [MODIFY] [NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx) & [App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)
- Add **Knowledge Graph** to navigation drawer menu tabs and route active tab in `App.tsx`.

---

## Verification Plan

### Automated Build & Unit Tests
- Backend Unit Tests: `npm test` in `backend` (Target: 168+ tests passing).
- Frontend Production Build: `npm run build` in `frontend` (`tsc -b && vite build` completes in ~15s with 0 errors).

### Manual UX Verification
- Navigation to `/graph` tab.
- Interactive node selection and relationship details inspection.
- Adding a relationship edge (e.g. assigning a Nominee or Beneficiary to an Asset/Policy).
