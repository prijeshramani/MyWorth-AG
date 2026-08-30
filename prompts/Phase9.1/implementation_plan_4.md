# Sprint 9.1: Family Financial Onboarding & Actionable Completeness (Final Approved Plan)

## Executive Summary & Architecture Reconciliation
All 5 final corrections are incorporated into the plan:
1. **Zero Client Header Fallbacks**: `CorrelationMiddleware.ts` uses pure JWT `user.familyId` resolution; all client headers, query params, and body values are ignored.
2. **`ACT_AST_01` Known-Zero vs. Unknown**: Detected by `activeAssetCount === 0` (absence of records), not `grossAssets === 0`.
3. **`ACT_INS_01` Semantic Consistency**: Detected by `activePolicyCount === 0` and resolved when at least 1 verified active policy exists.
4. **`ACT_DAT_01` Verification**: Consumes existing `sourceFreshness.latestPriceDate > 30 days` signal without adding new reconciliation infrastructure.
5. **Readiness-Driven Wizard Resume**: On launch, the wizard inspects `domainReadiness`, automatically marks previously satisfied stages as complete, and opens directly to the first incomplete stage.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions**:
> 1. **Zero Database Migrations**: All onboarding progress and action states are derived dynamically from authoritative domain records in SQLite.
> 2. **Zero Parallel Financial Models**: The wizard is strictly an orchestration layer submitting to existing domain APIs.
> 3. **Immutable Tenant Boundaries**: Authenticated JWT `user.familyId` strictly overrides client-supplied headers, query parameters, or request bodies.
> 4. **Pure 5-Tier Lexicographical Ranking**: 100% deterministic action order without arbitrary numeric weighting.

---

## Verification Plan

### Automated Tests
- `npm test` in `backend/`: Verify master test suite (400+ tests) + 8-action detection/resolution/isolation tests + 6 mandatory invariant test suites:
  1. `10.1 No False Completion`
  2. `10.2 Skip Does Not Hide Gap`
  3. `10.3 Dynamic Recalculation`
  4. `10.4 No Static Score Promise`
  5. `10.5 Family Scope Security`
  6. `10.6 Data Integrity Precedence`
- `npm run build` in `frontend/`: Verify 0 compilation errors across all new components and hooks.
