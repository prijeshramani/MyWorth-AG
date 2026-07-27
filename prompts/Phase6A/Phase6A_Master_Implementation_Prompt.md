# FamilyWealthOS --- Phase 6A Master Implementation Prompt

## Indian Tax Intelligence Engine (Master Specification)

> **Objective** Build an India-only, enterprise-grade Tax Intelligence
> Engine for FamilyWealthOS. This is a financial planning and tax
> optimization platform, **not** an ITR filing application.

## Context

Completed phases: - Investment Engine - Portfolio Analytics - Net
Worth - Protection & Insurance - Authentication/RBAC - Multi-tenancy -
Audit Logging

Do **not** redesign or modify existing engines.

## Architecture Rules

Controller → Application Service → Calculation Engine → Repository →
SQLite

No controller may access repositories directly.

## Non-Negotiable

Do not modify: - Investment engine - XIRR - Net worth engine -
Protection engine - Existing APIs - Existing UI components -
Authentication/RBAC

## India Scope

Implement taxation based only on Indian taxation principles. Design for
annual Finance Act changes through configuration rather than code
changes.

## Modules

### 1. Tax Profile

-   FY / AY
-   Residential status
-   Age category
-   PAN
-   Aadhaar link
-   Regime
-   HUF membership

### 2. Income

Support: - Salary - Business - House property - Capital gains -
Dividend - Interest - Agriculture - Foreign income - Other sources

### 3. Deductions

Support configurable deductions including: 80C, 80CCD(1), 80CCD(1B),
80CCD(2), 80D, 80DD, 80DDB, 80E, 80EE, 80EEA, 80G, 80GG, 24(b).

Store: - limit - claimed - remaining - applicable regime - documents -
validation rules

### 4. Capital Gains

Support: - Equity - Mutual Funds - Debt Funds - Hybrid - Gold ETF -
SGB - Physical Gold - Bonds - Property - REIT - InvIT

Calculate: - FIFO - Holding period - STCG - LTCG - Indexation (where
applicable) - Set-off - Carry forward - Exemptions

Read transactions from existing Investment module. Never duplicate
holdings.

### 5. Tax Optimizer

Recommendations: - Old vs New regime - Tax loss harvesting - 80C
completion - NPS optimisation - Advance tax - Estimated tax savings -
Priority & explanation

### 6. Family Tax

-   Individual
-   Spouse
-   HUF
-   Family efficiency score
-   Ownership suggestions

### 7. Compliance Calendar

-   Advance tax
-   ITR
-   ELSS lock-in
-   FY end
-   AY reminders

## Rule Engine (Mandatory)

Never hardcode: - Slabs - Rates - Cess - Surcharge - Holding periods -
Deduction limits - Rebates

Create: - tax_rules - tax_slabs - deduction_rules - capital_gain_rules -
holding_period_rules - rebate_rules - cess_rules - surcharge_rules -
financial_year_rules

## Tax Rule Seed Loader (Mandatory)

Implement TaxRuleSeedLoader.

Requirements: - Populate baseline rules - Idempotent - Version by FY -
Preserve history - No overwrite

Seed: - Old/New regime slabs - Rebate - Cess - Surcharge - Deduction
limits - Capital gain rules - Holding periods - FY/AY mapping

## Rule Metadata

Each rule stores: - RuleId - Category - Code - FY - AY - Version -
EffectiveFrom - EffectiveTo - Status - GovernmentReference -
FinanceActYear - CBDTNotification - GazetteReference - SourceReference -
CreatedDate

## Database Migration

006_taxation.ts

Tables: - tax_profiles - tax_income_sources - tax_deductions -
capital_gain_transactions - capital_gain_summary - tax_rules -
tax_slabs - deduction_rules - holding_period_rules - tax_reports -
tax_recommendations - tax_calendar

All tables: - family_id - audit columns - FK & indexes

## Backend

Create: - TaxRepository - TaxRuleRepository - CapitalGainRepository -
TaxCalculationService - CapitalGainService - DeductionService -
TaxOptimizationService - RecommendationService - CalendarService -
TaxController - TaxRoutes

## APIs

GET /api/v1/tax/summary GET /api/v1/tax/regime-comparison GET
/api/v1/tax/capital-gains GET /api/v1/tax/deductions GET
/api/v1/tax/recommendations GET /api/v1/tax/calendar POST
/api/v1/tax/profile POST /api/v1/tax/income POST /api/v1/tax/deduction

## Frontend

Create: - Tax Dashboard - Regime Comparison - Deduction Tracker -
Capital Gains - Tax Calendar - Recommendations - Tax Health Score

Reuse existing UI components.

## Security

Respect: - Authentication - RBAC - Multi-tenancy - Audit logging -
family_id filtering

## Testing

Add unit tests for: - Rule engine - Seed loader - Tax calculation -
Capital gains - Deductions - Recommendations - APIs - Controllers

Existing tests must continue to pass.

## Documentation

Generate: - TAX_ARCHITECTURE.md - INDIAN_TAX_RULE_ENGINE.md -
CAPITAL_GAINS_ENGINE.md - DEDUCTION_ENGINE.md -
RULE_CONFIGURATION_GUIDE.md - Sprint_6A_Retrospective.md -
AI_CHANGELOG.md - SESSION_CONTEXT.md - Phase 6A - Implementation
Summary.md

## Definition of Done

-   India-only tax engine
-   Rule engine complete
-   Seed loader complete
-   Versioned rules
-   Capital gains engine
-   Deduction engine
-   Tax optimizer
-   Family tax planning
-   Compliance calendar
-   Existing engines untouched
-   Tests passing
-   Production build clean

## Architectural Vision

FamilyWealthOS should become the most comprehensive Indian Family Wealth
Management platform. Every recommendation must be explainable,
rule-driven, auditable, versioned, and maintainable through annual rule
updates instead of code changes.
