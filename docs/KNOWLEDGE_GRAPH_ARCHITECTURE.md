# 🏛 KNOWLEDGE_GRAPH_ARCHITECTURE.md — Knowledge Graph Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 6B.0 (Knowledge Graph Foundation & Relationship Engine)  
**Date**: July 27, 2026  
**Status**: APPROVED KNOWLEDGE GRAPH ARCHITECTURE  

---

## 1. Executive Architecture Overview

The **Knowledge Graph Foundation** serves as the canonical relationship metadata layer for FamilyWealthOS. It links Family Members, Entities, Asset Holdings, Insurance Policies, Bank/Demat Accounts, Documents, and Tax Profiles using an immutable node-and-edge model before Estate Planning.

```
+-----------------------------------------------------------------------------------+
|                        FAMILY WEALTH OS KNOWLEDGE GRAPH                           |
+-----------------------------------------------------------------------------------+
                                          │
    ┌───────────────────┬─────────────────┼──────────────────┬──────────────────┐
    ▼                   ▼                 ▼                  ▼                  ▼
[ PERSON Node ]    [ ASSET Node ]   [ POLICY Node ]   [ ACCOUNT Node ]   [ DOCUMENT Node ]
  • Family Member   • Mutual Fund    • Term Insurance  • Savings Bank     • Sale Deed
  • Primary Holder  • Equity Stock   • Health Plan     • Demat Account    • PAN Card
    │                   │                 │                  │                  │
    └───────────────────┴─────────────────┼──────────────────┴──────────────────┘
                                          ▼
                                   ( Directed Edges )
                    OWNS • NOMINEE • BENEFICIARY • POLICY_HOLDER • INSURED
```

---

## 2. Key Architecture Rules

1. **Canonical IDs**: Every graph node uses the native entity's immutable identifier (`entity_type` + `entity_id`). Data is never duplicated inside graph tables.
2. **Zero Calculation Engine Modifications**: Investment, Portfolio, Protection, and Tax calculation engines remain 100% untouched.
3. **Strict Multi-Tenancy**: All graph queries and mutations enforce `family_id` filtering.
4. **Idempotent Relationship Seed Loader**: Baseline relationship types (`OWNS`, `NOMINEE`, `BENEFICIARY`, etc.) are seeded idempotently with inverse relationship support.
