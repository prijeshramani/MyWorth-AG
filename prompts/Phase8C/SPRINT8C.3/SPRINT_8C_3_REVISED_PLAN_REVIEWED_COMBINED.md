# Sprint 8C.3 – Revised Implementation Plan Review & Consolidated Agent Instructions

## Review Decision

**Status: REQUIRES ONE MORE PLAN REVISION BEFORE CODING.**

The revised plan is materially better and addresses important historical reconstruction concerns. However, the Financial Time Machine is a high-integrity feature, and several critical semantics remain underspecified—especially the distinction between **historical economic state** and **what the system knew at that time**, prevention of future-data leakage, and the definition of the What-If simulation model.

**No production code should be modified until the items below are incorporated into the implementation plan.**

---

## 1. What Is Good in the Revised Plan

The following decisions are approved and should be retained:

1. The Time Machine is explicitly based on authoritative historical data rather than the Timeline projection.
2. Proxy valuation freshness is versioned through `TIME_MACHINE_RULE_REGISTRY`.
3. Expired price proxies do not silently masquerade as current market values.
4. `SUM_ASSURED` remains protection coverage and is never included in net worth.
5. Fixed Deposits are reconstructed using the existing authoritative FD valuation logic.
6. Cross-family isolation, deterministic hashing and zero-write What-If behavior are included as invariants.
7. The plan recognises that sparse historical data requires explicit provenance and missing-data semantics.
8. Existing 348 tests remain the regression baseline.

---

# 2. REQUIRED PLAN CHANGES

## R1 – Define the Core Time Semantics Precisely

The executive summary currently asks:

> “What did FamilyWealthOS know about the family's financial position at a particular point in time?”

But the proposed implementation mainly filters business-effective dates such as `date <= asOfDate`.

These are **not automatically the same concept**.

The revised plan must explicitly define which reconstruction mode Sprint 8C.3 implements.

### Required decision

Sprint 8C.3 should implement:

**Historical Economic State as of `asOfDate`**

using authoritative records whose **effective/business dates** are on or before `asOfDate`.

It must **not claim** that the reconstruction represents exactly what the application database knew on that historical day unless valid system-time/audit history exists for every required domain.

### Required API metadata

The response must expose a reconstruction basis such as:

- `reconstructionMode: 'HISTORICAL_ECONOMIC_STATE'`
- `knowledgeTimeStatus: 'NOT_FULLY_RECONSTRUCTABLE'` where applicable

Do not introduce fake precision.

---

## R2 – Future Leakage Requires More Than `date <= asOfDate`

The plan must define a **domain-specific future leakage policy**.

For every reconstructed record, the implementation must use the correct effective date and must not accidentally use later information to describe an earlier state.

Examples requiring explicit rules:

- transactions: transaction/trade/effective date
- asset prices: price date
- FD: start date, maturity date and valuation rules
- insurance: policy effective start/end/lapse/surrender dates where fields exist
- goals: effective creation/completion state only where historical state is actually available
- estate records: effective/registered date
- tax: financial-year applicability, not merely record creation time

### Important

If a table has only a current-state record and no history, Sprint 8C.3 must **not invent its historical attributes**.

Return the appropriate provenance/status instead.

---

## R3 – All Repository Queries Must Be Family-Scoped

Do not introduce repository methods such as:

`findByAssetIdAsOf(assetId, asOfDate)`

unless the method is impossible to misuse across families.

Preferred signatures:

- `findByAssetIdAsOf(familyId, assetId, asOfDate)`
- `findPriceOnDate(familyId, assetId, asOfDate)`
- `findPriceAsOf(familyId, assetId, asOfDate, policy)`

If `asset_id` is globally unique, the implementation must still document and enforce the family ownership boundary.

**Cross-family isolation must be guaranteed in SQL predicates, not only by controller assumptions.**

---

## R4 – Define Historical Holdings Reconstruction Completely

“Transactions reconstruct quantity owned” is insufficient.

The plan must specify:

1. supported transaction types;
2. BUY/SELL sign conventions;
3. partial disposals;
4. zero or negative quantity handling;
5. transaction ordering when multiple transactions occur on the same day;
6. whether fees affect cost basis;
7. unsupported transaction types;
8. whether corporate actions, splits, dividends, transfers and mergers are historically supported.

### Mandatory fail-safe rule

Unsupported historical transformations must not silently produce an apparently precise quantity.

They must produce explicit `PARTIAL`, `INSUFFICIENT_DATA`, or `HISTORICAL_SOURCE_UNAVAILABLE` semantics as appropriate.

---

## R5 – Cost Basis and Unrealized Gain/Loss Need Explicit Historical Rules

The plan proposes `costBasis` and `unrealizedGainLoss`, but does not define how they are calculated.

The revised plan must state:

- cost basis methodology used;
- whether it reuses an existing authoritative calculation engine;
- treatment of partial disposals;
- whether realised gains are excluded from unrealised gain/loss;
- currency handling for US assets;
- status when cost basis cannot be reconstructed.

Do not create a second independent capital-gains engine if an authoritative engine already exists.

If no authoritative historical tax-lot logic exists, expose the limitation instead of inventing tax-grade precision.

---

## R6 – Proxy Valuation Policy Must Be Deterministic and Auditable

`findPriceAsOf` must return more than a number.

It should return a structured result containing at minimum:

- valuation amount;
- valuation date;
- requested `asOfDate`;
- `daysOfProxyLag`;
- valuation type;
- provenance;
- applied rule code/version;
- status or missing-data reason.

### Required precedence

1. Exact historical market price.
2. Nearest prior valid price within the asset-class freshness window.
3. Historical acquisition cost only when explicitly available and permitted by policy.
4. `HISTORICAL_SOURCE_UNAVAILABLE`.

**Never use a future price as a proxy for an earlier date.**

---

## R7 – Acquisition Cost Fallback Must Not Be Mislabelled as Market Value

When the valuation falls back to acquisition cost:

- `valuationType` must remain `ACQUISITION_COST`;
- provenance must explicitly indicate `KNOWN_ACQUISITION_COST`;
- it must not be presented as historical market value;
- `unrealizedGainLoss` must be null/unknown where market valuation is unavailable.

The UI/API consumer must be able to distinguish a market-valued holding from a cost-valued holding.

---

## R8 – Fixed Deposit Lifecycle Must Cover More Cases

The plan should explicitly define:

- pre-start exclusion;
- active accrual;
- maturity handling;
- premature closure if historical data exists;
- reinvestment/renewal boundaries if represented in the data;
- valuation-date normalization consistent with the existing `fdValuation` hardening.

Do not assume that every FD remains active indefinitely after `startDate`.

Where lifecycle history is unavailable, return explicit reconstruction limitations.

---

## R9 – Insurance Reconstruction Needs Full Historical Applicability Rules

`start_date <= asOfDate` alone is insufficient.

The plan must inspect the actual available insurance fields and define what can genuinely be reconstructed, including where available:

- policy start/effective date;
- maturity date;
- policy status;
- lapse;
- surrender;
- premium schedule;
- historical surrender value.

### Mandatory invariant

`SUM_ASSURED` remains outside net worth under all circumstances.

If historical surrender value or market-linked value is unavailable, do not derive one without an approved authoritative valuation method.

---

## R10 – Tax Historical Semantics Need a Dedicated Boundary

The current statement:

> `tax_profiles` scoped by `financial_year` matching `asOfDate`

is too ambiguous.

The revised plan must define:

1. how an `asOfDate` maps to the applicable Indian financial year;
2. whether the Time Machine reconstructs only tax configuration/readiness or actual tax liability;
3. which historical tax inputs are genuinely available;
4. what happens when the applicable FY record is absent;
5. that future FY records must never leak into earlier reconstruction.

Tax calculation must continue to be owned by `TaxCalculationEngine`.

The Time Machine orchestrates historical inputs; it must not duplicate tax mathematics.

---

## R11 – Estate and Goals Must Respect Historical Data Limitations

Current-state tables may not provide full change history.

Therefore:

- a record created after `asOfDate` must not appear;
- a record existing before `asOfDate` may be included only to the extent its historical effective state is known;
- current values/statuses must not be projected backward without evidence.

The plan must explicitly mark domains as partial where complete historical state cannot be reconstructed from available data.

---

# 3. WHAT-IF SIMULATION – MAJOR REQUIRED EXPANSION

## R12 – Define Supported Scenario Types for Sprint 8C.3

“Project corpus, readiness %, Tax Savings” is too broad and risks an implementation based on assumptions.

The plan must define a **closed, explicit scenario catalogue**.

For each scenario type, specify:

- input schema;
- authoritative baseline data;
- deterministic formula/engine;
- output fields;
- assumptions;
- unsupported cases.

Do not implement an open-ended natural-language simulation engine.

### Suggested initial bounded scope

Only include scenarios that can be calculated deterministically from existing authoritative services, for example:

- additional recurring investment;
- one-time investment;
- retirement age adjustment;
- goal contribution adjustment;
- tax-regime comparison **only when complete required inputs are available**.

Protection or insurance scenarios should only be included if existing authoritative models support them.

---

## R13 – What-If Must Be an Explicit Sandbox Overlay

The architecture must be:

`Authoritative Baseline -> Deep Clone / Immutable Input -> Scenario Overlay -> Deterministic Simulation -> Result`

### Mandatory invariants

The simulation must perform:

- zero INSERT;
- zero UPDATE;
- zero DELETE;
- zero migration;
- zero mutation of singleton/global cached family state.

The test should verify database source-table row counts/checksums before and after simulation where practical, not merely mock repository write methods.

---

## R14 – Baseline Date for What-If Must Be Explicit

The revised plan must answer:

- Is What-If based only on the current live state?
- Can it use a Time Machine reconstructed historical baseline?

Recommended Sprint 8C.3 boundary:

**What-If baseline = current authoritative state by default.**

Historical-baseline What-If should only be supported if the reconstruction result is sufficiently complete and the API explicitly supplies/requests that baseline.

Do not silently mix current data with an old `asOfDate`.

---

## R15 – Simulation Outputs Must Carry Assumptions and Confidence

Every What-If result must include:

- baseline identifier/state hash;
- calculation version;
- rule versions;
- assumptions used;
- completeness/confidence status;
- unsupported or missing inputs;
- whether tax savings are `CALCULATED`, `INSUFFICIENT_DATA`, or `UNKNOWN`.

A scenario must never return `₹0 tax savings` merely because required information was unavailable.

---

# 4. API AND SECURITY REQUIREMENTS

## R16 – Request Validation

Define strict Zod validation for:

### Historical endpoint
- ISO date format;
- valid calendar date;
- timezone/day normalization policy;
- future-date policy.

### What-If endpoint
- strict discriminated scenario schema;
- finite non-negative monetary values;
- maximum reasonable scenario horizon;
- rejection of unknown fields where project conventions require strictness.

---

## R17 – Future `asOfDate` Policy

The plan must explicitly decide whether future dates are:

- rejected; or
- treated as current date.

**Recommended: reject future `asOfDate` with a deterministic validation error.**

Do not silently clamp a requested future date to today.

---

## R18 – Family Scope Must Come Only From Server Context

The controller must:

- resolve `familyId` from authenticated/correlation context;
- never trust a client-supplied family identifier;
- reject mismatched family parameters where applicable.

All repository operations must preserve this scope.

---

## R19 – Idempotency Middleware Applies Only Where Semantically Appropriate

The plan currently says routes use idempotency middleware.

Clarify this.

- `GET /time-machine` is naturally read-only and should not require idempotency middleware.
- `POST /what-if` is also computationally read-only but may use request idempotency only if existing API conventions require deterministic replay/caching.
- No idempotency implementation should persist results unless that persistence is explicitly designed and remains outside the zero-write sandbox invariant.

---

# 5. DETERMINISTIC HASHING REQUIREMENTS

## R20 – Define Exactly What Enters `stateHash`

The plan must define canonical hashing over deterministic business state, for example:

- family ID;
- normalized `asOfDate`;
- reconstruction mode;
- supported domain states;
- holdings and quantities;
- valuation dates/types/provenance;
- protection state;
- domain reconstruction statuses;
- calculation/rule versions.

### Explicitly exclude

- request timestamps;
- generated UUIDs;
- response generation timestamps;
- database row insertion timestamps unless they are genuine business state inputs.

The canonical ordering of arrays and object keys must be deterministic.

---

# 6. DOMAIN COMPLETENESS AND RESPONSE CONTRACT

## R21 – Add a Top-Level Reconstruction Completeness Model

The response should not expose a single precise net-worth number without explaining missing domains.

Add explicit:

- per-domain status;
- top-level completeness score/status;
- missing-data reasons;
- domains included/excluded from net worth;
- valuation provenance summary.

This should reuse existing Phase 8C status/provenance vocabulary wherever possible instead of creating parallel enums.

---

## R22 – Define Net Worth Inclusion Rules Centrally

The plan must state exactly which reconstructed values are included in net worth.

At minimum:

### Included when valid
- market/accrued/ledger values according to authoritative valuation rules.

### Never included
- insurance `SUM_ASSURED`.

### Conditional
- acquisition-cost fallback may be included only with explicit `ACQUISITION_COST` labelling and provenance.

The aggregate response must expose whether total net worth contains any non-market proxy/cost values.

---

# 7. TEST PLAN MUST BE EXPANDED

The current proposed test list is a good start but is not sufficient.

## Required invariant tests

### Historical boundary
1. Exact `asOfDate` price is preferred.
2. Nearest prior price is used only within freshness policy.
3. Future price is never used.
4. Expired proxy falls back correctly.
5. Missing acquisition cost produces explicit unavailable status.
6. Future-dated transaction does not affect historical holdings.
7. Same-day transaction ordering is deterministic.
8. Unsupported transaction transformation does not silently fabricate holdings.

### Valuation and domain semantics
9. Acquisition-cost fallback is never labelled market value.
10. Unrealised gain/loss is null/unknown without a valid market valuation.
11. FD pre-start exclusion.
12. FD active valuation.
13. FD maturity/lifecycle behavior.
14. Insurance `SUM_ASSURED` is never included in net worth.
15. Historical insurance limitations are surfaced explicitly.
16. Tax FY boundary mapping is deterministic.
17. Estate/goal records created after `asOfDate` do not leak backward.

### Integrity and security
18. Cross-family source collision isolation.
19. Every repository query remains family-scoped.
20. Historical reconstruction performs zero source-table writes.
21. What-If performs zero database writes.
22. What-If does not mutate the supplied baseline object.
23. Repeated identical reconstruction produces identical `stateHash`.
24. Volatile timestamps do not alter `stateHash`.
25. Future `asOfDate` is rejected.
26. Invalid dates are rejected.
27. Missing-data status is preserved rather than converted to numeric zero.

### What-If
28. Scenario overlay does not alter authoritative baseline.
29. Unsupported scenario types fail validation.
30. Missing critical inputs return `INSUFFICIENT_DATA`, not fabricated savings.
31. Results contain baseline hash and assumptions.
32. Tax comparison delegates to the authoritative tax engine.

---

# 8. PERFORMANCE AND OPERATIONAL GUARDRAILS

## R23 – Avoid N+1 Reconstruction Queries

The plan should identify expected query patterns and avoid:

- one price query per holding when a bulk repository method is practical;
- repeated transaction queries per asset where family/date range queries can be aggregated.

Correctness comes first, but the architecture should not accidentally create an N+1 query pattern.

## R24 – Define a Realistic Performance Budget

Keep the proposed performance testing, but measure a representative seeded family with multiple assets and transactions.

Do not treat an empty or tiny test dataset as proof of production performance.

---

# 9. DOCUMENTATION REQUIREMENTS

The implementation must create/update:

1. `docs/FINANCIAL_TIME_MACHINE.md`
2. Scenario catalogue and assumptions for What-If simulation.
3. Historical data availability matrix showing:
   - source table;
   - effective-date field;
   - historical limitations;
   - reconstruction status behavior.
4. `SESSION_CONTEXT.md`
5. `AI_CHANGELOG.md`
6. `docs/PHASE_8_ROADMAP.md`
7. Sprint output review document.

The architecture documentation must clearly distinguish:

**Historical Economic State** from **System Knowledge at Historical Time**.

---

# 10. APPROVED IMPLEMENTATION BOUNDARY

## In Scope

- Point-in-time reconstruction from available authoritative data.
- Explicit provenance and missing-data semantics.
- Historical holdings reconstruction within supported transaction semantics.
- Exact/prior historical price resolution with versioned freshness rules.
- FD historical valuation using authoritative valuation logic.
- Historical protection reconstruction without adding `SUM_ASSURED` to net worth.
- Bounded deterministic What-If scenarios.
- In-memory immutable sandbox execution.
- Zero-write invariants.
- Family isolation and deterministic hashing.

## Explicitly Out of Scope Unless Existing Authoritative Support Already Exists

- Fabricated historical account balances.
- Full system-time reconstruction of “what the application knew then.”
- Unsupported corporate-action reconstruction.
- AI-generated financial assumptions.
- Open-ended natural-language scenario execution.
- A second independent tax engine.
- Persistent What-If scenario storage.
- Silent substitution of missing data with zero.

---

# 11. INSTRUCTIONS TO THE AGENT

Please revise the Sprint 8C.3 implementation plan to incorporate every **R1–R24** requirement above.

### Mandatory workflow

1. **Do not modify production code yet.**
2. Inspect the actual existing schema, migrations, repositories and authoritative engines before finalising table/field assumptions.
3. Update `prompts/Phase8C/SPRINT_8C_3_IMPLEMENTATION_PLAN.md`.
4. Include an explicit historical data availability matrix.
5. Include the exact bounded What-If scenario catalogue for Sprint 8C.3.
6. Include repository method signatures showing family scope.
7. Include the deterministic state-hash input contract.
8. Include the expanded invariant test matrix.
9. Clearly document anything the current data model cannot reconstruct.
10. Stop after producing the revised implementation plan and wait for approval.

## Final Acceptance Gate

The next implementation plan must demonstrate that:

- no historical state is fabricated;
- no future data leaks backward;
- missing data is visible and not converted to zero;
- `SUM_ASSURED` never enters net worth;
- What-If remains a true zero-write sandbox;
- tax and other domain mathematics remain owned by their authoritative engines;
- all data access is family-scoped;
- deterministic hashes and results are reproducible.

**Only after this revised plan is reviewed and approved should Sprint 8C.3 implementation begin.**
