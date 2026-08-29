# Sprint 8C.3 Final Output Review – Required Hardening

## Review Decision

**Status: NOT APPROVED FOR CLOSURE YET.**

The implementation is substantially complete and the reported **383/383 passing tests** is a strong result. However, review of the actual implementation files found **three blocking issues** that must be corrected before Sprint 8C.3 is closed.

No new sprint should start until these corrections are completed and verified.

---

# What Was Verified Successfully

- Missing historical values use `null` with `INSUFFICIENT_DATA`; numeric zero is not fabricated.
- Matured FDs without evidence of renewal/redemption have `null` value and are excluded from net worth.
- Insurance `SUM_ASSURED` is isolated in `protectionShield`.
- Future prices, goals, estate records and future tax-year data are tested against backward leakage.
- State hashing uses deterministic canonical serialization and SHA-256.
- The implementation contains the planned 35 Sprint 8C.3 invariant tests, with the reported baseline moving from 348 to 383.

---

# BLOCKER 1 – Family Scope Enforcement Is Not Production-Safe

## Actual implementation

`TimeMachineController.resolveAuthorizedFamilyId()` currently resolves:

```text
CorrelationContext.getFamilyId()
OR x-family-id request header
OR 1
```

This violates the Phase 8 rule that family scope must be derived from authenticated/server-side context.

## Required correction

1. `CorrelationContext.getFamilyId()` or the approved authenticated session identity is authoritative.
2. `x-family-id` must NOT establish authorization.
3. Remove hard-coded fallback `|| 1`.
4. If no authorized family context exists, fail closed.
5. A client-supplied `familyId` may only be a consistency check and must never select family scope.

### Required tests

- no family context -> rejected;
- forged `x-family-id` cannot select another family;
- query `familyId` mismatch -> 403;
- valid server context -> correct family only.

**This is a security blocker.**

---

# BLOCKER 2 – Tax What-If Still Fabricates Income

In `TAX_REGIME_OPTIMIZATION_SCENARIO`, if `salaryIncome` is missing but a tax profile exists, the implementation assigns:

```text
grossIncome = 1500000
```

A PAN/tax profile does not prove ₹15 lakh income.

## Required correction

Remove this fallback completely.

If verified authoritative income is unavailable, return:

- `status: INSUFFICIENT_DATA`
- `taxSavingsBenefit: null`
- explicit `missingDataReason`

### Required tests

1. tax profile exists but no verified income -> `INSUFFICIENT_DATA`;
2. explicit valid salary income -> deterministic result;
3. no tax profile and no income -> `INSUFFICIENT_DATA`.

**This is a fiduciary correctness blocker.**

---

# BLOCKER 3 – What-If Zero-Write Test Is Too Narrow

The test claims:

> What-If simulation executes 0 database writes across all tables

but currently compares counts for only:

- `transactions`
- `assets`
- `financial_goals`

That does not prove zero writes across all relevant tables.

## Required correction

Strengthen verification by capturing mutation-sensitive fingerprints/checksums before and after simulation across all relevant source tables.

Run all five What-If scenarios and verify no INSERT, UPDATE or DELETE changed source state.

Include relevant tables such as:

- assets
- transactions
- asset_prices
- financial_goals
- goal_allocations
- retirement_profiles
- projection_assumptions
- tax_profiles
- tax_deductions
- any other table touched by a scenario path

Also verify the supplied/reconstructed baseline object remains unchanged.

---

# HARDENING 4 – Route Middleware Consistency

`timeMachineRoutes.ts` currently shows plain routes and no visible `idempotencyMiddleware` for POST `/what-if`.

Inspect existing project conventions and align this endpoint with the approved idempotency architecture.

Document clearly whether route-level idempotency persistence is infrastructure state outside the simulation model.

Recommended distinction:

- simulation engine: zero domain/source writes;
- route-level idempotency: documented infrastructure behaviour, if required by platform convention.

---

# HARDENING 5 – Hidden Scenario Assumptions Need Provenance

The What-If engine contains defaults such as:

- 12% equity return;
- 6% inflation;
- ₹25,000 default SIP;
- ₹1 crore target corpus adjustment;
- 10% goal step-up.

These must not be invisible.

For every scenario:

1. return defaults in `assumptionsUsed`;
2. include provenance:
   - `USER_PROVIDED`
   - `FAMILY_PROFILE`
   - `SYSTEM_ASSUMPTION`;
3. prefer existing family assumptions where available;
4. do not present system-default simulations as personalized fiduciary recommendations.

---

# HARDENING 6 – Historical What-If Baseline Completeness

The engine supports `baselineAsOf` and reconstructs historical state.

If that baseline is `INSUFFICIENT_DATA` or materially incomplete, the simulation must not silently present its output as fully authoritative.

Return either:

- `INSUFFICIENT_DATA`; or
- explicit baseline limitation metadata in the simulation result.

---

# Required Agent Action

## Production changes are approved only for these corrections

1. Fix family scope authorization.
2. Remove fabricated ₹15 lakh tax income fallback.
3. Strengthen zero-write verification.
4. Align POST route idempotency handling with project architecture.
5. Add What-If assumption provenance.
6. Handle incomplete historical baselines explicitly.
7. Add/update tests.
8. Run backend master tests and backend/frontend `tsc --noEmit`.
9. Update output review, `SESSION_CONTEXT.md`, and `AI_CHANGELOG.md`.

## Stop condition

After completing these corrections:

**STOP and provide the updated Sprint 8C.3 output. Do not start Sprint 8C.4.**

---

# Final Position

Sprint 8C.3 is **very close to closure**.

The historical reconstruction work, null semantics, FD maturity guardrail, protection isolation and invariant structure are strong.

However, these must be corrected before sign-off:

1. **Client-controlled family scope fallback**
2. **Fabricated ₹15 lakh tax income**
3. **Overstated zero-write verification**

After those corrections and a green test run, Sprint 8C.3 can proceed to final closure review.
