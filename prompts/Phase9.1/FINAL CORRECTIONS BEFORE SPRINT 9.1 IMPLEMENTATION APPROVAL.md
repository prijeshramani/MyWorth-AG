# FINAL CORRECTIONS BEFORE SPRINT 9.1 IMPLEMENTATION APPROVAL

## Status

The detailed `SPRINT_9.1_IMPLEMENTATION_PLAN.md` is now substantially complete and the overall architecture is accepted.

Four corrections are required before production implementation begins.

Do not redesign the sprint or expand scope.

---

# 1. REMOVE CLIENT FAMILY-ID FALLBACK FROM PRODUCTION CORRELATION LOGIC

Do not permit:

- `X-Family-Id`
- query `familyId`
- body `familyId`

to determine family scope inside production `CorrelationMiddleware`, including under `NODE_ENV === 'test'`.

## Required behavior

### Authenticated family routes

```text
familyId = req.user.familyId
```

only.

### Unauthenticated/public routes

```text
familyId = undefined
```

Tests must inject authenticated user context through test fixtures/helpers rather than adding client-controlled family selection into production security logic.

---

# 2. CORRECT `ACT_AST_01` KNOWN-ZERO VS UNKNOWN SEMANTICS

Do not detect a missing asset foundation using:

```text
grossAssets === 0
```

A calculated financial value of zero is not equivalent to missing information.

## Required detection

Use one of:

- Explicit authoritative asset-record count.
- Existing completeness status.
- Explicit missing-data signal.

Example:

```text
activeAssetCount === 0
```

The action must mean:

> No authoritative asset information has been entered.

It must not mean:

> Asset value happens to currently equal zero.

---

# 3. MAKE `ACT_INS_01` DETECTION AND RESOLUTION SEMANTICALLY CONSISTENT

The current plan detects:

```text
activeTermCover === 0
```

but resolves when:

> Any active insurance policy exists.

This is inconsistent.

Choose one consistent model.

## Preferred Sprint 9.1 model

### Action

`ACT_INS_01 – Add Protection Information`

### Detection

No relevant active protection information exists according to the existing authoritative protection readiness model.

### Resolution

The authoritative protection readiness condition for this action is satisfied.

Do not allow an unrelated insurance policy to falsely resolve a missing life-cover condition.

If life and health protection require separate actions, defer that finer decomposition until it is supported by the existing readiness model or explicitly introduce it in a later sprint.

---

# 4. CONFIRM `ACT_DAT_01` IS AN EXISTING SIGNAL, NOT NEW SPRINT 9.2 LOGIC

The Category A action based on:

```text
daysOfProxyLag > 30
```

may remain in Sprint 9.1 only if all of the following are true:

1. `daysOfProxyLag` already exists as an authoritative deterministic signal.
2. It can be evaluated family-wide using existing services.
3. No new reconciliation engine or valuation scanning infrastructure is required.

If any condition is false:

> Keep Category A support in `ActionRankingEngine`, but introduce no active Category A producer in Sprint 9.1.

Sprint 9.2 remains responsible for the formal Data Quality & Reconciliation Foundation.

---

# 5. READINESS-DRIVEN WIZARD ENTRY

Refine onboarding behavior for existing families.

The wizard must not blindly force all users through Stage 1 → Stage 4 every time.

## Required behavior

On launch:

```text
Authoritative completeness/readiness
        ↓
Determine completed vs incomplete stages
        ↓
Show incomplete stages as actionable
        ↓
Show completed stages as complete/collapsible
        ↓
Allow optional stages to be skipped/deferred
```

For a genuinely new family, Stage 1 may remain the initial required setup step.

For existing families, previously satisfied stages must not be unnecessarily repeated.

---

# REQUIRED FINAL ACTION

Update `SPRINT_9.1_IMPLEMENTATION_PLAN.md` with the five corrections above.

Then:

1. Confirm the plan remains within the approved Sprint 9.1 scope.
2. Do not add new database migrations.
3. Do not begin implementation until final approval is received.

STOP after updating the plan.