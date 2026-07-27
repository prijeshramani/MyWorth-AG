# 🔄 POLICY_LIFECYCLE.md — Policy Lifecycle State Machine

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED STATE MACHINE  

---

## 1. State Machine State Transitions

```
                    ┌───────────┐
                    │   DRAFT   │
                    └─────┬─────┘
                          │ Issue Policy
                          ▼
┌───────────┐  Renewal   ┌───────────┐  Overdue   ┌──────────────┐
│  MATURED  │ ◄───────── │  ACTIVE   │ ─────────> │ GRACE_PERIOD │
└───────────┘            └─────┬─────┘            └──────┬───────┘
                               │ Claim                   │ Expired Grace
                               ▼                         ▼
                         ┌───────────┐            ┌──────────────┐
                         │  CLAIMED  │            │    LAPSED    │
                         └───────────┘            └──────────────┘
```

---

## 2. State Descriptions

1. **`DRAFT`**: Policy entry created in system prior to verification or bond upload.
2. **`ACTIVE`**: Policy currently in force with up-to-date premium payments.
3. **`GRACE_PERIOD`**: Premium payment past due (typically 30-day grace window active).
4. **`LAPSED`**: Grace period expired without premium payment; cover suspended.
5. **`MATURED`**: Endowment/ULIP policy reached full tenure term; maturity payout due.
6. **`CLAIMED`**: Insurance claim submitted and settled with insurer.
7. **`SURRENDERED`**: Policy voluntarily surrendered before maturity.
