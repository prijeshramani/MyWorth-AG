# Sprint 8C.3 – Final Revised Plan Review & Consolidated Agent Instructions

## Review Decision

**Status: REQUIRES ONE FINAL PLAN REVISION BEFORE CODING.**

This revision is substantially better and correctly incorporates several major guardrails from the previous review, including:

- explicit `HISTORICAL_ECONOMIC_STATE` semantics;
- family-scoped repository signatures;
- deterministic transaction ordering;
- WAC reconstruction intent;
- versioned proxy freshness;
- explicit `SUM_ASSURED` exclusion from net worth;
- bounded What-If scenarios;
- zero-write sandbox intent.

However, the plan is still **too high-level to safely implement a high-integrity historical reconstruction feature**. Several requirements requested in the previous review are either missing or asserted without evidence from the actual existing schema.

**The Agent must revise the plan one final time. No production code should be modified yet.**

---

# 1. Approved Decisions to Retain

The following decisions are approved and should remain in the next revision.

## 1.1 Reconstruction Mode

Sprint 8C.3 implements:

`HISTORICAL_ECONOMIC_STATE`

and explicitly does not claim complete reconstruction of what the application database knew at that historical time.

Retain:

- `reconstructionMode: 'HISTORICAL_ECONOMIC_STATE'`
- `knowledgeTimeStatus: 'NOT_FULLY_RECONSTRUCTABLE'`

## 1.2 Family Scope

Repository methods must remain family-scoped.

Examples:

- `findPriceAsOf(familyId, assetId, asOfDate, ...)`
- `findByAssetIdAsOf(familyId, assetId, asOfDate)`

The actual SQL predicates must enforce the scope.

## 1.3 Historical Price Direction

The implementation must never use a future price for an earlier `asOfDate`.

## 1.4 Valuation Provenance

Acquisition-cost fallback must remain:

- `valuationType = 'ACQUISITION_COST'`
- provenance = `KNOWN_ACQUISITION_COST`

It must never be represented as market value.

## 1.5 Protection Invariant

Insurance `SUM_ASSURED` must never enter:

- net worth;
- gross assets;
- portfolio value.

It remains protection coverage only.

## 1.6 What-If Zero-Write Direction

The What-If engine must remain an in-memory sandbox and must not mutate authoritative data.

---

# 2. CRITICAL ISSUE – THE PLAN STILL MAKES UNSUPPORTED SCHEMA ASSUMPTIONS

## R1 – Inspect the Actual Existing Schema Before Defining Algorithms

The plan currently states:

> BUY + REINVEST + BONUS - SELL

and defines FD and insurance lifecycle behaviour.

Before coding, the Agent must inspect the actual project:

- transaction type enums;
- transaction table fields;
- price history schema;
- asset ownership model;
- insurance policy fields;
- FD fields;
- goal history availability;
- estate history availability;
- tax profile/deduction structure;
- existing authoritative calculation engines.

### Required revision

Add a **Schema and Capability Verification section**.

For every proposed reconstruction feature, specify:

| Domain | Actual source table/service | Actual effective date field | Historical capability | Limitation |
|---|---|---|---|---|

Do not introduce `REINVEST`, `BONUS`, lapse fields, surrender fields, or other transaction/lifecycle semantics unless they actually exist in the current project model.

---

# 3. HISTORICAL DATA AVAILABILITY MATRIX IS STILL MISSING

## R2 – Add the Mandatory Historical Data Availability Matrix

This was explicitly required previously and is absent.

The revised plan must contain a matrix covering at least:

1. Portfolio holdings
2. Historical prices
3. Fixed deposits
4. Cash/bank balances
5. Insurance
6. Goals
7. Estate
8. Tax
9. Life events where relevant

For each domain specify:

- authoritative source;
- family scope mechanism;
- business/effective date;
- whether full historical reconstruction is possible;
- whether only partial reconstruction is possible;
- whether only current state exists;
- missing-data status;
- whether the value contributes to net worth.

This matrix is mandatory before implementation approval.

---

# 4. HOLDINGS RECONSTRUCTION REMAINS UNDERSPECIFIED

## R3 – Define Supported Transaction Types From the Actual Enum

The current formula assumes transaction types without proving they exist.

The revised plan must list the **actual supported transaction types from the codebase**.

For every type, specify:

- quantity effect;
- cost-basis effect;
- treatment when quantity becomes negative;
- treatment when required fields are missing.

### Mandatory safety rule

Unsupported transaction types must not silently produce a precise reconstructed holding.

Return explicit:

- `PARTIAL`;
- `INSUFFICIENT_DATA`; or
- `HISTORICAL_SOURCE_UNAVAILABLE`

as appropriate.

---

## R4 – WAC Cost Basis Must Be Fully Defined

The plan says:

> WAC with proportional reduction on partial disposals

but does not define all calculation rules.

The revised plan must explicitly define:

1. BUY behaviour;
2. SELL behaviour;
3. partial SELL;
4. full disposal;
5. zero quantity;
6. negative quantity;
7. fees and charges;
8. bonus/reinvestment treatment only if supported by actual schema;
9. transfers/corporate actions if unsupported.

### Important

The Agent must first determine whether an existing authoritative cost-basis or capital-gains engine already exists.

If one exists, Sprint 8C.3 must reuse it rather than creating parallel tax-grade logic.

If none exists, the reconstructed WAC must be documented as a **portfolio accounting reconstruction**, not a tax calculation.

---

# 5. PRICE AND VALUATION POLICY NEEDS MORE PRECISION

## R5 – `findPriceAsOf` Must Return a Structured Result

The plan currently names repository methods but does not define the result contract.

It should return at minimum:

- requested `asOfDate`;
- resolved valuation date;
- amount;
- valuation type;
- provenance;
- proxy age;
- rule code;
- rule version;
- status;
- missing-data reason where applicable.

---

## R6 – Asset-Class Freshness Thresholds Must Be Evidence-Based

The proposed thresholds:

- Equities/MFs/US Stocks = 30 days
- Debt/Gold = 60 days
- Real Estate = 365 days
- Cash = 90 days

should not simply be hard-coded because they sound reasonable.

The plan must clarify whether:

1. these asset classes actually exist in the project taxonomy; and
2. the proposed thresholds are initial configurable product rules.

They must be placed in `TIME_MACHINE_RULE_REGISTRY` with:

- rule code;
- version;
- jurisdiction where relevant;
- provenance/source rationale;
- effective date.

---

## R7 – Acquisition-Cost Fallback Must Be Asset-Type Specific

The current plan broadly states that expired proxies fall back to acquisition cost.

This may not be valid for every asset class.

The revised plan must specify:

- which asset classes allow acquisition-cost fallback;
- which do not;
- what happens when acquisition cost is unavailable;
- whether acquisition cost contributes to aggregate net worth.

No universal fallback rule should be assumed without an explicit policy.

---

# 6. FIXED DEPOSIT PLAN STILL RISKS FABRICATING HISTORY

## R8 – Post-Maturity Handling Needs Actual Lifecycle Evidence

The plan currently says:

> post-maturity → maturity value with warning

This can be misleading.

After maturity, the FD may have been:

- redeemed;
- renewed;
- rolled into another instrument;
- left unclaimed.

Unless the data model provides evidence, the Time Machine cannot assume that the maturity value remained an asset.

### Required rule

The revised plan must inspect actual available lifecycle data and define:

- active FD;
- maturity;
- explicit closure/redemption;
- renewal if represented;
- unknown post-maturity state.

When post-maturity ownership cannot be proven, return an explicit reconstruction limitation rather than automatically counting maturity value as still owned.

---

# 7. INSURANCE PLAN IS TOO GENERIC

## R9 – Historical Insurance Reconstruction Must Use Actual Available Fields

The plan says:

> surrender values are null with HISTORICAL_SOURCE_UNAVAILABLE

This must not be a blanket assumption before inspecting the actual insurance schema.

The revised plan must identify the actual fields available and define reconstruction only from those fields.

At minimum distinguish:

- policy existence;
- policy effective date;
- current/historical status availability;
- premium schedule;
- sum assured;
- surrender value if actually stored.

### Mandatory invariant

Missing historical surrender value must remain:

- `null`;
- `HISTORICAL_SOURCE_UNAVAILABLE`

unless an approved authoritative historical valuation source actually exists.

---

# 8. GOALS, ESTATE AND TAX HISTORICAL LIMITATIONS ARE STILL NOT DOCUMENTED

## R10 – Add Domain-Specific Future Leakage Rules

The revised plan must explicitly document date precedence and future-data prevention for:

### Goals
Do not project today's progress backward unless historical snapshots/events support it.

### Estate
Do not assume a current will/trust existed historically merely because the current record was created later or lacks historical effective evidence.

### Tax
Map `asOfDate` deterministically to the applicable Indian financial year and define exactly what is reconstructed.

### Cash / Bank
If historical balance snapshots do not exist, do not invent an `asOfDate` balance from today's balance.

---

## R11 – Tax Scope Must Be Bounded

The What-If plan promises:

> tax efficiency

and includes:

`TAX_REGIME_OPTIMIZATION_SCENARIO`

The plan must prove that the existing `TaxCalculationEngine` exposes sufficient inputs and APIs to support this scenario.

If required inputs are incomplete, the result must be:

- `INSUFFICIENT_DATA`; or
- the scenario must be excluded from Sprint 8C.3.

Do not create a second tax calculation engine.

---

# 9. WHAT-IF SCENARIO CATALOGUE IS STILL TOO HIGH-LEVEL

## R12 – Define Every Scenario Contract Before Coding

The current list is not enough:

- `RECURRING_SIP_STEP_UP`
- `ONE_TIME_LUMP_SUM_INVESTMENT`
- `RETIREMENT_AGE_ADJUSTMENT`
- `GOAL_CONTRIBUTION_REALLOCATION`
- `TAX_REGIME_OPTIMIZATION_SCENARIO`

For each scenario, the plan must specify:

### Inputs
Exact Zod schema fields.

### Baseline
Which authoritative state/service provides the baseline.

### Formula / Engine
Which deterministic engine performs the calculation.

### Outputs
Exact output fields.

### Assumptions
All assumptions made.

### Missing data
What causes `INSUFFICIENT_DATA`.

### Unsupported cases
Explicit rejection rules.

---

## R13 – Do Not Promise Retirement Readiness Without an Authoritative Model

The plan's executive summary promises:

> retirement readiness

The revised plan must identify the existing authoritative service/model that calculates retirement readiness.

If no authoritative retirement projection engine exists, Sprint 8C.3 must not invent one merely for the What-If feature.

Instead:

- limit the scenario to metrics that existing services can calculate; or
- explicitly return the metric as unsupported.

---

## R14 – Historical Baseline vs Current Baseline Must Be Explicit

The plan must decide whether What-If uses:

1. current live state;
2. a historical Time Machine reconstruction; or
3. both.

Recommended Sprint 8C.3 behaviour:

- default baseline = current authoritative state;
- historical reconstruction baseline only when explicitly requested and sufficiently complete;
- no silent mixing of current data with an old `asOfDate`.

Document this in the API contract.

---

# 10. ZERO-WRITE TESTING MUST BE STRONGER

## R15 – Do Not Test Zero Writes Only With Mocks

The plan says:

> deep-cloned state with 0 database writes

The tests must verify this against a real test SQLite database where practical.

Before and after simulation, verify that authoritative tables have unchanged:

- row counts; and/or
- deterministic checksums/state hashes.

Also verify:

- no `INSERT`;
- no `UPDATE`;
- no `DELETE`;
- no mutation of supplied baseline object.

---

# 11. API CONTRACT AND VALIDATION ARE MISSING

## R16 – Define Exact Endpoints and Validation

The revised plan must specify:

### Historical reconstruction

`GET /api/v1/family-office/time-machine?asOfDate=YYYY-MM-DD`

or the project's established route convention.

Validation must include:

- strict ISO date;
- real calendar date;
- timezone/day normalization policy;
- future date rejection;
- deterministic error codes.

### What-If

`POST /api/v1/family-office/time-machine/what-if`

Must use a strict discriminated scenario schema.

Reject:

- unknown scenario types;
- invalid boundaries;
- negative monetary values where not valid;
- non-finite values.

---

## R17 – Future `asOfDate` Must Be Explicitly Rejected

The final plan must explicitly state:

`FUTURE_AS_OF_DATE_UNSUPPORTED`

or the project's equivalent deterministic validation error.

Do not silently clamp future dates to today.

---

## R18 – Idempotency Policy Must Be Clarified

Do not automatically apply idempotency middleware to every endpoint.

Recommended:

- `GET /time-machine` → no idempotency middleware.
- `POST /what-if` → only if the project convention requires replay protection; it must not persist simulation results.

The plan must state the chosen behaviour.

---

# 12. RESPONSE COMPLETENESS MODEL IS STILL MISSING

## R19 – Add Top-Level Reconstruction Completeness

The response must include more than reconstructed numbers.

Add:

- per-domain reconstruction status;
- top-level completeness score/status;
- missing-data reasons;
- included domains;
- excluded domains;
- valuation provenance summary.

Reuse existing Phase 8C status and provenance enums wherever possible.

Do not create parallel semantics unnecessarily.

---

## R20 – Define Net Worth Inclusion Rules Explicitly

The plan must provide a clear matrix:

| Value | Included in Net Worth? | Condition |
|---|---|---|
| Market value | Yes | Valid historical price |
| Accrued FD value | Yes | Ownership/lifecycle proven |
| Ledger balance | Conditional | Historical balance evidence exists |
| Acquisition cost | Policy-controlled | Explicitly labelled |
| Sum assured | Never | Protection only |
| Unknown value | No | Missing data |

The exact final matrix must align with the existing product valuation architecture.

---

# 13. STATE HASH CONTRACT IS STILL TOO VAGUE

## R21 – Define Canonical State Hash Inputs

The revised plan must explicitly define canonical hashing inputs.

Include:

- family ID;
- normalized `asOfDate`;
- reconstruction mode;
- ordered domain states;
- holdings;
- quantities;
- valuation amount/date/type/provenance;
- domain statuses;
- rule versions;
- calculation version.

Explicitly exclude:

- request timestamp;
- response generation timestamp;
- random UUID;
- volatile database insertion timestamp.

Arrays and object keys must be canonicalized deterministically.

---

# 14. PERFORMANCE PLAN NEEDS A REALISTIC DATASET

## R22 – Sub-1000ms Alone Is Not a Meaningful Test

The plan should define a representative seeded dataset with:

- multiple assets;
- multiple historical transactions;
- price history;
- FDs;
- insurance;
- multiple family members where relevant.

Also inspect query patterns to avoid N+1 lookups.

Correctness is the priority, but the implementation should avoid obvious query inefficiency.

---

# 15. TEST PLAN MUST BE MORE SPECIFIC

## R23 – Replace “25 Invariant Test Suites” With an Explicit Test Matrix

The current wording is ambiguous: the file may contain 25 tests rather than 25 suites.

The revised plan must enumerate the required invariant cases.

At minimum include:

### Historical boundary
1. Exact historical price preferred.
2. Prior price within allowed freshness window.
3. Future price never used.
4. Expired proxy behaviour.
5. Missing acquisition cost.
6. Future transaction excluded.
7. Same-day ordering deterministic.
8. Unsupported transaction type explicit.

### Holdings and valuation
9. Partial disposal WAC.
10. Full disposal.
11. Negative quantity behaviour.
12. Acquisition cost never labelled market value.
13. Unrealized gain/loss null without valid market valuation.

### FD and insurance
14. FD pre-start exclusion.
15. Active FD valuation.
16. Explicit maturity/closure handling.
17. Unknown post-maturity ownership.
18. `SUM_ASSURED` never included in net worth.

### Historical limitations
19. Current goal state does not leak backward.
20. Current estate state does not leak backward.
21. Future FY tax record does not leak backward.
22. Missing historical cash balance is not fabricated.

### Integrity
23. Cross-family isolation at SQL/repository level.
24. Reconstruction performs zero source writes.
25. What-If performs zero database writes.
26. What-If baseline remains immutable.
27. Identical reconstruction gives identical state hash.
28. Volatile timestamps do not affect state hash.
29. Future `asOfDate` rejected.
30. Missing data is never converted to numeric zero.

### What-If
31. Unsupported scenario rejected.
32. Scenario result contains assumptions.
33. Scenario result contains baseline hash.
34. Missing critical tax input returns `INSUFFICIENT_DATA`.
35. Tax scenario delegates to `TaxCalculationEngine`.

The Agent may add further tests, but these are the minimum acceptance cases.

---

# 16. DOCUMENTATION REQUIREMENTS

## R24 – Required Documentation Is Still Incomplete

The implementation plan must commit to:

1. `docs/FINANCIAL_TIME_MACHINE.md`
2. Historical Data Availability Matrix
3. What-If Scenario Catalogue
4. Assumptions and Limitations section
5. State Hash Contract
6. API contract documentation
7. `SESSION_CONTEXT.md`
8. `AI_CHANGELOG.md`
9. `docs/PHASE_8_ROADMAP.md`
10. Sprint output review document

The documentation must clearly distinguish:

**Historical Economic State**

from

**What the System Knew at a Historical Time**.

---

# 17. FINAL REQUIRED AGENT ACTION

Please revise `SPRINT_8C_3_IMPLEMENTATION_PLAN.md` one final time.

## Mandatory workflow

1. **Do not modify production code.**
2. Inspect the actual current repository, migrations, contracts and authoritative engines.
3. Do not assume transaction types or historical fields.
4. Add the mandatory Historical Data Availability Matrix.
5. Add the exact What-If Scenario Catalogue.
6. Add domain-specific future leakage rules.
7. Add exact repository signatures and family-scope enforcement.
8. Add API request/response validation rules.
9. Add canonical `stateHash` input rules.
10. Add the complete invariant test matrix.
11. Explicitly document unsupported historical reconstruction cases.
12. Stop after producing the revised plan and wait for approval.

---

# FINAL ACCEPTANCE CRITERIA

The next plan will be ready for implementation only when it demonstrates:

- actual schema-driven design rather than assumed fields;
- no fabricated historical facts;
- no future information leakage;
- family isolation at repository/SQL level;
- explicit valuation provenance;
- no universal acquisition-cost fallback without policy;
- no post-maturity FD ownership assumptions;
- `SUM_ASSURED` never enters net worth;
- bounded What-If scenarios with actual authoritative engine support;
- true database zero-write sandbox verification;
- deterministic state hashing;
- explicit completeness and missing-data semantics;
- complete documentation of known historical limitations.

**Once the above is incorporated and the revised plan is reviewed, Sprint 8C.3 can proceed to implementation.**
