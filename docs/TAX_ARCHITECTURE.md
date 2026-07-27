# 🏛 TAX_ARCHITECTURE.md — Indian Tax Intelligence Engine Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 6A (Indian Tax Intelligence Engine)  
**Date**: July 27, 2026  
**Status**: APPROVED DOMAIN ARCHITECTURE  

---

## 1. Executive Architecture Overview

The **Indian Tax Intelligence Engine** delivers enterprise-grade, India-only tax planning, capital gains computation, regime optimization, and compliance calendar tracking for FamilyWealthOS.

> [!IMPORTANT]
> **Financial Planning & Optimization Platform**:
> This engine is engineered for proactive tax optimization and multi-family tax efficiency analysis. It is **NOT** an ITR filing software.

```
+-----------------------------------------------------------------------------------+
|                            FAMILY WEALTH OS CORE APP                              |
+-----------------------------------------------------------------------------------+
           │                                                       │
           ▼                                                       ▼
+-------------------------------+       +-------------------------------------------+
|   INVESTMENT & HOLDINGS DOMAIN|       |     INDIAN TAX INTELLIGENCE DOMAIN        |
| • Assets, Transactions, XIRR  | ────> | • Tax Profiles & Slabs (Old vs New)       |
| • Realized Capital Gains FIFO |       | • Configurable Deduction Tracker (80C/80D)|
+-------------------------------+       | • Rule Engine (No Hardcoded Tax Rates)    |
                                        | • Advance Tax & Compliance Calendar       |
                                        +-------------------------------------------+
```
