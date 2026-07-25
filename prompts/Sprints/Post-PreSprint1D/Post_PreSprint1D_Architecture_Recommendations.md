# Post Pre-Sprint 1D Architecture Recommendations

## Final Architecture Stabilization (Mandatory Before Sprint 1D)

## Status

The Pre-Sprint 1D architecture alignment is **approved**.

The core domain model is now considered **Version 1.0** and should be
treated as architecturally stable.

Future work should build business capabilities on top of this model
instead of redesigning it.

------------------------------------------------------------------------

# Approved Canonical Domain Model

``` text
Family
    │
Family Member
    │
Entity
    │
Account
    │
Holding
    ├── Asset Master
    └── Transactions
             │
             └── Price History
```

No new core entities should be introduced without explicit architectural
review.

------------------------------------------------------------------------

# Mandatory Documentation Updates

## 1. Freeze Domain Model

Update `SYSTEM_ARCHITECTURE.md` and `DATA_MODEL.md` to explicitly state:

> Domain Architecture Version: **1.0 (Frozen)**

Future changes should extend behaviour rather than modify the ownership
hierarchy.

------------------------------------------------------------------------

## 2. Introduce Engine Architecture Section

Add a new section to `SYSTEM_ARCHITECTURE.md` describing future
computational engines.

``` text
backend/src/engines/

NetWorthEngine
XirrEngine
CapitalGainEngine
DividendEngine
AssetAllocationEngine
TaxEngine
GoalEngine
```

Clarify responsibilities:

-   Services orchestrate workflows.
-   Repositories access data.
-   Engines perform financial calculations.

Do NOT implement these engines yet.

------------------------------------------------------------------------

## 3. Add Asset Identifier Strategy

Extend `DATA_MODEL.md` with an Asset Identifier Strategy.

Rules:

1.  Internal immutable Asset ID.
2.  External identifiers:
    -   ISIN
    -   Symbol
    -   Asset Reference
3.  Business-key precedence:
    -   ISIN
    -   Symbol + Asset Type
    -   Name + Asset Type

Document only.

------------------------------------------------------------------------

## 4. Future Classification Strategy

Reserve support for future Asset Classification.

Example hierarchy:

``` text
Asset
  ↓
Classification
  ↓
Category
  ↓
Subcategory
  ↓
Region
```

No implementation required.

------------------------------------------------------------------------

## 5. Roadmap Update

Replace any remaining references to "Portfolio" in future roadmap.

Recommended roadmap:

Sprint 1D -- Transaction Engine Foundation

Sprint 2 -- Price Engine

Sprint 3 -- Analytics Engine

Sprint 4 -- Tax & Capital Gains Engine

Sprint 5 -- Goal Planning Engine

------------------------------------------------------------------------

# Deliverables

Update:

-   DATA_MODEL.md
-   SYSTEM_ARCHITECTURE.md
-   AI_CHANGELOG.md

Create:

-   Architecture_v1.0.md

This document should summarize:

-   Final domain hierarchy
-   Architectural principles
-   Source of truth philosophy
-   Stored vs computed data
-   Future engine roadmap

------------------------------------------------------------------------

# Expected Outcome

After these updates the architecture should be considered stable.

Subsequent sprints should focus on:

-   Business logic
-   Financial engines
-   Importers
-   Reporting
-   Analytics

Avoid introducing new foundational entities unless a future
architectural review determines they are necessary.
