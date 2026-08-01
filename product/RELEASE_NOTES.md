# Product Management – Release Notes

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
