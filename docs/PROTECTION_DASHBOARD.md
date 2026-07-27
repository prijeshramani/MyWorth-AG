# 🖥 PROTECTION_DASHBOARD.md — Protection Dashboard View & UX Layout

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED DASHBOARD SPECIFICATION  

---

## 1. Executive Protection Dashboard Layout Wireframe

```
+-----------------------------------------------------------------------------------+
| TOP NAVBAR: Family Selector | Currency Toggle (INR) | Health Badge (UP)            |
+-----------------------------------------------------------------------------------+
| LEFT DRAWER  | HEADER: Protection & Insurance Overview                            |
| • Dashboard  | Subtitle: Family Risk Cover & Policy Governance Dashboard          |
| • Portfolio  |                                                                    |
| • Protection | +--------------------+ +--------------------+ +--------------------+ |
|   (ACTIVE)   | | Protection Score   | | Total Life Cover   | | Total Health Cover | |
| • Analytics  | | 85.5 / 100 [OPTIMAL| | ₹2,50,00,000.00    | | ₹35,00,000.00      | |
| • Reports    | +--------------------+ +--------------------+ +--------------------+ |
|              |                                                                    |
|              | +----------------------------------+ +---------------------------+ |
|              | | Coverage Distribution Chart     | | Premium Calendar Timeline | |
|              | | (Life, Health, Accident, LIC)   | | (Upcoming 12 months)    | |
|              | +----------------------------------+ +---------------------------+ |
|              |                                                                    |
|              | +----------------------------------------------------------------+ |
|              | | Active Policy Holdings Table                                   | |
|              | | (Insurer, Holder, Type, Sum Assured, Premium, Next Due, Status)| |
|              | +----------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 2. Main Executive Dashboard Integration

Protection summary metrics seamlessly display on the master platform dashboard via 2 dedicated widgets:
1. **`ProtectionScoreWidget`**: Displays overall Protection Score index & rating badge.
2. **`UpcomingPremiumsWidget`**: Displays urgent premium payments due within 30 days.
