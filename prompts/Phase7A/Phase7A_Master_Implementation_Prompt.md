# Phase7A_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 7A

## AI Context, Memory & Evidence Layer

**Mission:** Build the trusted intelligence foundation that prepares
structured, explainable context for the future AI Wealth Advisor. This
phase does **not** implement conversational AI.

## Context

Reuse all completed engines: - Investment - Tax - Protection - Knowledge
Graph - Estate - Financial Planning - Recommendation Engine

## Architecture Rules

-   AI never queries raw tables directly.
-   AI consumes Context Services only.
-   No duplicate business logic.
-   Every answer must include evidence.
-   Enforce RBAC, audit logging and family_id.

## Components

1.  AI Context Builder
2.  Context Providers (Investment, Tax, Estate, Planning,
    Recommendation, Family, Documents)
3.  AI Memory Layer (short-term & long-term)
4.  Evidence Layer
5.  Prompt Builder
6.  AI Safety Layer
7.  Conversation State Manager

## Database

Migration: 011_ai_context.ts

Tables: - ai_sessions - ai_memory - ai_context_cache - ai_evidence -
ai_prompt_templates - ai_conversation_state

## Backend

-   AIContextService
-   AIMemoryService
-   EvidenceService
-   PromptBuilderService
-   AISafetyService
-   AIContextController

## APIs

GET /api/v1/ai/context GET /api/v1/ai/evidence/{id} GET
/api/v1/ai/memory POST /api/v1/ai/context/refresh POST /api/v1/ai/memory

## Frontend

-   AI Context Inspector
-   Evidence Viewer
-   Memory Timeline
-   AI Readiness Dashboard
-   Prompt Preview (Developer Mode)

## Testing

Target: - 205+ backend tests - Existing 195 tests remain green - Context
aggregation tests - Memory tests - Evidence validation tests

## Documentation

-   AI_CONTEXT_ARCHITECTURE.md
-   AI_MEMORY_MODEL.md
-   EVIDENCE_LAYER_GUIDE.md
-   PROMPT_BUILDER_GUIDE.md
-   AI_SAFETY_MODEL.md
-   Sprint_7A_Retrospective.md
-   AI_CHANGELOG.md
-   SESSION_CONTEXT.md
-   Phase 7A - Implementation Summary.md

## Definition of Done

-   Context Builder complete
-   Memory Layer complete
-   Evidence Layer complete
-   Prompt Builder complete
-   Safety Layer complete
-   Existing engines unchanged
-   205+ tests passing
-   Clean production build

## Final Instruction

The AI Wealth Advisor in Phase 7B must consume this Context, Memory and
Evidence Layer rather than directly accessing business engines or
databases.
