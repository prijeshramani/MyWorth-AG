# Product Management – Release Notes

## Version 1.9.0 – Phase 7B.2 AI Actions & Interactive Simulations (2026-08-01)
- **AI Action Registry**: Operational registry defining 9 executable capabilities (`REFRESH_PORTFOLIO`, `RECALCULATE_TAX`, `REFRESH_GRAPH`, `GENERATE_ITR_JSON`, `RUN_RETIREMENT_SIMULATION`, `APPLY_REBALANCING_PLAN`, etc.) with strict preconditions, permissions, risk levels, and 1-click undo.
- **What-If Simulation Engine**: Interactive zero-mutation scenario studio evaluating Base, Optimistic (+2%), Conservative (-2%), and Custom scenarios with 6 pre-packaged templates.
- **AI Action Center**: Glassmorphism UI managing action categories (*Pending, Recommended, Completed, Scheduled, Dismissed*) with Impact Analysis modals and audit trail tracking.
- **Platform Governance Framework**: Established complete `governance/` repository (`DECISIONS.md`, `SECURITY.md`, `PRIVACY.md`, `DATA_RETENTION.md`, `VERSIONING.md`, `API_GUIDELINES.md`, `CODING_STANDARDS.md`, `OBSERVABILITY.md`, `DEPLOYMENT_GUIDE.md`, `DISASTER_RECOVERY.md`, `PERFORMANCE_GUIDELINES.md`, `ADR_007`, `ADR_008`, `CAPABILITIES.md`).

## Version 1.8.0 – Phase 7B.1 AI Wealth Advisor Core (2026-07-31)
- **AI Skill Registry**: Launched 7 specialized wealth skills (*Portfolio Analysis, Tax Assistant, Estate Advisor, Retirement Coach, Goal Planner, Recommendation Explainer, Insurance Advisor*).
- **Multi-Skill Orchestration**: Added support for cross-domain queries (e.g. Retirement + Tax) with merged evidence cards.
- **Evidence Confidence Model**: Every advice response displays evidence confidence score, freshness, source engine, and rule version.
- **Permanent Product Governance**: Established `ROADMAP.md` and `product/` governance repository.
- **EPF Parser Upgrade**: Multi-column TCS EPF statement ingestion supporting opening balance, monthly contributions, interest, and net closing balance.

## Version 1.7.0 – Phase 7A Indian Tax Intelligence & ITR-Wala e-Filing (2026-07-31)
- **Finance Act 2024 Tax Engine**: FIFO STCG (20%) and LTCG (12.5% above ₹1.25L exemption threshold) capital gains calculator.
- **ITR e-Filing Center**: Form 16 parser and official Income Tax Department compliant ITR-1 (Sahaj) & ITR-2 JSON generator.
- **Family Member Selection**: Filter capital gains and generate ITR JSON per family member.
