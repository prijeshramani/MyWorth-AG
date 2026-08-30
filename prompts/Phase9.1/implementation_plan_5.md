# Sprint 9.1: Family Financial Onboarding & Actionable Completeness (Final Targeted Revisions)

## Executive Summary & Targeted Clarifications
All three targeted clarifications have been confirmed and applied:

1. **`ACT_DAT_01` & Data Integrity Confirmation**:
   - Audit of `DigitalTwinService.ts` confirms that `sourceFreshness.latestPriceDate` tracks maximum price dates but does not perform full asset-by-asset reconciliation coverage.
   - **Decision**: `DATA_INTEGRITY` (Category A) is fully supported as Rank 1 in `ActionRankingEngine.ts`, but Sprint 9.1 launches with **zero active Category A producers**, leaving formal multi-source reconciliation scanning for Sprint 9.2.
   - Initial active registry consists of **7 verified foundational and enrichment actions** (`ACT_LIN_01`, `ACT_AST_01`, `ACT_INS_01`, `ACT_LIQ_01`, `ACT_TAX_01`, `ACT_EST_01`, `ACT_GOL_01`).

2. **Correlation Middleware Compatibility Audit**:
   - Audited ordinary HTTP routes, public endpoints, background jobs, audit hooks, and test suites.
   - Confirmed that ordinary HTTP requests resolve `familyId` strictly from `req.user.familyId` (zero client header fallbacks), while trusted background/internal contexts establish context via `CorrelationContext.runWithContext()`.

3. **Stage 3 Tax Regime Semantics**:
   - Clarified that Current FY Tax Regime is required *only when the user chooses to complete the Tax Baseline stage*.
   - The entire stage can be skipped/deferred without blocking application usage or fabricating assumptions.

---

## User Review Required

> [!IMPORTANT]
> **Final Architecture Status**:
> 1. **Zero Database Migrations**: All onboarding and action states are derived dynamically from authoritative domain records in SQLite.
> 2. **Zero Parallel Financial Models**: The wizard is strictly an orchestration layer calling existing domain APIs.
> 3. **Pure 5-Tier Lexicographical Ranking**: 100% deterministic action order without arbitrary numeric weighting.
> 4. **Tenant Isolation**: Authenticated JWT `user.familyId` strictly governs tenant boundaries.

---

## Verification Plan

### Automated Tests
- `npm test` in `backend/`: Verify master test suite (400+ tests) + 7-action detection/resolution/isolation tests + 6 mandatory invariant test suites:
  1. `10.1 No False Completion`
  2. `10.2 Skip Does Not Hide Gap`
  3. `10.3 Dynamic Recalculation`
  4. `10.4 No Static Score Promise`
  5. `10.5 Family Scope Security`
  6. `10.6 Data Integrity Precedence`
- `npm run build` in `frontend/`: Verify 0 compilation errors across all new components and hooks.
