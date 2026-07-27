# ⚙️ INDIAN_TAX_RULE_ENGINE.md — Tax Rule Engine Specification

**System Name**: Family Wealth OS  
**Phase**: Phase 6A  
**Date**: July 27, 2026  
**Status**: APPROVED RULE ENGINE  

---

## 1. Zero Hardcoding Principle

No tax slabs, rates, cess, surcharge, holding periods, deduction limits, or rebates are hardcoded in application logic. All parameters are stored in versioned SQLite tables (`tax_rules`, `tax_slabs`, `deduction_rules`) populated idempotently by `TaxRuleSeedLoader.ts`.

---

## 2. Rule Metadata Attributes

Each rule contains complete regulatory audit metadata:
- `RuleId`: Unique identifier (`IND_TAX_NEW_REGIME_FY2526`).
- `Category`: `INCOME_TAX_SLABS`, `CAPITAL_GAINS`, `DEDUCTION_LIMIT`.
- `Code`: Category-unique rule code.
- `FinancialYear`: e.g. `2025-26`.
- `AssessmentYear`: e.g. `2026-27`.
- `Version`: Semantic version string (`1.0.0`).
- `GovernmentReference`: CBDT Notification & Finance Act reference (`Finance Act 2024`).
