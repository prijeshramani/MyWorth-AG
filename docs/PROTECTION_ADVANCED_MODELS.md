# 📑 PROTECTION_ADVANCED_MODELS.md — Advanced Family Protection Models & Heat Map

**System Name**: Family Wealth OS  
**Phase**: Phase 5D (Protection & Insurance Implementation)  
**Date**: July 27, 2026  
**Status**: APPROVED ARCHITECTURE ENHANCEMENT  

---

## 1. Family Protection Responsibility Model

Maps coverage responsibility based on family member role:
- **Primary Earner**: Term Life (10x income), Critical Illness, Personal Accident, Health.
- **Spouse**: Term Life, Health, Critical Illness.
- **Children**: Health (Family Floater inclusion), Child Education Endowment / LIC Security Plan.
- **Parents**: Senior Citizen Health Cover, Annuity/Pension Plan.

---

## 2. Policy Relationship Graph

```
Family Entity (id: 1)
   ├── Member 1 (Primary Earner)
   │     ├── Policy POL-001 (Term Life — Max Life)
   │     ├── Policy POL-002 (Family Floater Health — Star Health)
   │     └── Policy POL-003 (LIC Endowment — LIC Jeevan Anand)
   └── Member 2 (Spouse)
         └── Policy POL-004 (Critical Illness — HDFC ERGO)
```

---

## 3. Document Vault Abstraction

Policy entities reference `documentId` pointers to a centralized Document Vault:
- **Current Pointers**: Policy bonds, health cards, premium receipts.
- **Future Abstraction**: Property deeds, tax returns, identity certificates, estate wills.

---

## 4. Beneficiary & Policy Health Score Matrix

### Policy Health Score Factors (0 – 100 pts)
1. **Premium Compliance** (30 pts): Up-to-date premium status (`ACTIVE`).
2. **Nominee Completeness** (25 pts): Valid designated nominee assigned.
3. **Document Availability** (20 pts): Digital policy bond PDF uploaded to Document Vault.
4. **Policy Status** (15 pts): No grace period expiration warnings.
5. **KYC Completeness** (10 pts): Verified PAN & Aadhaar link.

---

## 5. Family Protection Heat Map Matrix

| Family Member | Role | Life Cover | Health Cover | Critical Illness | Personal Accident | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rajesh Sharma** | Primary | `₹1,50,00,000` | `₹25,00,000` | `₹15,00,000` | `₹50,00,000` | `OPTIMAL` |
| **Priya Sharma** | Spouse | `₹50,00,000` | `₹25,00,000` (Floater)| `₹10,00,000` | `GAP` | `MODERATE` |
| **Aarav Sharma** | Child | `N/A` | `₹25,00,000` (Floater)| `N/A` | `N/A` | `COVERED` |
