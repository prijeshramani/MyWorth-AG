# Platform Registry Specification

## Overview
The `PlatformRegistry` provides a discoverable unified inventory for FamilyWealthOS, linking `Skills`, `Actions`, `Features`, `Plugins`, and `Capabilities`.

---

## Dependency Graph Mapping
The platform exposes the dependency relationship graph:
```
Feature ──► Skill ──► Action ──► Engine
```

### Dependency Chain Example:
- **Feature**: `AI_ADVISOR` (AI Wealth Advisor Core)
  - **Skill**: `PORTFOLIO_ANALYSIS` (Portfolio Valuation)
    - **Action**: `REFRESH_PORTFOLIO` (Refresh Live Prices) $\rightarrow$ **Engine**: `AssetMasterEngine`
    - **Action**: `APPLY_REBALANCING_PLAN` (Apply Target Plan) $\rightarrow$ **Engine**: `RebalancingEngine`
  - **Skill**: `TAX_ASSISTANT` (Capital Gains Tax)
    - **Action**: `RECALCULATE_TAX` (Recalculate FIFO Lots) $\rightarrow$ **Engine**: `CapitalGainsCalculator`
    - **Action**: `GENERATE_ITR_JSON` (Generate Sahaj Payload) $\rightarrow$ **Engine**: `ITRSchemaBuilder`
