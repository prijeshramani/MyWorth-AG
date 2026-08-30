# REVIEW COMMENTS – SPRINT 9.1 IMPLEMENTATION PLAN

## Review Status

**REVISE IMPLEMENTATION PLAN BEFORE PRODUCTION IMPLEMENTATION**

The overall Sprint 9.1 direction is approved conceptually.

The plan correctly preserves several critical architectural principles:

- No parallel financial data model.
- Authoritative backend completeness calculation.
- Deterministic server-side Next-Best-Action ranking.
- Existing domain API reuse.
- Read-only completeness retrieval.
- Data integrity prioritized above missing-data enrichment.
- Existing direct data-entry workflows remain supported.

However, the following architectural issues must be resolved before implementation begins.

---

# 1. REMOVE FIXED `potentialScoreGain` FROM NEXT-BEST-ACTION CONTRACT

The proposed contract contains:

```typescript
potentialScoreGain: z.number().min(0).max(25)
```

The action registry also contains fixed statements such as:

```text
+10 pts Completeness
+5 pts Completeness
+8 pts Completeness
```

This must be removed from Sprint 9.1.

## Reason

Completeness is authoritative and dynamically calculated by `DigitalTwinService`.

The impact of resolving an action may depend on:

- Existing persisted data.
- Other unresolved gaps.
- Domain weighting.
- The completeness of the submitted information.
- Future changes to completeness calculation logic.

A static action registry must not become a shadow completeness engine.

## Replace with

Use deterministic qualitative impact metadata such as:

```text
impactLevel:
- HIGH
- MEDIUM
- LOW
```

And explicit capability metadata such as:

```text
affectedCapabilities:
- FAMILY_FINANCIAL_HEALTH
- LIQUIDITY_RUNWAY
- PROACTIVE_OBSERVER
```

The action may explain:

> "Adding monthly household expenses enables emergency runway calculation."

It must not promise a fixed score increase unless a future authoritative before/after simulation capability is explicitly implemented.

---

# 2. DO NOT ADD `family_onboarding_state` MIGRATION YET

The proposed optional migration:

```text
020_onboarding_progress
```

must be removed from the initial Sprint 9.1 implementation plan unless a concrete persistence requirement is demonstrated.

Particularly do not introduce:

```text
dismissed_actions_json
```

at this stage.

## Reason

The onboarding and Next-Best-Action systems are intended to be derived from authoritative financial data.

Persisting dismissed actions creates difficult questions:

- Does dismissal survive material data changes?
- Can a critical data-integrity issue be dismissed?
- Can missing foundational information remain hidden permanently?
- How will future Sprint 9.2 reconciliation findings interact with dismissed actions?

## Sprint 9.1 Default

Use:

- Derived onboarding readiness from authoritative data.
- Derived Next-Best-Actions from authoritative data.
- Ephemeral frontend state for modal visibility and current UI step.

Do not persist onboarding progress unless cross-session resume is explicitly required.

If persistent onboarding progress becomes necessary later, design it separately and do not use it to suppress fiduciary or data-integrity actions.

---

# 3. REWORK THE `X-Family-Id` SECURITY HARDENING PROPOSAL

The proposed precedence logic must not be implemented as written until the actual authentication architecture is documented.

The proposed fallback allowing:

```text
query.familyId
body.familyId
x-family-id
```

for `SYSTEM_ADMIN` creates unnecessary ambiguity and attack surface.

## Required invariant

For ordinary FamilyWealthOS application APIs:

> Family scope must never be resolved from client-controlled headers, query parameters, or request bodies.

## Required assessment before implementation

Document:

1. Current authentication middleware.
2. Where authenticated user identity is attached.
3. Where family scope is currently resolved.
4. Whether `X-Family-Id` is currently read anywhere.
5. Whether CORS merely allows the header or whether application logic consumes it.
6. Whether a legitimate cross-family administrative use case actually exists.

## Preferred design

If privileged cross-family administration is genuinely required in the future:

- Use a dedicated administrative route.
- Require explicit authorization.
- Validate the target family.
- Create an audit event.
- Do not reuse ordinary family-scoped API behavior.

Do not allow ordinary routes to switch family scope through generic headers.

---

# 4. CLARIFY ENGINE OUTPUT VS UI TOP-3 DISPLAY

The plan currently contains inconsistent requirements:

- "Top 3 actions"
- `rankedActions.max(5)`

Resolve this explicitly.

## Recommended design

### Backend

Generate and rank all applicable actionable gaps, subject to a reasonable bounded response.

### Frontend default

Display:

> Top 3 highest-priority actions.

### Future capability

A future "View All Actions" experience may consume the remaining ranked actions.

The implementation plan must define whether the endpoint returns:

- All ranked actions, or
- A bounded configurable number.

Do not leave this inconsistent.

---

# 5. ACTION REGISTRY MUST NOT DUPLICATE COMPLETENESS WEIGHTS

Remove score-specific wording from action definitions such as:

```text
Unlocks Life-Stage Health Calibration (+10 pts)
Unlocks Protection Shield (+10 pts)
Unlocks Estate Pillar (+8 pts)
```

The ActionRankingEngine should rank actions based on deterministic priority criteria, not maintain a duplicate scoring system.

## Action metadata should answer

### What is missing?

Example:

> Monthly household expenses.

### Why does it matter?

> Emergency liquidity runway cannot currently be calculated.

### Which capabilities are affected?

Example:

- Family Financial Health
- Liquidity assessment
- Proactive Observer

### How important is the action?

Example:

> HIGH

This preserves the authoritative ownership of completeness calculations.

---

# 6. REASSESS PAN AS A UNIVERSAL ONBOARDING REQUIREMENT

The proposed Stage 1 flow requires:

> Primary Head/Testator + Spouse + Children/Dependents with Date of Birth & PAN.

PAN should not automatically be mandatory for every family member.

Examples may include:

- Children.
- Dependents without PAN.
- Users who are not ready to provide tax information during initial setup.

## Required approach

Reuse existing authoritative domain validation.

Classify fields as:

### Required for current capability

Only fields genuinely required for the capability being configured.

### Conditional

Required only for tax/KYC workflows where applicable.

### Optional enrichment

Information that improves future intelligence.

Do not make the onboarding wizard more restrictive than existing domain rules without explicit business justification.

---

# 7. ACTION RESOLUTION MUST BE BASED ON AUTHORITATIVE STATE

After a user clicks an action and completes the target domain workflow:

1. The existing authoritative domain write occurs.
2. The action endpoint is queried again.
3. `DigitalTwinService` recalculates completeness.
4. `ActionRankingEngine` recalculates priorities.

Do not mark an action as completed merely because:

- The user clicked it.
- The wizard step was visited.
- A modal was opened.

The underlying authoritative data must satisfy the action's deterministic resolution condition.

---

# 8. ONBOARDING WIZARD MUST SUPPORT SKIP / DEFER WITHOUT HIDING DATA GAPS

Progressive onboarding must allow users to defer non-essential information.

However:

> Skipping a wizard step must not convert missing financial information into completed information.

The UI may allow:

- Skip for now.
- Continue later.

But the authoritative completeness engine must continue to report the gap accurately.

---

# 9. DEEP LINKS SHOULD BE CONFIGURATION, NOT FINANCIAL LOGIC

The proposed `targetRoute` approach is acceptable.

However, routing information should remain presentation/navigation metadata.

The financial action condition must not depend upon the frontend route.

Maintain separation:

```text
Action Condition
    ↓
Authoritative Missing Data

Action Metadata
    ↓
Suggested UI Resolution Destination
```

This will allow future UI restructuring without changing fiduciary action logic.

---

# 10. REQUIRED ADDITIONAL TEST CASES

Add the following tests.

## 10.1 No False Completion

Verify:

> Visiting an onboarding step without saving authoritative data does not resolve the action.

---

## 10.2 Skip Does Not Hide Gap

Verify:

> Skipping or closing the wizard does not alter completeness or action ranking.

---

## 10.3 Dynamic Recalculation

Verify:

> Completing an authoritative domain action causes the relevant action to disappear only after the underlying deterministic condition is satisfied.

---

## 10.4 No Static Score Promise

Verify:

> Action metadata does not independently calculate or promise completeness score gains.

---

## 10.5 Family Scope

Verify:

> `X-Family-Id`, query parameters, and request body values cannot alter family scope for ordinary authenticated routes.

---

## 10.6 Data Integrity Priority

Prepare the ActionRankingEngine contract so future Sprint 9.2 data-integrity findings can outrank missing-foundation actions.

At least one test should verify deterministic category precedence independent of frontend ordering.

---

# 11. REVISED SPRINT 9.1 SCOPE

The revised implementation scope should be:

## Backend

- Actionable completeness contract.
- Deterministic ActionRankingEngine.
- Read-only actionable completeness endpoint.
- Integration with existing DigitalTwinService.
- Family scope security verification/hardening based on actual current authentication architecture.

## Frontend

- Progressive onboarding orchestration UI.
- Reuse existing authoritative domain workflows/forms.
- Top 3 Next-Best-Action display.
- Clear capability-impact explanations.
- Skip/defer support without altering authoritative completeness.

## Explicitly excluded

- Persistent onboarding database state.
- Dismissed action persistence.
- Static completeness point-gain calculations.
- Parallel financial data models.
- Client-controlled family selection.
- New financial calculation engines.

---

# 12. REQUIRED NEXT DELIVERABLE

Revise:

# `SPRINT_9.1_IMPLEMENTATION_PLAN.md`

The revised plan must explicitly document:

1. Removal of fixed `potentialScoreGain`.
2. Impact metadata replacement.
3. Removal of Migration 020 from the initial scope.
4. Actual `X-Family-Id` request-path audit findings.
5. Final engine-output versus UI Top-3 behavior.
6. Authoritative action resolution semantics.
7. Skip/defer behavior.
8. Updated test strategy.

After producing the revised implementation plan:

> STOP.

Do not begin production implementation until the revised plan is reviewed and approved.