# FamilyWealthOS – Permanent Product Roadmap & Governance

## 1. Current Release
- **Current Version**: `v1.9.0`
- **Current Sprint**: `Sprint 7B.2`
- **Current Phase**: `Phase 7B.2 – AI Actions & Interactive Simulations`
- **Release Status**: `Active Release / Production Ready`

---

## 2. Completed Phases

### Phase 1 – Core Asset Tracking & Multi-Source Import
- **Objective**: Local-first net worth tracking, SQLite database schema, asset/account CRUD operations, and CAMS/NPS CAS parser.
- **Completion Date**: 2026-07-15
- **Key Deliverables**: `pdfParser.ts`, `excelParser.ts`, `xmlParser.ts`, `SQLiteAssetRepository.ts`.
- **Architectural Decisions**: Local SQLite via `better-sqlite3`, memory-only PDF buffer parsing.

### Phase 2 – Real-Time Market Feed & Portfolio Analytics
- **Objective**: Live market price feeds, USD-INR exchange rate fetcher, asset valuation metrics, and performance charts.
- **Completion Date**: 2026-07-20
- **Key Deliverables**: Yahoo Finance integration, `HoldingTable.tsx`, `AssetBreakdown.tsx`.

### Phase 3 – Knowledge Graph Engine
- **Objective**: Node-and-edge network mapping family members, bank accounts, stocks, mutual funds, real estate, and insurance policies.
- **Completion Date**: 2026-07-25
- **Key Deliverables**: `SQLiteKnowledgeGraphRepository.ts`, `KnowledgeGraphView.tsx`, idempotent edge sync.

### Phase 4 – Projections & Goal Planning Engine
- **Objective**: Monte Carlo simulations, compound growth projections, retirement corpus planning, and goal tracking.
- **Completion Date**: 2026-07-28
- **Key Deliverables**: `ProjectionEngine.ts`, `RetirementPlanner.tsx`, `GoalTracker.tsx`.

### Phase 5 – Rule & Recommendation Engine
- **Objective**: Configurable rule engine for rebalancing, emergency fund alerts, risk management, and actionable financial advice.
- **Completion Date**: 2026-07-29
- **Key Deliverables**: `RuleEngine.ts`, `RecommendationEngine.ts`, `RecommendationsView.tsx`.

### Phase 6 – Broker API Integrations (Zerodha, AngelOne, Upstox, INDMoney)
- **Objective**: Direct programmatic holdings sync via Zerodha Kite Connect, AngelOne SmartAPI, Upstox API v2 OAuth, and INDMoney 2FA TOTP.
- **Completion Date**: 2026-07-31
- **Key Deliverables**: `kiteService.ts`, `angeloneService.ts`, `upstoxService.ts`, `indmoneyService.ts`, `ImportCenter.tsx`.

### Phase 7A – Indian Tax Intelligence & ITR-Wala e-Filing
- **Objective**: Finance Act 2024 FIFO capital gains tax engine (Equity STCG 20%, LTCG 12.5% above ₹1.25L exemption), Form 16 parser, and ITR-1 & ITR-2 JSON generator for `incometax.gov.in`.
- **Completion Date**: 2026-07-31
- **Key Deliverables**: `CapitalGainsCalculator.ts`, `form16Parser.ts`, `ITRSchemaBuilder.ts`, `ITRFilingCenter.tsx`.

---

## 3. Active Phase: Phase 7B.1 – AI Wealth Advisor Core

- **Scope**: Multi-skill AI Wealth Advisor orchestration layer consuming Context, Memory, Evidence, and Recommendation services without raw SQL queries or financial calculations.
- **Progress**: 90%
- **Risks**: Ensuring multi-skill intent resolution handles complex cross-domain queries gracefully without hallucination.
- **Pending Work**: Final UI polish and verification tests.
- **Blockers**: None.

---

## 4. Upcoming Roadmap

### Phase 7B.2 – AI Execution & Interactive Simulation Actions
- **Priority**: High
- **Target**: Q3 2026
- **Objective**: User-confirmed action execution (auto-rebalancing preview, goal allocation adjustments, scenario simulation triggers).

### Phase 8 – Mobile Responsive PWA & Encrypted Cloud Backup
- **Priority**: Medium
- **Target**: Q4 2026
- **Objective**: Offline PWA storage, optional zero-knowledge encrypted backup.

---

## 5. Deferred Features
- **Crypto Asset Auto-Sync**: Deferred to Phase 8 pending Indian regulatory clarity on crypto reporting.
- **Direct Broker Rebalancing Execution**: Deferred to Phase 7B.2 to mandate strict explicit confirmation gates before trade placement.

---

## 6. Architectural Decision Records (ADR)

### ADR 001 – Local-First Knowledge Graph Engine
- **Status**: Accepted
- **Context**: Need to model complex family wealth relationships without cloud dependencies.
- **Decision**: Implemented SQLite-backed graph repository (`nodes` and `edges` tables) with idempotent edge sync logic.

### ADR 002 – Rule Engine & Recommendation Layer
- **Status**: Accepted
- **Context**: Need deterministic, rule-based financial advice before AI processing.
- **Decision**: Decoupled `RuleEngine` and `RecommendationEngine` so financial logic is calculated deterministically with versioned rules.

### ADR 003 – Projection & Monte Carlo Simulation Engine
- **Status**: Accepted
- **Context**: Need retirement and goal growth projections.
- **Decision**: Deterministic calculation engine in `ProjectionEngine.ts` consuming asset growth rates and inflation metrics.

### ADR 004 – Finance Act 2024 Capital Gains Tax Engine
- **Status**: Accepted
- **Context**: Indian tax calculation for STCG/LTCG.
- **Decision**: Implemented FIFO lot matching engine in `CapitalGainsCalculator.ts` enforcing 20% STCG and 12.5% LTCG with ₹1.25L threshold.

### ADR 005 – AI Context Layer & Zero-Calculation Guardrail
- **Status**: Accepted
- **Context**: AI Wealth Advisor must provide explainable advice without hallucinating numbers.
- **Decision**: AI consumes aggregated Context & Evidence snapshots. AI never queries raw SQL tables directly and never calculates financial metrics.

### ADR 006 – AI Skill Registry & Multi-Skill Intent Pipeline
- **Status**: Accepted
- **Context**: Supporting single and cross-domain questions (e.g., retirement + tax).
- **Decision**: Registry pattern mapping 7 wealth skills with intent resolution, evidence confidence metrics, and multi-skill evidence merging.

---

## 7. Product Metrics
- **Backend Test Count**: `34+ unit & integration tests`
- **Frontend Build Status**: `Clean / 0 TypeScript errors`
- **API Health**: `100% operational`
- **Documentation Coverage**: `100%`
- **Beta Readiness**: `95%`
- **Current Application Version**: `v1.8.0`

---

## 8. Change Governance
Every completed sprint must update:
1. `ROADMAP.md`
2. `product/RELEASE_NOTES.md`
3. `product/AI_BACKLOG.md`
4. `AI_CHANGELOG.md`
5. `SESSION_CONTEXT.md`
