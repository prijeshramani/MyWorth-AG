# 🛡 PROTECTION_INSURANCE_ARCHITECTURE.md — Protection & Insurance Domain Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 5C (Protection & Insurance Domain Architecture & UX Integration)  
**Date**: July 27, 2026  
**Status**: APPROVED DOMAIN ARCHITECTURE  

---

## 1. Executive Domain Architecture

The **Protection & Insurance Domain** is designed as a standalone, independent business domain within Family Wealth OS. 

> [!IMPORTANT]
> **Domain Isolation Principle**:
> Insurance policies (Life, Health, Term, LIC Endowment, ULIP, etc.) are **NOT investments** and are **NOT portfolio holdings**. They provide financial risk mitigation and coverage protection rather than asset wealth valuation.

```
+-----------------------------------------------------------------------------------+
|                            FAMILY WEALTH OS CORE APP                              |
+-----------------------------------------------------------------------------------+
           │                                                       │
           ▼                                                       ▼
+-------------------------------+       +-------------------------------------------+
|   INVESTMENT WEALTH DOMAIN    |       |       PROTECTION & INSURANCE DOMAIN       |
| • Assets, Holdings, Valuation |       | • Life, Term, Health, LIC Policies        |
| • Net Worth, Performance XIRR |       | • Protection Score, Sum Assured Coverage  |
| • Risk Metrics, HHI Index     |       | • Premium Calendars, Nominee Tracking     |
+-------------------------------+       +-------------------------------------------+
```

---

## 2. Domain Integration Boundaries

1. **Dashboard Integration**: Integrates directly into the executive dashboard via modular protection widgets (`ProtectionScoreWidget`, `UpcomingPremiumsWidget`, `CoverageGapWidget`).
2. **Family Hierarchy Pointers**: Every policy references `familyId` and `policyHolderMemberId` (Family Member), maintaining strict multi-level ownership.
3. **Recommendation Engine Integration**: Feeds coverage gap data and missing nominee alerts into the platform recommendation model.
