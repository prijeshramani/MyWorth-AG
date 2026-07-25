# Pre-Sprint 1D Architecture Alignment

## Transaction Ownership Refactoring (Mandatory before Sprint 1D)

### Objective

Before implementing Sprint 1D, perform a small architectural alignment
so the system remains consistent for XIRR, Tax, Analytics and Net Worth
engines.

**This is NOT Sprint 1D.** This is a design-alignment/refactoring
sprint.

------------------------------------------------------------------------

# Background

Current implementation links:

    Asset Master
        └── Transactions

This is insufficient because the same Asset may exist in multiple
Accounts.

Example:

Prijesh ├── Zerodha │ └── TCS └── Groww └── TCS

Both accounts own the same Asset Master.

A transaction must belong to a specific ownership instance.

------------------------------------------------------------------------

# Approved Target Architecture

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
               └── Price History (via Asset Master)

Transactions belong to a Holding (or equivalent Account + Asset
ownership link), NOT directly to Asset Master.

------------------------------------------------------------------------

# Mandatory Tasks

## 1. Review Existing Transaction Model

Analyse the current transaction schema and identify every place where
transactions reference Asset Master directly.

Do not break backward compatibility.

------------------------------------------------------------------------

## 2. Design Migration Strategy

Produce a migration approach that safely introduces Holding ownership.

If additional nullable foreign keys are required during migration,
document them.

No destructive migration.

------------------------------------------------------------------------

## 3. Update Documentation

Update:

-   DATA_MODEL.md
-   SYSTEM_ARCHITECTURE.md
-   ER_DIAGRAM.md

Reflect the new ownership relationship.

------------------------------------------------------------------------

## 4. Repository Impact Analysis

Document repositories requiring changes.

Expected impact:

-   TransactionRepository
-   HoldingRepository
-   AssetMasterRepository

------------------------------------------------------------------------

## 5. Service Impact Analysis

Document required service updates.

Expected:

-   TransactionService
-   HoldingService
-   AssetMasterService

------------------------------------------------------------------------

## 6. API Impact Analysis

Identify APIs requiring changes.

Maintain backward compatibility where possible.

------------------------------------------------------------------------

## 7. Future Engine Validation

Verify the new model supports:

-   XIRR
-   Capital Gains
-   Net Worth
-   Asset Allocation
-   Family Aggregation
-   Analytics

No implementation required.

------------------------------------------------------------------------

# Deliverables

Create:

-   Transaction_Ownership_Design.md
-   Updated DATA_MODEL.md
-   Updated SYSTEM_ARCHITECTURE.md
-   Updated ER_DIAGRAM.md

The design document must explain:

-   Why transactions belong to Holdings
-   Migration strategy
-   Risks
-   Compatibility
-   Final recommendation

------------------------------------------------------------------------

# Important Constraints

-   Do NOT implement XIRR.
-   Do NOT implement Tax.
-   Do NOT implement Analytics.
-   Do NOT redesign UI.
-   Do NOT introduce Portfolio.
-   Preserve all existing tests.
-   Preserve backward compatibility.

------------------------------------------------------------------------

# Expected Outcome

At the end of this activity the project should have a finalized domain
model where:

Asset Master = master definition

Holding = ownership instance

Transaction = activity against a Holding

Price History = market data for Asset Master

Only after this review and alignment should Sprint 1D implementation
begin.
