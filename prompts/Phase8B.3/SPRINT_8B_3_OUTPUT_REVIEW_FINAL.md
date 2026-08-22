# Sprint 8B.3 Output Review – Final Architectural & Implementation Review

## Review Status

**VERDICT: 🟡 CONDITIONALLY ACCEPTED — DO NOT CLOSE 8B.3 YET**

Sprint 8B.3 is substantially implemented and the reported 301/301 test result, TypeScript compilation, atomic trigger creation, deterministic trigger IDs, cooldown registry, server-resolved family scope, and fiduciary no-autonomous-action boundary are all positive.

However, the supplied output and supporting Sprint 8B.3 documentation contain several **contract-level inconsistencies and verification gaps** that should be corrected before declaring Sprint 8B.3 fully closed.

The review is based on:
- `SPRINT_8B_3_OUTPUT_REVIEW.md`
- `PROACTIVE_AI_ARCHITECTURE.md`
- `PROACTIVE_RULE_CATALOG.md`
- `PROACTIVE_COOLDOWN_MODEL.md`
- `SESSION_CONTEXT.md`
- `AI_CHANGELOG.md`
- `PHASE_8_ROADMAP.md`

---

# 1. CRITICAL: Completeness Threshold Is Inconsistent

### Current inconsistency

The approved implementation plan specified:

> Domain completeness >= 75%

But the implementation/output/documentation now state:

> Completeness >= 70%

This appears in the architecture and changelog as `>= 70%`.

### Required action

Choose **one authoritative threshold** and align:

- `ProactiveObserverService.ts`
- `PROACTIVE_AI_ARCHITECTURE.md`
- `PROACTIVE_RULE_CATALOG.md`
- contracts/configuration
- tests
- output review
- roadmap/session context

### Recommendation

Retain **75%** unless the Agent can provide a documented architectural reason for changing it to 70%.

Do not silently lower a safety/data-quality gate during implementation.

### Acceptance criterion

There must be exactly one documented value for the observer completeness gate.

---

# 2. CRITICAL: "Asynchronous Daemon" Is Not Yet Proven

The architecture describes the observer as:

> an asynchronous, deterministic daemon

But the delivered REST surface explicitly exposes:

- `POST /evaluate`

The supplied output does not demonstrate an actual scheduler/background worker/event subscriber that automatically invokes evaluation when relevant state changes.

### Required action

The Agent must explicitly classify the current implementation as one of:

**A. Evaluation engine only**
- `POST /evaluate` is the current invocation mechanism.
- Automatic scheduling/event triggering is deferred.

OR

**B. True background observer**
- A scheduler/event subscriber exists.
- Its lifecycle, frequency, startup/shutdown behavior, failure handling and idempotency are documented and tested.

### Recommendation

For 8B.3, prefer **A** unless a scheduler was actually implemented.

Do not describe the system as continuously monitoring if nothing automatically invokes it.

---

# 3. HIGH: "AI Observer" vs Deterministic Rule Engine Must Be Clear

The implemented 9 rules are deterministic and consume existing calculation engines.

That is a strength.

However, terminology such as "AI Observer" / "AI daemon" could imply an LLM is making the financial determination.

### Required clarification

Document:

> AI is not responsible for calculating financial facts, deciding whether a fiduciary rule is true, assigning financial confidence, or executing actions.

The observer is currently a **deterministic fiduciary rule engine** operating within the broader AI architecture.

LLM/AI may later explain or summarize an already-generated trigger, but must not override the deterministic evidence.

---

# 4. CRITICAL: Test Coverage Is Too Small for the Claimed Guarantees

The output reports only:

> 12 Sprint 8B.3 tests

while claiming coverage of:

- 9 rules
- completeness gating
- confidence gating
- cooldowns
- materiality overrides
- lifecycle transitions
- idempotency
- concurrency
- security isolation
- audit logging
- performance

Twelve tests may technically contain multiple assertions, but the output does not demonstrate that each critical invariant has independently been verified.

### Required action

Add explicit tests for at least:

1. Each of the 9 rule codes.
2. Completeness below threshold.
3. Confidence below threshold.
4. Deterministic trigger ID.
5. Same-state duplicate suppression.
6. Materiality override.
7. Cooldown expiry.
8. Snooze 1-day accepted.
9. Snooze 30-day accepted.
10. Snooze 0/31-day rejected.
11. Cross-family read rejection.
12. Cross-family mutation rejection.
13. Concurrent duplicate creation.
14. Condition false -> `RESOLVED`.
15. Material state shift -> old `STALE` + new `ACTIVE`.
16. Immaterial state shift -> no duplicate.
17. Manual `/evaluate` obeys all gates.
18. Audit record provenance.
19. Notification failure does not destroy authoritative trigger.
20. No autonomous financial mutation.

The test count itself is not the objective; **coverage of safety invariants is**.

---

# 5. HIGH: Rule-to-Calculation Ownership Must Be Verified

The architecture says rules use authoritative engines, but the rule catalog includes direct sources such as:

- `insurance_policies`
- `financial_goals`
- `tax_deductions`
- Knowledge Graph

The implementation must not quietly introduce duplicate financial calculations inside `ProactiveObserverService`.

### Required action

For every rule document:

| Rule | Authoritative calculation owner | Observer responsibility |
|---|---|---|
| Equity drift | Existing portfolio/allocation engine | Evaluate threshold |
| Single-stock concentration | Existing portfolio valuation | Evaluate threshold |
| Insurance renewal | Existing insurance domain | Evaluate due date |
| HLV gap | Existing HLV/protection engine | Evaluate gap |
| Emergency fund | Existing liquidity/reserve calculation | Evaluate runway |
| Idle cash | Existing liquidity calculation | Evaluate threshold |
| Goal drift | Existing GoalPlanningService | Evaluate trajectory |
| 80C | Existing tax engine | Evaluate headroom |
| Nominee gap | Existing Estate/Graph service | Evaluate missing nominee |

If a calculation does not currently exist, create it as a domain engine rather than implementing hidden arithmetic inside the observer.

---

# 6. HIGH: Evidence Confidence Must Be Deterministic

The output says:

> calculation confidence >= 85%

The review requires the Agent to prove where this number comes from.

### Guardrail

The observer must never allow an LLM to decide:

> "confidence = 92%"

for a financial recommendation.

Confidence must derive from deterministic factors such as:

- source availability
- data completeness
- freshness
- calculation status
- provenance
- rule validity

If evidence confidence cannot be established, the trigger must be suppressed or marked insufficient-data.

---

# 7. HIGH: `STALE` vs `RESOLVED` Must Remain Exact

The documented semantics are good:

- Condition FALSE -> `RESOLVED`
- Condition TRUE + material state change -> old `STALE`, new `ACTIVE`
- Condition TRUE + immaterial change -> existing trigger remains active

### Required verification

Add tests proving these transitions, including:

```text
ACTIVE
  -> RESOLVED
```

when the underlying condition clears, and:

```text
ACTIVE(old hash)
  -> STALE
ACTIVE(new hash)
```

when the condition remains true but materially changes.

No trigger resurrection should occur merely because a hash changes.

---

# 8. HIGH: Cooldown and User Lifecycle State Need Clear Ownership

The system has both:

- `proactive_triggers`
- `proactive_cooldown_registry`

The trigger store is authoritative, while cooldown is suppression state.

This is correct.

However, user actions such as `DISMISSED` and `SNOOZED` appear in both lifecycle and cooldown concepts.

### Required clarification

Document that:

- Trigger lifecycle state belongs to `proactive_triggers`.
- Suppression timing belongs to `proactive_cooldown_registry`.
- User dismissal/snooze must not create contradictory states between the two stores.
- A dismissed trigger must not resurrect during the same unchanged condition unless the defined lifecycle explicitly permits it.
- A new material state must create a new trigger according to the deterministic identity rules.

---

# 9. HIGH: NotificationService Failure Isolation Must Be Tested

The architecture correctly states that `proactive_triggers` is authoritative and NotificationService is presentation-only.

### Required test

Simulate:

```text
Trigger DB transaction = SUCCESS
NotificationService = FAILURE
```

Expected:

```text
proactive_triggers = persisted
cooldown = persisted
audit = persisted
notification = retryable/presentation failure
```

A notification failure must never roll back or erase the authoritative fiduciary recommendation.

---

# 10. HIGH: Event-Driven Invocation Needs Explicit Scope

The architecture calls the observer event-driven, but the output does not identify the events that invoke evaluation.

Before future integration, define the event contract.

Examples:

- `DIGITAL_TWIN_HYDRATED`
- `LIFE_EVENT_PROCESSED`
- `PORTFOLIO_VALUATION_CHANGED`
- `INSURANCE_POLICY_UPDATED`
- `GOAL_UPDATED`
- `TAX_DATA_REFRESHED`

For each event, document which rules are eligible to run.

Do not evaluate all 9 rules unnecessarily for every event.

---

# 11. MEDIUM: Manual `/evaluate` Must Not Bypass Safety Controls

`POST /evaluate` must execute exactly the same:

- family scope validation
- completeness gate
- confidence gate
- rule version
- cooldown
- materiality
- idempotency
- audit
- no-mutation rules

Manual evaluation must not become an administrative bypass.

Add a regression test specifically for this.

---

# 12. MEDIUM: Materiality Thresholds Need Edge-Case Tests

The documented thresholds are useful and should remain rule-specific.

Add boundary tests:

```text
threshold - epsilon -> suppressed
threshold exactly -> override
threshold + epsilon -> override
```

This is particularly important for:

- percentage deltas
- days remaining
- ₹25,000 tax headroom
- nominee count changes

Also protect against divide-by-zero when the prior metric is zero.

---

# 13. MEDIUM: Rule Version Must Be Persisted and Immutable

The trigger identity includes:

```text
ruleVersion
```

Good.

The implementation should additionally guarantee:

- Every trigger stores its rule version.
- Historical triggers retain the version under which they were created.
- Changing a rule version cannot mutate historical trigger meaning.
- A new rule version can produce a new trigger identity.

---

# 14. MEDIUM: Explainability Lineage Must Be Complete

Every emitted trigger should retain the five-point lineage:

1. **Why?**
2. **Evidence?**
3. **Rule?**
4. **Calculation?**
5. **Freshness?**

The output mentions lineage but does not explicitly demonstrate a persisted end-to-end example.

### Required test

Create one trigger and assert all five lineage components are present and non-fabricated.

---

# 15. MEDIUM: No-Fabrication Rule Must Apply to Recommendations

Recommended actions must be grounded in available evidence.

For example:

- Do not recommend a specific investment product merely because idle cash is high.
- Do not invent an insurance policy.
- Do not invent a nominee.
- Do not invent a tax deduction.
- Do not invent a goal probability.

If required evidence is unavailable, output:

```text
INSUFFICIENT_DATA
```

rather than a fabricated recommendation.

---

# 16. Documentation Consistency Check

Before closing Sprint 8B.3, synchronize:

- `PROACTIVE_AI_ARCHITECTURE.md`
- `PROACTIVE_RULE_CATALOG.md`
- `PROACTIVE_COOLDOWN_MODEL.md`
- `SPRINT_8B_3_OUTPUT_REVIEW.md`
- `SESSION_CONTEXT.md`
- `AI_CHANGELOG.md`
- `PHASE_8_ROADMAP.md`

Specifically verify:

- completeness threshold
- confidence threshold
- cooldown terminology
- observer invocation model
- lifecycle states
- rule versions
- test counts

There must be no conflicting values.

---

# 17. Recommended Final Acceptance Criteria

Sprint 8B.3 can be marked **FULLY CLOSED** when:

- [ ] Completeness threshold is unified.
- [ ] Observer invocation model is accurately documented.
- [ ] Deterministic observer vs LLM responsibilities are explicit.
- [ ] All 9 rules are individually tested.
- [ ] Domain calculation ownership is documented.
- [ ] Confidence calculation is deterministic.
- [ ] Lifecycle transition tests are present.
- [ ] Cooldown/user-state ownership is unambiguous.
- [ ] Notification failure isolation is tested.
- [ ] Event-to-rule mapping is documented.
- [ ] Manual `/evaluate` cannot bypass safety gates.
- [ ] Materiality boundary tests are present.
- [ ] Rule version provenance is verified.
- [ ] Five-point explainability lineage is verified.
- [ ] No-fabrication behavior is verified.
- [ ] All Phase 8B documents are synchronized.
- [ ] Backend TypeScript = 0 errors.
- [ ] Frontend TypeScript = 0 errors.
- [ ] Master test suite remains fully green.

---

# Final Review Conclusion

The implementation is **architecturally strong and a major milestone for FamilyWealthOS**.

The most important concern is not a coding failure; it is **contract drift between the approved plan and the delivered implementation**, especially the change from **75% to 70% completeness**, plus the claim of a continuously running/event-driven observer without evidence of an actual invocation mechanism.

Therefore:

> **Do not roll back Sprint 8B.3. Do not redesign it. Perform the focused hardening above, synchronize the documentation, rerun the master suite, and then close 8B.3.**

After that, Phase 8B can be formally closed and Phase 8C can begin.

## Phase 8C Gate

Do not start Phase 8C implementation until the above acceptance criteria are green. The existing roadmap correctly identifies Phase 8C as the next execution phase, covering:

1. Family Financial Health Index
2. Family Timeline Ledger
3. Family Command Center
4. Financial Time Machine / zero-mutation What-If sandbox

