# Sprint 8C.3 – Final Review of Revised Plan

## Review Decision

# 🟢 APPROVED FOR IMPLEMENTATION — WITH TWO MANDATORY IMPLEMENTATION CORRECTIONS

This is the first Sprint 8C.3 plan that is substantially detailed enough to cross the planning gate. It now includes real repository evidence, transaction semantics, a WAC algorithm, structured valuation rules, an explicit 35-case test matrix, file-level implementation detail, and bounded What-If scenarios. fileciteturn48file5 fileciteturn48file13 fileciteturn48file17

The Agent may begin implementation **without another planning revision**, provided the two corrections below are treated as mandatory implementation guardrails.

---

# 1. What Is Now Strong Enough

The plan now correctly provides:

- actual transaction types referenced from `ITransactionRepository.ts`;
- deterministic ordering by `date ASC, id ASC`;
- explicit WAC mechanics for buy, sell and bonus events;
- explicit statement that WAC is portfolio reconstruction, not statutory tax-lot accounting;
- versioned proxy freshness rules;
- explicit prohibition on future prices;
- FD lifecycle handling that avoids claiming proven ownership after maturity;
- protection/net-worth separation for `SUM_ASSURED`;
- bounded What-If scenarios tied to named authoritative services;
- baseline immutability and database zero-write tests;
- explicit 35-case invariant matrix;
- file-by-file implementation detail;
- deterministic state-hash tests;
- the existing 348-test suite as the baseline. fileciteturn48file5 fileciteturn48file13

This is a major improvement over the previous revisions.

---

# 2. MANDATORY CORRECTION #1 – Missing Data Must Never Be Represented as a Valid Zero

One test in the plan currently states:

> “Valuation is `0` with `status = 'INSUFFICIENT_DATA'`, not a valid 0 valuation.”

This is internally contradictory and violates the FamilyWealthOS missing-data principle.

## Required implementation rule

For an unknown valuation:

```text
amount = null
status = INSUFFICIENT_DATA
missingDataReason = ...
```

A numeric `0` must mean only:

```text
KNOWN_ZERO
```

or another explicitly evaluated zero state.

### Agent action

Correct the test and all implementation contracts accordingly:

```text
❌ value: 0 + INSUFFICIENT_DATA

✅ value: null + INSUFFICIENT_DATA
```

This is mandatory.

---

# 3. MANDATORY CORRECTION #2 – Do Not Treat Post-Maturity FD as Net-Worth Value Without Ownership Evidence

The revised plan is directionally safer by using:

`MATURED_PENDING_REINVESTMENT`

and stating that continued ownership is not assumed.

However, implementation must make the net-worth consequence explicit.

## Required rule

When an FD has matured and:

- redemption is not recorded;
- renewal is not recorded; and
- continued ownership cannot be proven,

then the Time Machine must **not silently include the maturity value in authoritative net worth**.

Return an explicit lifecycle/reconstruction limitation, for example:

```text
value = null
status = INSUFFICIENT_DATA
lifecycleStatus = MATURED_PENDING_REINVESTMENT
```

unless the actual source schema provides sufficient evidence to establish continued ownership.

If the codebase proves continued ownership through an authoritative record, document that provenance and include the value according to the normal valuation rules.

---

# 4. Implementation Guardrail – Historical Price and Asset-Type Policy

The plan defines proxy windows for broad categories.

During implementation, the Agent must map these policies only to **actual FamilyWealthOS asset types**, not invent categories or silently remap types. The existing project taxonomy includes types such as `MUTUAL_FUND`, `STOCK`, `US_STOCK`, `NPS`, `GOLD`, `BOND`, `PROPERTY`, `BANK_ACCOUNT`, `EPF`, `FIXED_DEPOSIT`, `SSY`, and `PPF`. fileciteturn49file12

Any asset type without sufficient historical valuation support must surface an explicit limitation.

---

# 5. Implementation Guardrail – What-If Engine Verification

The plan names methods such as:

- `ProjectionEngineService.projectCorpus`
- `RetirementPlanningService.getRetirementAnalysis`

Before calling them, implementation must verify the exact current method signatures.

If the named method does not exist or does not support the required deterministic inputs:

1. do not create duplicate financial logic inside the Time Machine;
2. adapt through the existing authoritative public API if available; otherwise
3. mark that scenario unsupported/`INSUFFICIENT_DATA` as appropriate.

The Time Machine remains an orchestrator; it must not become a second Projection, Retirement, Goal, or Tax engine.

---

# 6. Implementation Guardrail – Zero-Write Meaning

The zero-write invariant applies to **authoritative financial/domain state**.

If HTTP idempotency middleware persists infrastructure metadata, that must be explicitly understood and documented separately; it must never be described as a mutation of the simulated financial baseline.

The tests must continue to prove that:

- no authoritative source table is inserted into;
- no authoritative source table is updated;
- no authoritative source table is deleted from;
- the supplied in-memory baseline remains unchanged.

---

# 7. Implementation Guardrail – Family Scope

All new Time Machine and What-If endpoints must resolve the family exclusively from:

```text
CorrelationContext.getFamilyId()
```

No `familyId` supplied by query, body, or frontend state may establish the scope.

Repository/SQL operations must retain family predicates where the underlying data model permits family scoping.

---

# 8. Implementation Sequence

Proceed in this order:

1. Re-confirm actual interfaces and schema fields immediately before coding.
2. Correct the missing-value-as-zero semantics.
3. Implement family-scoped historical repository access.
4. Implement deterministic holdings reconstruction and WAC.
5. Implement structured valuation resolution.
6. Implement FD and protection reconstruction boundaries.
7. Implement domain completeness and canonical `stateHash`.
8. Implement reconstruction API.
9. Implement bounded What-If orchestration using authoritative engines.
10. Implement real SQLite zero-write/integrity tests.
11. Run the complete 35-case invariant matrix.
12. Run the entire regression suite and strict TypeScript checks.
13. Update required documentation and output review.

---

# 9. Acceptance Criteria

Sprint 8C.3 implementation is complete only when:

- [ ] Unknown values are `null`, never fabricated numeric zero.
- [ ] `SUM_ASSURED` never enters net worth.
- [ ] No future price or transaction leaks into an earlier reconstruction.
- [ ] Post-maturity FD value is not included without ownership evidence.
- [ ] Every reconstruction response exposes completeness/status/provenance.
- [ ] Canonical state hashes are deterministic.
- [ ] All scenario calculations reuse authoritative engines.
- [ ] What-If does not mutate authoritative financial state.
- [ ] What-If does not mutate its supplied baseline object.
- [ ] Cross-family access is prevented.
- [ ] All 35 mandatory invariant cases pass.
- [ ] Previous regression tests remain green.
- [ ] Backend and frontend `tsc --noEmit` are clean.
- [ ] Documentation clearly states historical limitations.

---

# FINAL INSTRUCTION TO THE AGENT

## APPROVED TO IMPLEMENT SPRINT 8C.3

You may now begin coding.

**Do not redesign the architecture or expand scope during implementation.**

Implement exactly the approved plan, subject to the two mandatory corrections:

1. **Missing historical values must be `null` with explicit status — never numeric `0` with `INSUFFICIENT_DATA`.**
2. **Post-maturity FD values must not enter net worth without authoritative evidence of continued ownership.**

After implementation:

1. Run the full master test suite.
2. Run backend and frontend strict TypeScript compilation.
3. Report the actual baseline + new tests = final count.
4. Document actual performance using the representative dataset.
5. Update all required Sprint 8C.3 documentation.
6. Produce the output review.
7. **STOP and wait for review before starting Sprint 8C.4.**
