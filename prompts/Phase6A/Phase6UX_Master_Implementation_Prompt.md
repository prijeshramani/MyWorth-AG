# Phase6UX_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 6UX

## Product Integration, UI Wiring & Data Management

> **Mission** Transform FamilyWealthOS from a collection of completed
> modules into a production-ready application that supports real user
> onboarding, navigation, CRUD operations, imports, document management,
> and daily usage.

## Guiding Principles

-   No new financial calculation engines.
-   Reuse all existing modules.
-   Reuse all parsers, broker integrations, OCR, import framework and
    document upload components already implemented.
-   Do not duplicate functionality.
-   Wire everything together into one seamless product.

------------------------------------------------------------------------

# Scope

## 1. Product Integration

Connect all completed modules:

-   Dashboard
-   Family
-   Investments
-   Holdings
-   Transactions
-   Protection
-   Tax Intelligence
-   Authentication
-   Settings
-   Documents (foundation)
-   Reports (foundation)

Every screen must be reachable from navigation.

------------------------------------------------------------------------

## 2. Navigation

Create a polished responsive navigation.

Dashboard

Family

Investments

Portfolio

Transactions

Accounts

Protection

Tax Intelligence

Documents

Estate (Coming Soon)

Reports

Settings

Developer Mode

------------------------------------------------------------------------

## 3. CRUD

Provide complete Create/Read/Update/Delete for all completed domains.

-   Family
-   Members
-   Accounts
-   Investments
-   Holdings
-   Insurance
-   Tax Profile
-   Brokers
-   Institutions

Validation, pagination, filtering and search required.

------------------------------------------------------------------------

## 4. Onboarding Wizard

Guide first-time users.

1.  Create Family
2.  Add Members
3.  Add Bank Accounts
4.  Connect Brokers or Import
5.  Add Insurance
6.  Configure Tax Profile
7.  Upload Documents
8.  Review Dashboard

------------------------------------------------------------------------

## 5. Import Center (MANDATORY)

Reuse existing implementation.

DO NOT recreate:

-   Broker Integrations
-   Parser Engine
-   OCR
-   CSV Parser
-   Excel Parser
-   PDF Parser
-   CAMS CAS parser
-   NSDL/CDSL parser
-   Validation Engine

Discover existing code and integrate it.

Supported sources:

-   Broker APIs
-   Broker Statements
-   PDF
-   CSV
-   Excel
-   OCR
-   CAMS CAS
-   NSDL/CDSL
-   Manual Entry

------------------------------------------------------------------------

## 6. Import Review Workflow

Import → Parse → Validate → Preview → User Corrections → Duplicate
Detection → Approval → Persist

Never write parsed data directly without review.

------------------------------------------------------------------------

## 7. Mapping Engine

Allow reusable column mapping.

Persist mappings per source.

------------------------------------------------------------------------

## 8. Duplicate Detection

Detect duplicate:

-   transactions
-   holdings
-   dividends
-   SIPs
-   insurance policies
-   tax records

Allow merge, skip or overwrite.

------------------------------------------------------------------------

## 9. Data Manager

Single operational console.

Includes:

-   Import History
-   Export History
-   Pending Reviews
-   Duplicate Records
-   Parser Errors
-   Validation Warnings
-   Rollback
-   Sync Status
-   Logs

------------------------------------------------------------------------

## 10. Dashboard Polish

Redesign dashboard using existing widgets.

Cards:

-   Net Worth
-   Investments
-   Protection
-   Tax Position
-   Estate Placeholder
-   Alerts
-   Recent Activity

------------------------------------------------------------------------

## 11. Documents

Reuse DocumentRepository.

Support upload and categorization.

PAN Aadhaar Insurance Statements Property Tax Identity

------------------------------------------------------------------------

## 12. Global Search

Search across:

Family

Investments

Transactions

Policies

Documents

Tax

Accounts

------------------------------------------------------------------------

## 13. Settings

Profile

Security

Notifications

Theme

Backup

Restore

Import

Export

Financial Year

Currency

------------------------------------------------------------------------

## 14. Demo & Real Data

Support switching between:

-   Demo Dataset
-   Personal Dataset

------------------------------------------------------------------------

## 15. Developer Mode

Provide:

-   DB Viewer (read-only)
-   API Log
-   Error Log
-   Migration Status
-   Rule Engine Viewer
-   Build Information
-   Seed Data Manager
-   Performance Metrics

------------------------------------------------------------------------

## 16. UX Requirements

Loading states

Empty states

Error states

Responsive layout

Keyboard accessibility

Consistent design system

------------------------------------------------------------------------

## 17. Testing

Verify:

-   Navigation
-   CRUD
-   Imports
-   Parser integration
-   Duplicate detection
-   Search
-   Dashboard
-   Authentication

Existing tests must continue passing.

------------------------------------------------------------------------

## 18. Deliverables

Generate:

-   PRODUCT_INTEGRATION_ARCHITECTURE.md
-   IMPORT_CENTER_ARCHITECTURE.md
-   DATA_MANAGER_GUIDE.md
-   UI_NAVIGATION_GUIDE.md
-   USER_ONBOARDING_GUIDE.md
-   Sprint_6UX_Retrospective.md
-   AI_CHANGELOG.md
-   SESSION_CONTEXT.md
-   Phase 6UX - Implementation Summary.md

------------------------------------------------------------------------

## Definition of Done

✓ Every completed module is accessible.

✓ Existing parser framework reused.

✓ Existing broker integrations reused.

✓ Existing OCR reused.

✓ Existing import engine reused.

✓ CRUD complete.

✓ Import Center operational.

✓ Data Manager operational.

✓ Global Search working.

✓ Onboarding complete.

✓ Dashboard polished.

✓ Demo & Real Data supported.

✓ Developer Mode available.

✓ Zero duplication of existing modules.

✓ Production build clean.

✓ Existing tests pass.

✓ New tests pass.

## Final Instruction

This phase is an integration phase. Prioritize reuse over redevelopment.
Search the existing codebase for parsers, broker integrations, OCR,
import workflows, and document services before implementing anything
new. Extend and wire them into the UI instead of replacing them.
