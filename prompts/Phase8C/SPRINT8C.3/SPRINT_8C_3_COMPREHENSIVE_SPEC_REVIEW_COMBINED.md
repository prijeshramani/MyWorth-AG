# Sprint 8C.3 – Final Comprehensive Specification Review

## Review Decision

**Status: NOT APPROVED FOR IMPLEMENTATION YET.**

This revision contains several good corrections, but it is **not a complete implementation plan**. The submitted file is only a high-level specification of approximately four sections and omits many mandatory sections requested in the previous review.

Most importantly, it still does not demonstrate the required schema inspection and historical-data capability analysis.

**The Agent must provide one complete implementation plan before production coding begins.**

---

# 1. What Has Improved

The following are positive and should be retained:

1. Explicit `HISTORICAL_ECONOMIC_STATE` reconstruction mode.
2. Explicit acknowledgement that full historical system-knowledge reconstruction is not available.
3. Family-scoped repository method signatures.
4. Deterministic transaction ordering using `date ASC, id ASC`.
5. WAC cost-basis direction.
6. Explicit acquisition-cost provenance.
7. Explicit `SUM_ASSURED` exclusion from net worth.
8. A bounded What-If scenario catalogue.
9. Delegation intent to authoritative services such as:
   - `ProjectionEngineService`
   - `RetirementPlanningService`
   - `GoalPlanningService`
   - `TaxCalculationEngine`
10. Retention of the 348-test regression baseline.

---

# 2. BLOCKER – THIS IS NOT YET A COMPLETE IMPLEMENTATION PLAN

The document claims to be a:

> “Final Comprehensive Specification”

but it does not include the actual implementation details required for approval.

It currently contains only:

- executive summary;
- selected architectural invariants;
- a summary statement about 35 tests;
- basic verification commands.

It does **not** contain:

- schema and capability verification;
- historical data availability matrix;
- detailed proposed file changes;
- actual contracts;
- API request/response design;
- domain reconstruction algorithms;
- state hash contract;
- missing-data response model;
- net-worth inclusion matrix;
- detailed What-If schemas;
- domain-specific future leakage rules;
- full test matrix;
- documentation plan;
- implementation sequence.

Therefore, the Agent should **not begin coding from this document**.

---

# 3. REQUIRED COMPLETE PLAN SECTIONS

The next revision must include all sections below.

## A. Actual Schema & Capability Verification

Before proposing implementation, inspect the existing codebase and provide a matrix:

| Domain | Actual source table/service | Family scope | Effective date field | Historical capability | Known limitation |
|---|---|---|---|---|---|

Cover at minimum:

- Portfolio transactions
- Asset holdings
- Historical prices
- Fixed deposits
- Cash/bank balances
- Insurance
- Goals
- Estate
- Tax
- Life events where relevant

### Critical rule

Do not state that transaction types are “actual supported types” unless the Agent has inspected and cites the actual enum/schema from the project.

The plan currently lists:

`BUY`, `SELL`, `REINVEST`, `DIVIDEND`, `INTEREST`, `BONUS`, `CREDIT`, `DEBIT`

The next revision must confirm exactly:

- which of these exist;
- their actual field names;
- their meaning;
- whether they carry quantity and/or amount;
- whether they are applicable to all asset classes.

---

# 4. HOLDINGS AND WAC ALGORITHM MUST BE FULLY SPECIFIED

The plan currently says WAC will be used but does not define the algorithm.

For every actual supported transaction type, specify:

1. quantity effect;
2. cost-basis effect;
3. treatment of fees;
4. partial disposal handling;
5. full disposal handling;
6. zero quantity handling;
7. negative quantity handling;
8. missing quantity/price handling;
9. unsupported transaction handling.

### Mandatory rule

If an unsupported or ambiguous transaction prevents accurate reconstruction, return explicit:

- `PARTIAL`;
- `INSUFFICIENT_DATA`; or
- `HISTORICAL_SOURCE_UNAVAILABLE`.

Never silently produce an apparently precise holding.

### Authoritative-engine check

The plan must first determine whether an existing authoritative cost-basis/capital-gains engine already exists.

- If yes: reuse it where applicable.
- If no: clearly label WAC as portfolio reconstruction logic and do not imply tax-grade capital-gains precision.

---

# 5. DOMAIN-SPECIFIC FUTURE LEAKAGE POLICY

The next plan must explicitly define the date precedence for every domain.

## Portfolio

- Transaction effective/trade date.
- Historical price date.
- Future transactions excluded.
- Future prices never used.

## Fixed Deposits

Inspect actual fields and define:

- pre-start;
- active;
- maturity;
- explicit closure/redemption;
- renewal if represented;
- unknown post-maturity ownership.

### Important

The current statement:

> “post-maturity → maturity value with warning”

is **not approved as a universal rule**.

A matured FD cannot automatically be counted as still owned unless the authoritative data proves continued ownership or the product's existing accounting model explicitly supports that treatment.

## Insurance

Use only actual policy fields available.

Do not infer historical policy status from current state unless supported by effective dates/history.

## Goals

Do not project today's progress backward without historical evidence.

## Estate

Do not project current will/trust status backward without effective-date evidence.

## Tax

Define deterministic mapping:

`asOfDate -> applicable Indian financial year`

and prevent future FY records from leaking backward.

## Cash/Bank

If historical balance snapshots do not exist, do not fabricate an `asOfDate` balance from today's balance.

---

# 6. PRICE AND VALUATION CONTRACT

`findPriceAsOf` must return a structured result containing:

- requested `asOfDate`;
- resolved valuation date;
- valuation amount;
- valuation type;
- provenance;
- proxy age;
- applied rule code;
- applied rule version;
- status;
- missing-data reason.

## Required precedence

1. Exact historical price.
2. Nearest prior valid price within configured freshness.
3. Acquisition cost only where explicitly permitted by asset-class policy.
4. `HISTORICAL_SOURCE_UNAVAILABLE`.

**Future prices must never be used.**

## Asset-class policy

The plan proposes:

- Equities/MFs/US Stocks: 30 days
- Debt/Gold: 60 days
- Real Estate: 365 days
- Cash: 90 days

The Agent must verify that these categories actually match the current asset taxonomy.

For each rule include:

- rule code;
- version;
- rationale/provenance;
- effective date.

Do not make acquisition-cost fallback universal across all asset classes.

---

# 7. NET WORTH INCLUSION MATRIX

The complete plan must include an explicit matrix similar to:

| Value Type | Included in Net Worth | Condition |
|---|---|---|
| Historical market value | Yes | Valid exact/prior price |
| FD accrued value | Yes | Ownership/lifecycle proven |
| Ledger balance | Conditional | Historical evidence exists |
| Acquisition cost | Policy-controlled | Explicit provenance |
| SUM_ASSURED | Never | Protection only |
| Unknown valuation | No | Missing data |

The final matrix must align with existing FamilyWealthOS valuation architecture.

---

# 8. TOP-LEVEL RECONSTRUCTION COMPLETENESS CONTRACT

The response must contain:

- `reconstructionMode`;
- `knowledgeTimeStatus`;
- per-domain status;
- top-level completeness score/status;
- missing-data reasons;
- domains included in aggregate;
- domains excluded from aggregate;
- valuation provenance summary.

Reuse existing Phase 8C status and provenance enums.

Do not silently convert missing values to zero.

---

# 9. DETERMINISTIC STATE HASH CONTRACT

The plan must define exactly what enters `stateHash`.

Include:

- family ID;
- normalized `asOfDate`;
- reconstruction mode;
- ordered domain states;
- holdings;
- quantities;
- valuation amount/date/type/provenance;
- reconstruction statuses;
- calculation version;
- rule versions.

Explicitly exclude:

- request timestamp;
- response generation timestamp;
- random UUID;
- volatile database timestamps.

Define deterministic ordering and canonical serialization.

---

# 10. WHAT-IF SCENARIO CATALOGUE MUST BE FULLY DEFINED

The current scenario names are insufficient.

For each scenario provide:

1. exact Zod input schema;
2. baseline source;
3. authoritative calculation engine;
4. deterministic formula where applicable;
5. output contract;
6. assumptions;
7. missing-data behaviour;
8. unsupported cases.

## Mandatory scenarios currently proposed

### 1. `RECURRING_SIP_STEP_UP`

Confirm that `ProjectionEngineService` actually supports all required inputs.

### 2. `ONE_TIME_LUMP_SUM_INVESTMENT`

Define:

- investment amount;
- horizon;
- assumed return source;
- whether return assumptions are user input or authoritative model input;
- invalid boundary behaviour.

No hidden financial assumptions.

### 3. `RETIREMENT_AGE_ADJUSTMENT`

Confirm that `RetirementPlanningService` actually exists and exposes a deterministic API suitable for simulation.

If it does not, this scenario must be removed or explicitly marked unsupported for Sprint 8C.3.

### 4. `GOAL_CONTRIBUTION_REALLOCATION`

Define how allocations are validated and ensure the simulation does not mutate authoritative goals.

### 5. `TAX_REGIME_OPTIMIZATION_SCENARIO`

Confirm exact `TaxCalculationEngine` capabilities.

If required inputs are incomplete:

`INSUFFICIENT_DATA`

not fabricated zero tax savings.

---

# 11. WHAT-IF BASELINE POLICY

The complete plan must explicitly define whether simulation supports:

- current authoritative baseline;
- historical Time Machine baseline;
- both.

Recommended boundary:

- default = current authoritative state;
- historical baseline only when explicitly requested and sufficiently complete;
- never silently mix current data with historical `asOfDate`.

---

# 12. ZERO-WRITE SANDBOX VERIFICATION

Deep cloning alone is not sufficient evidence.

Tests should use a real test SQLite database where practical and verify before/after:

- row counts and/or deterministic checksums;
- no INSERT;
- no UPDATE;
- no DELETE;
- no source-table mutation;
- no mutation of the supplied baseline object.

The What-If result itself must not be persisted unless a future sprint explicitly introduces scenario persistence.

---

# 13. API CONTRACT

The complete plan must define exact endpoints.

## Historical reconstruction

Example:

`GET /api/v1/family-office/time-machine?asOfDate=YYYY-MM-DD`

Validation:

- strict ISO date;
- real calendar date;
- normalization policy;
- future-date rejection;
- deterministic error codes.

## What-If

`POST /api/v1/family-office/time-machine/what-if`

Use a strict discriminated scenario schema.

Reject:

- unknown scenario types;
- invalid boundaries;
- invalid negative values;
- non-finite numbers.

## Future date

Explicitly reject future dates.

Do not silently clamp them to today.

## Family scope

Family ID must come from server-side authenticated/correlation context.

Never trust client-supplied family IDs.

## Idempotency

Clarify route-specific behaviour:

- GET reconstruction: no idempotency middleware required.
- POST What-If: only use existing idempotency conventions if they do not cause result persistence and remain compatible with the zero-write invariant.

---

# 14. COMPLETE 35-POINT TEST MATRIX

The plan currently says that the matrix exists but does not actually list it.

The next revision must include the actual test cases.

At minimum:

## Historical boundaries
1. Exact price preferred.
2. Prior valid price used.
3. Future price never used.
4. Expired proxy handled.
5. Missing acquisition cost handled.
6. Future transaction excluded.
7. Same-day ordering deterministic.
8. Unsupported transaction explicit.

## Holdings and valuation
9. Partial disposal WAC.
10. Full disposal.
11. Negative quantity.
12. Acquisition cost not labelled market value.
13. Unrealized gain/loss null without market value.

## FD and insurance
14. FD pre-start.
15. Active FD.
16. Explicit closure/maturity handling.
17. Unknown post-maturity ownership.
18. SUM_ASSURED excluded.

## Historical limitations
19. Goals do not leak current state backward.
20. Estate does not leak current state backward.
21. Future tax FY does not leak backward.
22. Missing historical cash is not fabricated.

## Integrity
23. Cross-family SQL isolation.
24. Reconstruction zero source writes.
25. What-If zero database writes.
26. Baseline immutability.
27. Deterministic state hash.
28. Volatile timestamps excluded from hash.
29. Future date rejected.
30. Missing data not converted to zero.

## What-If
31. Unsupported scenario rejected.
32. Assumptions included.
33. Baseline hash included.
34. Missing tax data -> INSUFFICIENT_DATA.
35. Tax scenario delegates to authoritative engine.

---

# 15. IMPLEMENTATION FILE-BY-FILE PLAN

The next revision must include the actual file plan, for example:

## Contracts
- exact schemas to add/change;
- compatibility impact.

## Repositories
- exact method signatures;
- family SQL scope;
- bulk query strategy to avoid N+1.

## Services
- responsibilities;
- dependencies;
- non-responsibilities.

## Controller/Routes
- endpoints;
- validation;
- error mapping.

## Tests
- exact test files and categories.

## Documentation
- exact documents to create/update.

Do not simply state “new service” without defining responsibilities and inputs/outputs.

---

# 16. PERFORMANCE PLAN

The plan must test a representative seeded family containing:

- multiple assets;
- multiple transactions;
- historical prices;
- FDs;
- insurance;
- relevant family members.

Avoid N+1 price and transaction lookup patterns.

Correctness remains the primary acceptance criterion.

---

# 17. DOCUMENTATION PLAN

The implementation must create/update:

1. `docs/FINANCIAL_TIME_MACHINE.md`
2. Historical Data Availability Matrix
3. What-If Scenario Catalogue
4. Assumptions and Limitations
5. State Hash Contract
6. API Contract
7. `SESSION_CONTEXT.md`
8. `AI_CHANGELOG.md`
9. `docs/PHASE_8_ROADMAP.md`
10. Sprint output review document

---

# FINAL INSTRUCTIONS TO THE AGENT

Please produce a **complete implementation plan**, not another high-level summary.

## Mandatory workflow

1. **Do not modify production code yet.**
2. Inspect the actual current schema and services first.
3. Include the schema/capability evidence in the plan.
4. Include the Historical Data Availability Matrix.
5. Include all domain-specific future leakage rules.
6. Include exact What-If schemas and engine dependencies.
7. Include the exact API contract.
8. Include the state-hash contract.
9. Include the net-worth inclusion matrix.
10. Include the actual 35-point test matrix.
11. Include a file-by-file implementation sequence.
12. Stop after producing the complete plan and wait for approval.

## Approval Gate

Sprint 8C.3 will be approved for coding only after the plan is complete enough that implementation does not require the Agent to invent historical semantics or database fields during coding.
