Sprint 8B.0 is ACCEPTED.

The 8B.0 implementation and review are now considered complete:
- Data & Event Contracts: verified
- Correlation & Async Context: verified
- SQLite Idempotency: verified
- Fiduciary Audit Hooks & Event Bus: verified
- Dynamic Family Scope: verified
- TypeScript compilation: clean
- Regression baseline: 238/238 tests passing

Do NOT rebuild or refactor Sprint 8B.0 unless a concrete defect is discovered during Sprint 8B.1 implementation.

Proceed to Sprint 8B.1 – Digital Twin Foundation & State Hydration.

IMPORTANT:
Before writing or modifying production code, produce a detailed implementation plan for review.

The implementation plan must cover:

1. DIGITAL TWIN PURPOSE
   - Define exactly what the Digital Twin represents.
   - Clearly distinguish authoritative source data from derived semantic state.
   - The Digital Twin MUST NOT become a second financial database.
   - SQLite + existing deterministic calculation engines remain the source of truth.

2. DIGITAL TWIN SERVICE
   Design `DigitalTwinService` including:
   - family scope resolution
   - state hydration
   - aggregation of family members
   - assets / liabilities
   - protection
   - goals
   - estate
   - cash/liquidity
   - Knowledge Graph relationships
   - existing calculation-engine outputs
   - data freshness
   - completeness
   - calculation/rule versions

3. DIGITAL TWIN CONTRACT
   Use the existing 8B.0 contracts where applicable.
   Do NOT create duplicate DTO/schema definitions.

   Define the required Digital Twin state structure, including at minimum:
   - family identity/scope
   - family members
   - balance sheet
   - protection
   - goals / trajectory
   - estate
   - graph relationships
   - completeness
   - freshness
   - version metadata
   - generatedAt / snapshot timestamp

4. STATE HYDRATION
   Map every Digital Twin field to its authoritative source.

   Produce a source-of-truth matrix:

   Digital Twin Field | Source Table/Service | Calculation Engine | Freshness | Nullable/Incomplete Behaviour

   Do not invent values or fallback demo data.

5. DATA COMPLETENESS
   Implement a deterministic completeness model.

   IMPORTANT:
   Data completeness must remain separate from:
   - evidence confidence
   - AI interpretation confidence
   - calculation correctness

   Missing information must result in explicit `UNKNOWN`, `NOT_AVAILABLE`, or `INSUFFICIENT_DATA` semantics rather than fabricated values.

6. VERSIONED SNAPSHOTS
   Determine whether 8B.1 requires a persistent snapshot table or whether the first implementation should remain an in-memory/derived representation.

   If persistence is required:
   - define schema
   - versioning
   - family scoping
   - created timestamp
   - source/version metadata
   - idempotency behaviour
   - retention strategy

   Do not duplicate authoritative financial records.

7. KNOWLEDGE GRAPH INTEGRATION
   Reuse the existing Knowledge Graph infrastructure.

   The Digital Twin should consume graph relationships rather than creating a second graph model.

8. EXISTING CALCULATION ENGINES
   Explicitly identify which existing engines/services are reused.

   No financial calculations should be rewritten inside DigitalTwinService.

9. API / REST ENDPOINTS
   Propose the minimum required endpoints, for example:
   - GET Digital Twin
   - GET Digital Twin completeness
   - optional snapshot/history endpoint if justified

   Every endpoint must enforce authenticated family scope.

   A request-provided familyId must NEVER override authorized family context.

10. CORRELATION & AUDIT
    Reuse the 8B.0 infrastructure.

    Digital Twin generation should preserve:
    - correlationId
    - causationId where applicable
    - familyId
    - userId

    Identify which Digital Twin operations require audit records.

11. CACHING / REFRESH
    Define whether Digital Twin state is:
    - generated on demand
    - cached
    - event-invalidated
    - periodically refreshed

    Keep the design simple and appropriate for the current local-first SQLite architecture.

12. TEST STRATEGY
    Build on the 238-test baseline.

    Include tests for:
    - family isolation
    - empty family
    - partial/missing data
    - real Family 6 data
    - deterministic hydration
    - completeness scoring
    - stale data
    - graph integration
    - correlation propagation
    - API authorization
    - snapshot/version behaviour if persistence is introduced
    - regression suite

    Report:
    Previous baseline: 238
    New tests: X
    Current total: XXX
    Failures: 0

13. SECURITY / DATA BOUNDARY
    Explicitly verify:
    - no cross-family leakage
    - no hardcoded family IDs
    - no client-controlled family scope bypass
    - no sensitive data exposed beyond authorized family scope
    - no cloud persistence
    - no external AI service receives raw authoritative financial data unless already approved by architecture

14. PERFORMANCE
    The implementation plan must consider:
    - current dataset size
    - 38 assets
    - 8,005 transactions
    - graph hydration
    - repeated dashboard/API calls

    Avoid unnecessary full-table scans where possible.

15. BUSINESS LOGIC PROTECTION
    This is critical.

    Sprint 8B.1 must NOT modify existing:
    - portfolio valuation logic
    - tax calculations
    - insurance calculations
    - retirement calculations
    - goal calculations
    - estate calculations
    - recommendation rules
    - transaction semantics

    Digital Twin is an orchestration/semantic layer over these existing capabilities.

16. DOCUMENTATION
    Include required updates to:
    - SESSION_CONTEXT.md
    - AI_CHANGELOG.md
    - ROADMAP.md
    - relevant Phase 8 architecture documents

    Also identify the stale documentation issues found during 8B.0 review and update only what is necessary.

DELIVERABLE:

Create:

`prompts/Phase8B.1/SPRINT_8B_1_IMPLEMENTATION_PLAN.md`

The plan must contain:
- Objective
- Scope
- Non-goals
- Existing components reused
- Files to create
- Files to modify
- Database changes, if any
- Contract changes, if any
- API design
- Data-source mapping
- Completeness model
- Security/family-scope model
- Correlation/audit integration
- Test plan
- Performance considerations
- Migration/rollback strategy
- Acceptance criteria
- Risks and mitigations
- Explicit confirmation that existing business logic will not be altered

STOP after producing the implementation plan.

Do NOT implement Sprint 8B.1 yet.