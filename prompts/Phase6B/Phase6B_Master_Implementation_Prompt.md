# Phase6B_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 6B

## Estate Planning, Legacy & Wealth Succession

Mission: Build a complete Estate Planning domain that consumes the
Knowledge Graph from Phase 6B.0.

## Rules

-   Reuse Knowledge Graph.
-   No duplicate relationship logic.
-   Respect RBAC, audit logging and family_id.
-   Do not modify financial engines.

## Modules

1.  Estate Dashboard (Estate Value, Estate Health Score, Alerts,
    Timeline)
2.  Estate Asset Registry (reuse existing assets only)
3.  Will Management (versions, executor, witnesses, registration, review
    reminders)
4.  Trust Management (family/private/charitable trusts, trustees,
    beneficiaries)
5.  Beneficiary Engine (nominee vs beneficiary vs legal heir)
6.  Estate Distribution Simulator (death scenarios, inheritance
    simulation)
7.  Estate Health Score (nominee, executor, will, trust, documents,
    liquidity)
8.  Emergency Mode (contacts, insurance, CA, lawyer, critical docs)
9.  Digital Vault Expansion (will, trust deed, POA, succession docs)

## Database

Migration: 008_estate_planning.ts

Tables: estate_profiles wills will_versions executors trusts trustees
beneficiaries estate_alerts estate_reviews estate_simulations

Reference Knowledge Graph IDs.

## Backend

EstateRepository WillRepository TrustRepository BeneficiaryRepository
EstateSimulationService EstateHealthService EmergencyModeService
EstateController

## APIs

GET /api/v1/estate/dashboard GET /api/v1/estate/health GET
/api/v1/estate/simulation/{scenario} GET /api/v1/estate/wills GET
/api/v1/estate/trusts POST /api/v1/estate/will POST /api/v1/estate/trust
POST /api/v1/estate/simulation

## Frontend

Estate Dashboard Will Manager Trust Manager Beneficiary Manager Estate
Simulator Estate Timeline Emergency Mode Estate Alerts

Reuse existing UI components.

## Knowledge Graph Integration

Consume existing graph for owners, nominees, beneficiaries, executors,
trustees, documents and policies. No duplicate relationship tables.

## AI Readiness

Provide reusable estate query services for future AI Advisor.

## Tests

Target 178+ tests. Existing 169 tests remain green.

## Documentation

ESTATE_ARCHITECTURE.md WILL_MANAGEMENT_GUIDE.md
TRUST_MANAGEMENT_GUIDE.md ESTATE_SIMULATION_ENGINE.md
ESTATE_HEALTH_SCORE.md EMERGENCY_MODE_GUIDE.md
Sprint_6B_Retrospective.md AI_CHANGELOG.md SESSION_CONTEXT.md Phase 6B -
Implementation Summary.md

## Definition of Done

Estate dashboard, wills, trusts, beneficiaries, simulator, emergency
mode complete. Graph reused. Clean build. All tests passing.

Final instruction: Build Estate Planning on top of the Knowledge Graph
and optimize for explainability, auditability, maintainability and
future AI integration.
