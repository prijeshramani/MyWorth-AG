# AI Action Registry Specification

## Overview
The `AIActionRegistry` defines every executable capability within FamilyWealthOS. It cleanly separates AI explanations from platform execution, enforcing strict preconditions, permissions, risk levels (`LOW`, `MEDIUM`, `HIGH`), audit event types, and automated rollback strategies.

---

## Action Registry Definitions

| Action ID | Name | Owner Engine | Risk Level | Confirmation Required | Undo Supported | Audit Event |
|---|---|---|---|---|---|---|
| `REFRESH_PORTFOLIO` | Refresh Live Portfolio Prices | AssetMasterEngine | LOW | No | Yes | `EVENT_PORTFOLIO_PRICES_REFRESHED` |
| `RECALCULATE_TAX` | Recalculate Capital Gains Tax | CapitalGainsCalculator | LOW | No | No | `EVENT_TAX_RECALCULATED` |
| `REFRESH_GRAPH` | Sync Knowledge Graph Relationships | KnowledgeGraphRepository | LOW | No | Yes | `EVENT_GRAPH_SYNCED` |
| `GENERATE_ITR_JSON` | Generate Official ITR e-Filing JSON | ITRSchemaBuilder | MEDIUM | Yes | No | `EVENT_ITR_JSON_GENERATED` |
| `REFRESH_AI_CONTEXT` | Refresh AI Evidence Snapshots | AIContextAggregator | LOW | No | No | `EVENT_AI_CONTEXT_REFRESHED` |
| `RUN_RETIREMENT_SIMULATION` | Run Retirement Monte Carlo Simulation | ProjectionEngine | LOW | Yes | Yes | `EVENT_RETIREMENT_SIMULATION_EXECUTED` |
| `REFRESH_RECOMMENDATIONS` | Re-evaluate Rule Engine Rules | RecommendationEngine | LOW | No | No | `EVENT_RECOMMENDATIONS_REFRESHED` |
| `APPLY_REBALANCING_PLAN` | Apply Portfolio Rebalancing Target Plan | RebalancingEngine | HIGH | Yes | Yes | `EVENT_REBALANCING_PLAN_APPLIED` |
| `AUDIT_UNASSIGNED_ASSETS` | Link Unassigned Assets to Family Nodes | KnowledgeGraphRepository | MEDIUM | Yes | Yes | `EVENT_UNASSIGNED_ASSETS_AUDITED` |
