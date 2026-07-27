# Sprint 6A – Application Service Layer (Architecture & Design)

Architecture Review Board Status:

Architecture v2 Review APPROVED.

Program Increment 1 CLOSED.

Begin Phase 4.

--------------------------------------------------

Objective

Design the Application Service Layer.

This sprint is Architecture & Design ONLY.

Do NOT implement production code.

Do NOT create REST controllers.

--------------------------------------------------

Read:

- SESSION_CONTEXT.md
- AI_CHANGELOG.md
- ARCHITECTURE_V2_REVIEW.md
- APPLICATION_SERVICE_ARCHITECTURE.md
- ENGINE_ORCHESTRATION_ARCHITECTURE.md
- SNAPSHOT_COORDINATION_MODEL.md
- ROADMAP_V2.md

--------------------------------------------------

Create

1. APPLICATION_SERVICE_DOMAIN_MODEL.md
2. PORTFOLIO_APPLICATION_SERVICE.md
3. SNAPSHOT_ORCHESTRATION.md
4. DTO_STRATEGY.md
5. APPLICATION_SERVICE_SEQUENCE_DIAGRAMS.md
6. APPLICATION_SERVICE_AUDIT_MODEL.md
7. SPRINT_6A_IMPLEMENTATION_PLAN.md

--------------------------------------------------

Design

PortfolioApplicationService

DashboardApplicationService

SnapshotCoordinator

ImportApplicationService

ReportingApplicationService

--------------------------------------------------

Responsibilities

- Repository orchestration
- Engine orchestration
- Snapshot lifecycle
- DTO mapping
- Transaction boundaries
- Error propagation
- Audit propagation

--------------------------------------------------

Future Extensions

Documentation only:

- Event Bus
- CQRS
- Background Jobs
- Notification Pipeline
- Workflow Orchestration

--------------------------------------------------

Rules

Do NOT implement REST APIs.

Do NOT modify repositories.

Do NOT modify financial engines.

Preserve Architecture v2.

--------------------------------------------------

Update

- SESSION_CONTEXT.md
- AI_CHANGELOG.md

Provide:

1. Executive Summary
2. Implementation Plan
3. Exactly ONE recommendation before implementation begins.