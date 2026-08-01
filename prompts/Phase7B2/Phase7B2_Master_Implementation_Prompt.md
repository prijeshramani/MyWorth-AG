# Phase7B2_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 7B.2

## AI Actions & Interactive Simulations

**Mission:** Transform the AI Wealth Advisor from an explanation engine
into a decision-support assistant using safe simulations and
user-confirmed actions.

## Mandatory Architecture

-   AI never performs financial calculations.
-   AI consumes Context, Evidence, Recommendation and Skill layers only.
-   AI never queries raw database tables.
-   Every action is preview-first and fully auditable.

## 1. Action Registry (Mandatory)

Register every executable capability.

Each action defines: - Action ID - Owner Engine - Required Context -
Required Evidence - Required Permissions - Confirmation Required - Undo
Support - Audit Event - Risk Level - Expected Duration

Examples: - Refresh Portfolio - Recalculate Tax - Refresh Knowledge
Graph - Generate ITR JSON - Refresh AI Context - Run Retirement
Simulation - Refresh Recommendations

AI must resolve actions through the Action Registry.

## 2. Interactive What-if Engine

Support simulations for: - SIP increase/decrease - One-time investment -
Retirement age - Goal amount - Goal date - Inflation assumptions - Tax
investments - Insurance coverage - Emergency fund

No persistent data changes.

## 3. Scenario Comparison

Support: - Base - Optimistic - Conservative - Custom

Provide side-by-side comparison.

## 4. AI Action Center

Create: - Pending Actions - Draft Actions - Recommended Actions -
Completed Actions - Scheduled Actions - Dismissed Actions

## 5. Safe Execution Workflow

Explain → Preview → Impact Analysis → User Confirmation → Execute →
Audit Log → Undo (where supported)

## 6. Recommendation Impact Preview

Display: - Financial benefit - Risk - Goal impact - Tax impact -
Retirement impact - Cashflow impact - Timeline

## 7. AI Audit Trail

Capture: - Question - Skills Used - Actions Proposed - User Decision -
Evidence Used - Timestamp - Execution Result

## 8. Conversation Timeline

Maintain searchable history of: - Conversations - Simulations -
Recommendations - Actions - Follow-ups

## 9. Governance Repository (Mandatory)

Create:

governance/ - ADR/ - DECISIONS.md - SECURITY.md - PRIVACY.md -
DATA_RETENTION.md - VERSIONING.md - API_GUIDELINES.md -
CODING_STANDARDS.md

## 10. Product Governance (Mandatory)

Every completed sprint updates: - ROADMAP.md - product/UX_BACKLOG.md -
product/BETA_BUGS.md - product/FEATURE_REQUESTS.md -
product/AI_BACKLOG.md - product/RELEASE_NOTES.md -
product/KNOWN_LIMITATIONS.md - AI_CHANGELOG.md - SESSION_CONTEXT.md

## Documentation

Generate: - ACTION_REGISTRY.md - AI_ACTION_CENTER.md -
WHAT_IF_ENGINE.md - SIMULATION_ENGINE.md - AI_AUDIT_TRAIL.md -
GOVERNANCE_GUIDE.md - Sprint_7B2_Retrospective.md - AI_CHANGELOG.md -
SESSION_CONTEXT.md - Phase 7B2 - Implementation Summary.md

## Acceptance Criteria

-   Action Registry implemented
-   Interactive simulations complete
-   AI Action Center operational
-   Governance repository created
-   Existing 215+ tests remain green
-   Target 225+ tests
-   Clean production build

## Final Instruction

Build an AI that helps users make informed decisions through explainable
simulations and safe execution workflows. Never bypass existing engines
or governance processes.
