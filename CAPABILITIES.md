# FamilyWealthOS – Platform Capabilities Registry

## Overview
This document registers all operational backend calculation engines, API services, skill modules, and executable actions across FamilyWealthOS (`v1.9.0`).

---

## 1. Engine Capabilities
- **Asset Master & Net Worth Aggregator**: Real-time multi-asset valuation across stocks, mutual funds, EPF, bank accounts, and real estate.
- **Knowledge Graph Engine**: Family network mapping nodes and edges with idempotent relationship sync.
- **Monte Carlo Projection Engine**: Compound growth projections and retirement corpus simulation.
- **Finance Act 2024 Capital Gains Engine**: FIFO tax lot matching (STCG 20%, LTCG 12.5% above ₹1.25L exemption).
- **Rule & Recommendation Engine**: Configurable rule evaluation for rebalancing, emergency fund alerts, and tax harvesting.
- **Ephemeral What-If Simulation Engine**: Zero-mutation scenario comparisons (Base, Optimistic, Conservative, Custom).

---

## 2. AI Wealth Skills (7 Skills)
- `portfolio_analysis` (Portfolio Analysis)
- `tax_assistant` (Tax Assistant)
- `estate_advisor` (Estate & Succession Advisor)
- `retirement_coach` (Retirement Coach)
- `goal_planner` (Goal Planner)
- `recommendation_explainer` (Recommendation Explainer)
- `insurance_advisor` (Insurance Audit Advisor)

---

## 3. Executable AI Actions (9 Actions)
- `REFRESH_PORTFOLIO` (Refresh Live Market Prices)
- `RECALCULATE_TAX` (Recalculate Capital Gains & Tax Loss Harvesting)
- `REFRESH_GRAPH` (Sync Knowledge Graph Nodes & Edges)
- `GENERATE_ITR_JSON` (Generate Income Tax Department ITR-1 / ITR-2 JSON)
- `REFRESH_AI_CONTEXT` (Re-aggregate AI Context & Evidence Snapshots)
- `RUN_RETIREMENT_SIMULATION` (Trigger 1,000-Iteration Monte Carlo Simulation)
- `REFRESH_RECOMMENDATIONS` (Re-evaluate Rule Engine Rules)
- `APPLY_REBALANCING_PLAN` (Generate Target Asset Allocation Rebalancing Orders)
- `AUDIT_UNASSIGNED_ASSETS` (Link Unassigned Assets to Family Member Nodes)
