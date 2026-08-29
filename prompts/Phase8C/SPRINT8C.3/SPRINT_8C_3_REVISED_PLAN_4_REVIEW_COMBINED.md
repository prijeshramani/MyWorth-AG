# Sprint 8C.3 – Review of Revised Plan 4

## Review Decision

**Status: NOT APPROVED FOR IMPLEMENTATION.**

This revision is **not sufficient for the approval gate**. Although the title says **“Complete Production Specification”**, the document remains a short high-level summary and does not contain the detailed evidence and implementation design explicitly requested in the previous review.

The Agent must revise the plan again **without modifying production code**.

---

# 1. Positive Changes Retained

The following principles are directionally correct and should remain:

1. `HISTORICAL_ECONOMIC_STATE` is the declared reconstruction mode.
2. `knowledgeTimeStatus = NOT_FULLY_RECONSTRUCTABLE` correctly acknowledges that this is not full historical system-knowledge reconstruction.
3. Repository APIs are intended to be family-scoped.
4. Transaction ordering is intended to be deterministic: `date ASC, id ASC`.
5. WAC is proposed for holdings reconstruction.
6. `SUM_ASSURED` remains excluded from net worth.
7. What-If scenarios are intended to be a closed catalogue.
8. What-If execution has a zero-write invariant.
9. Existing authoritative engines are intended to be reused.
10. The 348-test baseline is retained as the regression baseline.

These are **not enough to approve implementation** because the plan does not provide the evidence or detailed contracts required to implement them safely.

---

# 2. CRITICAL BLOCKER: NO ACTUAL SCHEMA INSPECTION EVIDENCE

The previous review explicitly required inspection of the actual codebase before finalizing semantics.

The revised plan still does not provide:

- actual table names and columns used;
- actual transaction enum/type definitions;
- actual asset taxonomy;
- actual price history schema;
- actual FD lifecycle fields;
- actual insurance effective-date fields;
- actual cash/balance history capability;
- actual service interfaces for `ProjectionEngineService`;
- actual service interfaces for `RetirementPlanningService`;
- actual service interfaces for `GoalPlanningService`;
- actual service interfaces for `TaxCalculationEngine`.

### Required correction

Add a section:

## Actual Schema and Service Capability Verification

For every domain, provide evidence from the inspected current codebase.

| Domain | Actual table/service | Family scope mechanism | Effective date field | Historical records available? | Limitation |
|---|---|---|---|---|---|

This is mandatory before implementation.

---

# 3. BLOCKER: “ACTUAL SUPPORTED TRANSACTION TYPES” IS UNPROVEN

The plan states:

> “Processes actual supported transaction types (`BUY`, `SELL`, `REINVEST`, `DIVIDEND`, `INTEREST`, `BONUS`, `CREDIT`, `DEBIT`)”

However, the document does not prove that these are the actual supported transaction types in the current project.

### Required correction

Inspect the real transaction contract/schema and list:

- exact enum values;
- source file;
- quantity semantics;
- amount semantics;
- price semantics;
- applicable asset classes.

Do not call them “actual supported types” until verified.

---

# 4. BLOCKER: WAC ALGORITHM IS STILL NOT SPECIFIED

The statement:

> “Reconstructs units and Weighted Average Cost Basis (WAC) with proportional reduction on partial disposals”

is insufficient for implementation.

The plan must specify transaction-by-transaction behaviour.

| Actual transaction type | Quantity effect | Cost basis effect | Fees | Missing data behaviour |
|---|---|---|---|---|

Mandatory cases:

- acquisition;
- partial disposal;
- full disposal;
- reinvestment;
- dividend;
- interest;
- bonus;
- credit;
- debit;
- unsupported transaction;
- negative quantity;
- zero quantity;
- missing quantity;
- missing price.

### Important

First inspect whether an authoritative capital-gains/cost-basis engine already exists.

- If it exists, explain whether it should be reused.
- If it does not, explicitly state that WAC is reconstruction logic and is **not automatically tax-grade capital-gains accounting**.

---

# 5. BLOCKER: HISTORICAL DATA AVAILABILITY MATRIX IS MISSING

This was explicitly requested and is still absent.

The next revision must contain:

## Historical Data Availability Matrix

At minimum:

| Domain | Can reconstruct historically? | Evidence source | Date field | Fallback | Status if unavailable |
|---|---|---|---|---|---|
| Portfolio holdings | | | | | |
| Historical market prices | | | | | |
| Fixed deposits | | | | | |
| Insurance | | | | | |
| Goals | | | | | |
| Estate | | | | | |
| Tax | | | | | |
| Cash/bank | | | | | |

Without this matrix, implementation risks silently using current data as historical data.

---

# 6. BLOCKER: PROXY PRICE POLICY IS NOT FULLY SAFE

The plan states that expired proxies fall back to acquisition cost.

This cannot be a universal rule.

### Required correction

Define a structured valuation result:

```text
requestedAsOfDate
resolvedValuationDate
amount
valuationType
provenance
proxyAgeDays
status
missingDataReason
ruleCode
ruleVersion
```

### Required precedence

1. Exact historical price.
2. Nearest prior valid price within the asset-class policy.
3. Acquisition cost only when explicitly allowed by the asset-class policy and source data supports it.
4. `HISTORICAL_SOURCE_UNAVAILABLE`.

### Absolute rule

**Future prices must never be used.**

### Also required

Verify that these asset categories actually exist in the project taxonomy before using them:

- Equities
- Mutual Funds
- US Stocks
- Debt
- Gold
- Real Estate
- Cash

Do not invent a mapping during coding.

---

# 7. BLOCKER: FD POST-MATURITY RULE REMAINS UNSAFE

The plan still states:

> “post-maturity → maturity value with warning”

This is **not approved as a universal ownership rule**.

A matured FD may have:

- been redeemed;
- been renewed;
- remained unclaimed;
- been transferred elsewhere.

### Required correction

Inspect the actual FD schema and lifecycle records.

Define:

- pre-start;
- active;
- maturity;
- closure/redemption;
- renewal;
- unknown post-maturity ownership.

If continued ownership cannot be proven, return an explicit status rather than automatically counting maturity value in net worth.

---

# 8. BLOCKER: DOMAIN-SPECIFIC FUTURE LEAKAGE RULES ARE MISSING

The plan only gives general time semantics.

It must define explicit rules for each domain.

## Portfolio

- transaction effective date;
- same-day ordering;
- future transaction exclusion;
- future price exclusion.

## Fixed Deposits

- actual lifecycle date precedence.

## Insurance

- policy effective/start date;
- maturity date;
- termination date;
- whether current status can be projected backward.

## Goals

Do not project today's goal progress backward without historical evidence.

## Estate

Do not project today's will/trust/nominee state backward without effective-date evidence.

## Tax

Define:

`asOfDate -> applicable Indian financial year`

and explicitly prevent future-year records leaking backward.

## Cash/Bank

If historical snapshots do not exist, current balance must **not** be presented as the historical balance.

---

# 9. BLOCKER: NET WORTH INCLUSION MATRIX IS MISSING

Add an explicit matrix aligned with the existing valuation architecture.

Example categories to resolve:

| Value | Included in Net Worth? | Condition |
|---|---|---|
| Exact historical market value | Yes | Valid historical price |
| Prior-date proxy value | Conditional | Within approved freshness |
| Acquisition cost | Conditional | Explicit policy/provenance |
| FD accrued value | Conditional | Ownership proven |
| Ledger balance | Conditional | Historical evidence exists |
| SUM_ASSURED | Never | Protection only |
| Unknown valuation | No | Explicit missing-data status |

The final version must use actual FamilyWealthOS terminology.

---

# 10. BLOCKER: TOP-LEVEL RECONSTRUCTION RESPONSE CONTRACT IS MISSING

The plan must define the complete response contract.

Include:

- `familyId` or server-scoped identity representation;
- `asOfDate`;
- `reconstructionMode`;
- `knowledgeTimeStatus`;
- domain results;
- per-domain status;
- top-level completeness score;
- top-level completeness status;
- missing-data reasons;
- included/excluded net-worth components;
- valuation provenance summary;
- `stateHash`;
- calculation/rule versions.

Reuse existing Phase 8C enums where applicable.

**Never convert missing data to zero.**

---

# 11. BLOCKER: STATE HASH CONTRACT IS MISSING

The plan refers to reconstruction but never defines canonical hashing.

The next revision must define exactly what enters the hash:

- normalized family identity;
- normalized `asOfDate`;
- reconstruction mode;
- ordered domain states;
- holdings;
- quantities;
- valuation amount;
- valuation date;
- valuation type;
- provenance;
- domain statuses;
- calculation version;
- applicable rule versions.

Explicitly exclude:

- request timestamps;
- response timestamps;
- random IDs;
- volatile database timestamps.

Also define canonical ordering and serialization.

---

# 12. BLOCKER: WHAT-IF SCENARIOS ARE ONLY NAMES, NOT IMPLEMENTATION SPECIFICATIONS

The current plan lists five scenario names but does not define their contracts.

For **each** scenario provide:

1. exact discriminated Zod input schema;
2. baseline source;
3. required authoritative service;
4. exact service method/interface verified in the codebase;
5. deterministic assumptions;
6. output schema;
7. missing-data behaviour;
8. unsupported-case behaviour;
9. zero-write verification.

## `RECURRING_SIP_STEP_UP`

Verify `ProjectionEngineService` actually supports required inputs.

## `ONE_TIME_LUMP_SUM_INVESTMENT`

Define:

- amount;
- investment date;
- horizon;
- return assumption source;
- compounding convention;
- invalid boundary behaviour.

No hidden return assumptions.

## `RETIREMENT_AGE_ADJUSTMENT`

Verify `RetirementPlanningService` exists and supports deterministic simulation.

If not, mark unsupported or remove from Sprint 8C.3.

## `GOAL_CONTRIBUTION_REALLOCATION`

Define validation rules and ensure authoritative goals are never mutated.

## `TAX_REGIME_OPTIMIZATION_SCENARIO`

Verify actual `TaxCalculationEngine` capabilities.

Missing required income/tax information must produce:

`INSUFFICIENT_DATA`

not fabricated savings.

---

# 13. WHAT-IF BASELINE POLICY IS MISSING

The next plan must explicitly decide whether simulations support:

1. current authoritative state;
2. historical reconstructed state;
3. both.

Recommended boundary:

- default baseline = current authoritative state;
- historical baseline only when explicitly requested and reconstruction completeness is sufficient;
- never silently mix today's authoritative values with an old `asOfDate`.

---

# 14. ZERO-WRITE VERIFICATION IS STILL TOO WEAK

The plan says:

> “Executes in-memory on deep-cloned state with 0 database writes.”

Deep cloning does not prove zero writes.

### Required tests

Use a real test SQLite database where practical and verify:

- source row counts/checksums unchanged;
- no INSERT;
- no UPDATE;
- no DELETE;
- no source-table mutation;
- supplied baseline object remains unchanged.

Clarify whether POST What-If uses existing idempotency infrastructure and ensure that infrastructure itself does not violate the zero-write scenario invariant.

---

# 15. BLOCKER: API CONTRACT IS MISSING

The plan lists route files but no actual API specification.

Add exact endpoints and schemas.

## Historical reconstruction

Example:

`GET /api/v1/family-office/time-machine?asOfDate=YYYY-MM-DD`

Specify:

- request validation;
- response schema;
- status codes;
- deterministic error codes.

## What-If

`POST /api/v1/family-office/time-machine/what-if`

Use strict discriminated unions.

Reject:

- unknown scenario types;
- negative invalid amounts;
- invalid dates;
- non-finite values;
- invalid boundaries.

## Future dates

Must be rejected explicitly.

Do not silently clamp to today.

## Family scope

Must come from server-side authenticated/correlation context.

Never trust a client-supplied family ID.

---

# 16. BLOCKER: THE “COMPLETE 35-POINT TEST MATRIX” IS NOT ACTUALLY PRESENT

The plan says it enforces 35 tests but does not list them.

The next revision must contain the actual numbered tests.

At minimum include the categories previously required:

### Historical boundaries
1–8

### Holdings and valuation
9–13

### FD and insurance
14–18

### Historical limitations
19–22

### Integrity and security
23–30

### What-If
31–35

Each test must state:

- setup;
- action;
- expected invariant.

A statement that “35 tests will exist” is not a test plan.

---

# 17. FILE-BY-FILE PLAN IS TOO SHALLOW

The current section only lists filenames.

For every file provide:

- whether it is new or modified;
- exact responsibility;
- public methods/contracts;
- dependencies;
- migration impact;
- compatibility impact.

For example, do not write only:

> `FinancialTimeMachineService.ts`

Instead specify:

- inputs;
- outputs;
- orchestration responsibility;
- domains it reconstructs;
- domains it explicitly does not reconstruct;
- repository dependencies;
- status propagation.

---

# 18. DOCUMENTATION PLAN IS INCOMPLETE

The next plan must include:

1. `docs/FINANCIAL_TIME_MACHINE.md`
2. Historical Data Availability Matrix
3. What-If Scenario Catalogue
4. Assumptions and Limitations
5. State Hash Contract
6. API Contract
7. `SESSION_CONTEXT.md`
8. `AI_CHANGELOG.md`
9. `docs/PHASE_8_ROADMAP.md`
10. Sprint output review

The current documentation list is incomplete.

---

# 19. PERFORMANCE PLAN IS MISSING

The implementation plan must specify representative performance testing using seeded data containing:

- multiple assets;
- multiple transactions;
- historical prices;
- FDs;
- insurance;
- relevant family members.

Explicitly avoid N+1:

- transaction queries;
- price queries;
- asset lookups.

Correctness remains more important than hitting an arbitrary latency number.

---

# 20. IMPORTANT OBSERVATION

This revision appears to have **collapsed the previously requested detailed review requirements into a shorter summary** rather than incorporating them.

For example, it claims:

> “Complete 35-Point Invariant Test Matrix”

but does not provide the 35 tests.

It claims:

> “Complete Production Specification”

but does not provide the schema evidence, API schemas, domain matrices, algorithms, or service capability verification required for production implementation.

Therefore, the title and implementation readiness claim should be corrected until the document genuinely contains those sections.

---

# REQUIRED NEXT AGENT ACTION

## Do not modify production code.

Produce one **genuinely complete implementation plan** containing all of the following:

1. Actual schema and service capability inspection evidence.
2. Historical Data Availability Matrix.
3. Verified transaction-type semantics.
4. Complete WAC reconstruction algorithm.
5. Domain-specific future leakage policy.
6. Structured valuation/proxy contract.
7. Asset-class fallback policy verified against actual taxonomy.
8. Safe FD lifecycle and post-maturity ownership semantics.
9. Net-worth inclusion matrix.
10. Top-level reconstruction completeness contract.
11. Canonical deterministic `stateHash` contract.
12. Full What-If scenario schemas and verified engine dependencies.
13. What-If baseline policy.
14. Strong zero-write verification design.
15. Exact REST API contract.
16. Actual numbered 35-point test matrix.
17. File-by-file implementation details.
18. Performance test plan.
19. Complete documentation plan.
20. Explicit list of unsupported historical capabilities.

## Final stop condition

After producing that plan:

**STOP. Do not implement code. Wait for approval.**

---

# Final Review Position

**Sprint 8C.3 remains in planning.**

The architectural direction is promising, but implementation should not start until the Agent converts this summary into an evidence-backed, detailed production implementation plan.
