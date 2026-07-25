# Sprint 1B – Domain Foundation

## Objective

Introduce the ownership model for Family Wealth OS.

This sprint establishes WHO owns financial assets.

Do NOT migrate portfolios or transactions yet.

Do NOT implement Goals, AI Advisor, Tax Engine, or UI redesign.

--------------------------------------------------

Before starting:

Read in order:

1. .ai/SESSION_CONTEXT.md
2. docs/PROJECT_CHARTER.md
3. docs/TARGET_ARCHITECTURE.md
4. docs/DOMAIN_MODEL.md
5. docs/ARCHITECTURE_DECISIONS.md
6. docs/developer_handbook/*
7. docs/DATABASE_MIGRATION_PLAN.md

Confirm compliance with:

- Evolution before Replacement
- Local First
- Privacy First
- Repository Pattern
- DDD
- Definition of Done

--------------------------------------------------

Objective

Create the ownership model only.

Implement:

Family

↓

Family Members

↓

Entities

↓

Accounts

Nothing else.

--------------------------------------------------

Tasks

### Phase 1 – Database

Implement non-destructive schema migration for:

- families
- family_members
- entities
- accounts

Do not migrate existing assets yet.

All migrations must be reversible.

--------------------------------------------------

### Phase 2 – Repository Layer

Create repositories for:

IFamilyRepository

IFamilyMemberRepository

IEntityRepository

IAccountRepository

Provide SQLite implementations.

--------------------------------------------------

### Phase 3 – Domain Services

Implement:

FamilyService

EntityService

AccountService

Business logic only.

No portfolio calculations.

--------------------------------------------------

### Phase 4 – Validation

Introduce Zod validation schemas for all new DTOs.

Reject invalid ownership relationships.

--------------------------------------------------

### Phase 5 – API

Create REST endpoints:

/api/v1/families

/api/v1/family-members

/api/v1/entities

/api/v1/accounts

Use standardized error envelopes.

--------------------------------------------------

### Phase 6 – Tests

Create:

- Unit Tests
- Repository Tests
- Migration Tests

Verify:

- Existing data remains untouched.
- Existing application continues functioning.
- Foreign key integrity passes.
- Rollback works.

--------------------------------------------------

Rules

Do NOT modify:

Portfolio

Assets

Transactions

Dashboard

Goal Engine

Advisor

Tax Engine

No UI changes.

No portfolio migration.

No ownership assignment.

Only establish the ownership foundation.

--------------------------------------------------

Deliverables

- Updated schema
- Migration scripts
- Repositories
- Services
- API endpoints
- Tests
- Updated SESSION_CONTEXT.md
- Updated AI_CHANGELOG.md
- Sprint Retrospective.md

--------------------------------------------------

At the end of the sprint provide:

1. Architecture impact assessment
2. Database migration verification
3. Test summary
4. Risks
5. Exactly ONE recommendation for Sprint 1C

and place it under the summary folder in .md file