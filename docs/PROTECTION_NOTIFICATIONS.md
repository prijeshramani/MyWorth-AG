# 🔔 PROTECTION_NOTIFICATIONS.md — Protection Domain Notification Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED NOTIFICATION SPECIFICATION  

---

## 1. Notification Event Rules

Protection & Insurance alerts extend the platform **Global Notification Center (`GLOBAL_NOTIFICATION_CENTER.md`)** without introducing secondary notification handlers:

| Alert Event Code | Trigger Condition | Severity Level | Toast Badge Color | Channel |
| :--- | :--- | :--- | :--- | :--- |
| **`PREMIUM_DUE_30D`** | Premium due in 30 days | `INFO` | Sky Blue (`#0284c7`) | Toast + History |
| **`PREMIUM_DUE_7D`** | Premium due in 7 days | `WARNING` | Amber (`#f59e0b`) | Toast + History |
| **`PREMIUM_OVERDUE`** | Premium past due date (Grace Period) | `ERROR` | Rose (`#f43f5e`) | Toast + History |
| **`POLICY_EXPIRING`** | Health policy renewal due | `WARNING` | Amber (`#f59e0b`) | Toast + History |
| **`POLICY_MATURED`** | Policy maturity date reached | `SUCCESS` | Emerald (`#10b981`) | Toast + History |
| **`MISSING_NOMINEE`** | Active policy has no nominee assigned | `WARNING` | Amber (`#f59e0b`) | History |
