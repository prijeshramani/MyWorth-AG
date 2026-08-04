# FamilyWealthOS – Engineering Charter

## Core Directives
1. **Deterministic Calculations Only**: Financial numbers must come strictly from backend engines (`CapitalGainsCalculator`, `ProjectionEngine`, `RuleEngine`). AI models explain and orchestrate, but never perform math.
2. **Local-First & Offline Resilience**: All data remains in local SQLite. External API integrations fail gracefully to local cached state.
3. **Auditable Action Execution**: Executable actions require precondition checks, permission verification, audit trail logging (`ai_audit_trail`), and 1-click rollback where supported.
4. **Zero Flaky Tests & Regression Protection**: Continuous test runner suite maintains green status across 235+ tests.
5. **Strict TypeScript & Schema Discipline**: Zero implicit `any` in core domains; strict parameter interfaces across all endpoints.
