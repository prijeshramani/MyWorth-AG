# FINAL TARGETED CORRECTIONS – SPRINT 9.1

## Status

The Sprint 9.1 implementation plan is substantially approved.

Do not redesign the sprint or create another high-level planning cycle.

Make the following targeted corrections and then stop for implementation approval.

---

# 1. VERIFY `ACT_DAT_01` DOES NOT INTRODUCE SPRINT 9.2 RECONCILIATION LOGIC

The plan currently detects:

`sourceFreshness.latestPriceDate > 30 days`

but resolves only when:

> All active asset holdings have market prices synced within 30 days.

Before implementation, explicitly verify that the existing authoritative `sourceFreshness` capability already provides a family-wide signal sufficient for:

- Detection.
- Resolution.
- Identification of the current authoritative freshness state.

## If confirmed

Keep `ACT_DAT_01` and document the exact existing service/data source used.

## If not confirmed

Remove `ACT_DAT_01` as an active producer from Sprint 9.1.

The ranking architecture must still support:

`DATA_INTEGRITY`

but Sprint 9.1 may have zero active Category A producers.

Do not build new:

- Reconciliation logic.
- Family-wide price coverage scanning.
- Missing-price detection infrastructure.

Those belong to Sprint 9.2.

---

# 2. COMPLETE CORRELATION MIDDLEWARE COMPATIBILITY AUDIT

Before modifying `CorrelationMiddleware.ts`, audit existing usages of:

- `CorrelationContext.runWithContext()`
- `CorrelationContext.getFamilyId()`
- Any existing non-JWT family-context establishment

Specifically verify compatibility with:

- Ordinary authenticated family APIs.
- Service-to-service routes.
- Internal/system routes.
- Background processing.
- Import processing.
- Webhooks.
- Administrative functionality.

## Required invariant

For ordinary authenticated family APIs:

`familyId = authenticated JWT user context only`

For trusted non-user execution contexts:

Family context must be established explicitly by trusted server-side code, not by client-controlled headers, query parameters, or request bodies.

Do not accidentally break existing internal execution flows while removing client-controlled tenant selection.

---

# 3. CLARIFY STAGE 3 REQUIRED VS DEFERRED SEMANTICS

Change the wording so that:

> Current FY Tax Regime is required when the user chooses to complete the Tax Baseline stage.

The entire stage may still be deferred.

Deferring it must:

- Not block application usage.
- Not fabricate tax assumptions.
- Leave the authoritative gap active.
- Keep `ACT_TAX_01` available where applicable.

---

# REQUIRED FINAL ACTION

Update the existing `SPRINT_9.1_IMPLEMENTATION_PLAN.md` with these targeted clarifications.

Do not expand scope.

After updating:

1. Confirm whether `ACT_DAT_01` remains an active Sprint 9.1 producer.
2. Confirm the correlation compatibility audit findings.
3. Stop and wait for implementation approval.