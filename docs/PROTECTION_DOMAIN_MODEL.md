# 📐 PROTECTION_DOMAIN_MODEL.md — Protection Domain Model

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED DOMAIN MODEL  

---

## 1. Domain Entity Relationship Diagram

```
+----------------+          1 : N          +-----------------------+
|  Family Entity | ──────────────────────> |  Family Member Entity |
+----------------+                         +-----------------------+
        │                                              │
        │ 1 : N                                        │ 1 : N
        ▼                                              ▼
+------------------------------------------------------------------+
|                          InsurancePolicy                         |
|  • policyId, policyNumber, insurerName, policyType               |
|  • sumAssured, premiumAmount, premiumFrequency                   |
|  • startDate, maturityDate, nextPremiumDueDate, status           |
+------------------------------------------------------------------+
        │                                              │
        │ 1 : N                                        │ 1 : 1
        ▼                                              ▼
+----------------+                         +-----------------------+
| PolicyDocument |                         | PolicyNomineeDetail   |
+----------------+                         +-----------------------+
```

---

## 2. Entity Specifications

1. **`InsurancePolicy`**: Core entity representing a policy (Term, Health, LIC, etc.).
2. **`PolicyHolder`**: Primary insured Family Member.
3. **`PolicyNomineeDetail`**: Designated nominee details (Nominee Name, Relationship, Allocation % - e.g., 100%).
4. **`PolicyDocument`**: Digital policy document attachments (PDF policy bonds, health card copies).
