# Phase 5C – Protection & Insurance Domain (Architecture & UX Integration)

Architecture Review Board Status:

Phase 5B-3A APPROVED.

This sprint incorporates both:

1. Protection & Insurance architecture
2. ARB architecture improvements

No production code.

Architecture and UX only.

---

Objective

Introduce a new business domain:

Protection & Insurance

This is NOT an Investment.

This is NOT a Portfolio Holding.

It is an independent financial domain.

The sprint must also integrate all outstanding ARB recommendations so that no additional review cycle is required before implementation.

---

Read

- SESSION_CONTEXT.md
- AI_CHANGELOG.md
- FRONTEND_ARCHITECTURE.md
- COMPONENT_LIBRARY.md
- DESIGN_SYSTEM.md
- CHART_DESIGN_SYSTEM.md
- ICON_REGISTRY.md
- RESPONSIVE_BREAKPOINTS.md
- Recommendation Model
- Dashboard Widget Architecture

---

Create

1. PROTECTION_INSURANCE_ARCHITECTURE.md

2. PROTECTION_DOMAIN_MODEL.md

3. POLICY_DATA_MODEL.md

4. PROTECTION_SCORE_MODEL.md

5. POLICY_LIFECYCLE.md

6. PROTECTION_DASHBOARD.md

7. PROTECTION_CHART_STRATEGY.md

8. PROTECTION_WIDGETS.md

9. PROTECTION_NOTIFICATIONS.md

10. PHASE_5C_IMPLEMENTATION_PLAN.md

---

Supported policy types

- LIC Endowment

- LIC Money Back

- LIC Pension

- LIC Child

- Term Insurance

- Health Insurance

- Family Floater

- ULIP

- Personal Accident

- Critical Illness

Future

- Vehicle Insurance

- Home Insurance

- Travel Insurance

---

For every policy support

Policy Number

Insurer

Policy Holder

Nominee

Premium

Premium Frequency

Coverage

Sum Assured

Start Date

Maturity Date

Next Premium

Status

Documents

Notes

---

Design dashboard widgets

Protection Score

Life Cover

Health Cover

Upcoming Premiums

Policy Maturity

Missing Nominee

Policy Distribution

Premium Calendar

---

Chart Strategy

Reuse existing Chart Design System.

Design

- Coverage Distribution

- Premium Timeline

- Policy Maturity Timeline

- Protection Score Trend

No implementation.

---

Icon Strategy

Extend the existing Icon Registry.

Do NOT create a second registry.

---

Responsive Strategy

Reuse existing Responsive Breakpoints.

Do NOT introduce a new responsive system.

---

Component Strategy

Reuse existing components whenever possible.

Only introduce new components if absolutely required.

---

Notifications

Reuse Global Notification Center.

Support future notifications

- Premium Due

- Policy Expiring

- Policy Matured

- Missing Nominee

---

Recommendation Engine

Reuse the platform Recommendation Model.

Examples

Coverage Gap

Missing Nominee

Policy Expiry

Premium Overdue

Underinsured

No new recommendation engine.

---

Architecture Rules

Policies are NOT investments.

Policies are NOT holdings.

Protection is an independent business domain.

Integrate with Dashboard only.

Preserve Backend Platform v1.0.

Preserve Frontend Architecture.

---

Update

SESSION_CONTEXT.md

AI_CHANGELOG.md

---

Deliver

1. Executive Architecture Summary

2. UX Integration Summary

3. Dashboard Integration Summary

4. Component Reuse Assessment

5. Implementation Plan

6. Exactly ONE recommendation before implementation begins.
