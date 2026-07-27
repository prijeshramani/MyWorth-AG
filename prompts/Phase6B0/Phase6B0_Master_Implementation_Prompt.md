# Phase6B0_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 6B.0

## Knowledge Graph Foundation & Relationship Engine

Mission: Build the canonical relationship layer before Estate Planning.

## Context

Completed: Investments, Portfolio, Net Worth, Protection, Security,
Indian Tax Engine, Product Integration. Reuse all existing modules.

## Objectives

-   Create a canonical knowledge graph.
-   No changes to business/calculation engines.
-   Reuse repositories and services.
-   Enforce family_id isolation.

## Database

Migration: 007_knowledge_graph.ts Tables: - graph_nodes - graph_edges -
relationship_types - entity_references - graph_metadata

## Backend

Create: - KnowledgeGraphRepository - RelationshipRepository -
RelationshipService - GraphQueryService - GraphController

## Seed Loader

Implement KnowledgeGraphSeedLoader. Seed configurable relationship
types: OWNS, JOINT_OWNER, NOMINEE, BENEFICIARY, INSURED, POLICY_HOLDER,
DEPENDENT, GUARDIAN, PARENT_OF, CHILD_OF, SPOUSE_OF, DOCUMENT_FOR,
TAX_PROFILE_OF, ACCOUNT_HOLDER. Idempotent and versioned.

## APIs

GET /api/v1/graph/overview GET /api/v1/graph/person/{id} GET
/api/v1/graph/asset/{id} POST /api/v1/graph/relationship DELETE
/api/v1/graph/relationship/{id}

## Frontend

Create: - Family Relationship Explorer - Asset Relationship View -
Relationship Inspector - Graph Search - Graph Timeline Reuse existing
UI.

## Integrations

Connect Family, Investments, Protection, Tax, Documents and Accounts
without modifying business logic.

## Documentation

Generate: - KNOWLEDGE_GRAPH_ARCHITECTURE.md - RELATIONSHIP_MODEL.md -
GRAPH_QUERY_GUIDE.md - GRAPH_SEED_GUIDE.md -
Sprint_6B0_Retrospective.md - AI_CHANGELOG.md - SESSION_CONTEXT.md -
Phase 6B0 - Implementation Summary.md

## Definition of Done

-   Canonical relationship engine complete
-   Existing modules connected
-   Multi-tenancy preserved
-   Clean build
-   Existing and new tests pass

Final instruction: Estate Planning, Trusts, Wills, AI Advisor and
Recommendations must consume this shared relationship layer.
