# 📦 DTO_STRATEGY.md — Data Transfer Object (DTO) Transformation Strategy

**System Name**: Family Wealth OS  
**Phase**: Sprint 6A (Application Service Layer - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Architectural Motivation & Isolation Boundary

Internal engine snapshot interfaces (`NetWorthSnapshot`, `PerformanceSnapshot`, `RiskSnapshot`) contain raw floating-point numbers, algorithm versions, and execution timing metadata optimized for computational determinism.

The **DTO Strategy** decouples these internal engine models from public API schemas through dedicated DTO Mappers (`PortfolioDTOMapper`, `DashboardDTOMapper`).

```
+--------------------------+         +-----------------------+         +--------------------------+
|  INTERNAL ENGINE MODELS  | ──►►──► |   DTO MAPPER LAYER    | ──►►──► |  PUBLIC API RESPONSE DTO |
| (Raw floating precision) |         | (Format & Currencies) |         | (User-friendly JSON DTO) |
+--------------------------+         +-----------------------+         +--------------------------+
```

---

## 2. Formatting & Localization Rules

1. **Monetary Values**: Formatted according to reporting currency locale (e.g. `INR` uses Indian numbering system `₹1,03,50,000.00`).
2. **Percentages**: Formatted to 2 decimal places with `%` suffix (e.g. `18.45%`).
3. **Dates**: Formatted as standard ISO `YYYY-MM-DD`.
