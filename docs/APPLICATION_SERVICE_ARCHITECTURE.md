# 🏛 APPLICATION_SERVICE_ARCHITECTURE.md — Application Service Layer

**System Name**: Family Wealth OS  
**Phase**: Architecture v2 Review  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Role of the Application Service Layer

In **Architecture v2**, the **Application Service Layer** sits between external interface controllers (REST controllers, GraphQL resolvers, AI CFO agents) and the underlying pure financial engines & SQLite repositories.

```
+-----------------------------------------------------------------------------------+
|                        EXTERNAL INTERFACES (API / MOBILE / AI)                    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                       PORTFOLIO APPLICATION SERVICE                               |
|   1. Fetch entities from SQLite Repositories & Market Data Providers              |
|   2. Construct immutable EngineContext payloads                                   |
|   3. Invoke EngineRegistry pipelines in dependency order                           |
|   4. Persist output snapshots via SnapshotCoordinator                             |
|   5. Map engine outputs into API DTO response objects                             |
+-----------------------------------------------------------------------------------+
       │                                         │
       ▼                                         ▼
+-----------------------+               +-----------------------+
|  SQLITE REPOSITORIES  |               | PURE FINANCIAL ENGINES|
+-----------------------+               +-----------------------+
```

---

## 2. Service Component Specifications

### A. `PortfolioApplicationService`
- Orchestrates full multi-engine pipeline execution for family portfolio requests.
- Assembles holdings, master assets, transactions, market quotes, and FX rates into `EngineContext`.

### B. `DTO Strategy`
- Keeps internal engine snapshot models isolated from external API response schemas.
- Converts numerical precision fields to user-facing strings or formatted money objects (`₹10,35,000.00`).
