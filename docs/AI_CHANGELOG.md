# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Phase 6A] - Indian Tax Intelligence Engine (2026-07-27)

### Summary
Implemented the **Indian Tax Intelligence Engine** across backend and frontend. Created SQLite database migration `006_taxation.ts` (`tax_profiles`, `tax_income_sources`, `tax_rules`, `tax_slabs`, `deduction_rules`, `tax_deductions`, `capital_gain_summary`, `tax_recommendations`, `tax_calendar`). Created zero-hardcoding `TaxRuleSeedLoader.ts` populating baseline rules for FY 2025-26 & FY 2026-27. Implemented `TaxCalculationEngine.ts` (Old vs New Regime calculation, Standard Deduction ₹75k vs ₹50k, Section 87A rebate, Cess 4%), `CapitalGainTaxEngine.ts` (FIFO STCG/LTCG under Finance Act 2024), `SQLiteTaxRepository.ts`, `TaxApplicationService.ts`, `TaxController.ts`, and `taxRoutes.ts` serving `/api/v1/tax/summary`. Built frontend `taxService.ts`, `useTaxSummary.ts` query hook, and `TaxDashboard.tsx` view. Created 5 architectural documentation files. Added Section 23 unit tests (**161 PASSED, 0 FAILED**). Verified production bundle build via Vite (`dist/` built cleanly in 9.00s with 0 errors).

### Added
- `backend/src/db/migrations/006_taxation.ts`: Taxation database schema migration 006.
- `backend/src/engines/tax/TaxRuleSeedLoader.ts`: Idempotent seed loader for Indian tax rules.
- `backend/src/engines/tax/TaxCalculationEngine.ts`: Old vs New regime tax calculation engine.
- `backend/src/engines/tax/CapitalGainTaxEngine.ts`: STCG/LTCG capital gains calculation engine.
- `backend/src/repositories/SQLiteTaxRepository.ts`: SQLite tax repository.
- `backend/src/services/TaxApplicationService.ts`: Tax application service.
- `backend/src/controllers/TaxController.ts`: Tax REST API controller.
- `backend/src/routes/taxRoutes.ts`: Express router for tax endpoints.
- `frontend/src/services/taxService.ts`: Typed API client for tax endpoints.
- `frontend/src/hooks/useTaxSummary.ts`: TanStack Query hook for tax summary data.
- `frontend/src/components/tax/TaxDashboard.tsx`: Tax Dashboard page view.
- `docs/TAX_ARCHITECTURE.md`: Tax domain architecture document.
- `docs/INDIAN_TAX_RULE_ENGINE.md`: Tax rule engine specification.
- `docs/CAPITAL_GAINS_ENGINE.md`: Capital gains calculation rules.
- `docs/DEDUCTION_ENGINE.md`: Section 80C/80D deduction engine rules.
- `docs/RULE_CONFIGURATION_GUIDE.md`: Annual Finance Act update configuration guide.
- `docs/Sprint_6A_Retrospective.md`: Phase 6A retrospective report.
- `prompts/summary/Phase 6A - Implementation Summary.md`: Comprehensive Phase 6A summary report.

### Updated
- `backend/src/db.ts`: Registered `migration006`.
- `backend/src/routes/index.ts`: Mounted `taxRouter`.
- `backend/src/__tests__/runTests.ts`: Added Section 23 tax tests (**161 PASSED, 0 FAILED**).
- `frontend/src/hooks/queryKeys.ts`: Added tax query keys.
- `frontend/src/components/layout/NavigationDrawer.tsx`: Added Tax Intelligence drawer link.
- `frontend/src/App.tsx`: Added `/tax` view switching.

---

## [Phase 5E] - Authentication, Authorization & Platform Security Foundation (2026-07-27)

### Summary
Implemented the complete **Platform Security Foundation** (Authentication, RBAC, Multi-tenancy, Session Management, Audit Logging, and JWT Security).
