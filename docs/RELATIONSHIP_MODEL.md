# 🕸 RELATIONSHIP_MODEL.md — Graph Node & Relationship Edge Specification

**System Name**: Family Wealth OS  
**Phase**: Phase 6B.0  
**Date**: July 27, 2026  
**Status**: APPROVED RELATIONSHIP MODEL  

---

## 1. Supported Entity Types (Nodes)

| Entity Type | Description | Native Primary Key Table |
| :--- | :--- | :--- |
| **`PERSON`** | Family Member or Beneficiary | `family_members` |
| **`ASSET`** | Mutual Fund, Stock, Fixed Deposit, Real Estate | `holdings` / `assets_master` |
| **`POLICY`** | Life, Health, or General Insurance Policy | `insurance_policies` |
| **`ACCOUNT`**| Savings Bank or Demat Trading Account | `accounts` |
| **`DOCUMENT`**| Uploaded Document | `DocumentVault` |
| **`TAX_PROFILE`**| Family Member Tax Profile | `tax_profiles` |

---

## 2. Seeded Relationship Edge Matrix

| Code | Name | Category | Inverse Code | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`OWNS`** | Owns Asset | `OWNERSHIP` | `OWNED_BY` | Primary asset ownership link |
| **`JOINT_OWNER`** | Joint Owner | `OWNERSHIP` | `JOINT_OWNER_OF` | Secondary joint holding link |
| **`NOMINEE`** | Assigned Nominee | `ESTATE` | `NOMINATED_BY` | Designated nominee for asset or policy |
| **`BENEFICIARY`**| Trust Beneficiary | `ESTATE` | `BENEFICIARY_OF` | Beneficiary of asset or trust |
| **`INSURED`** | Insured Life | `INSURANCE` | `INSURED_BY` | Life covered under policy |
| **`POLICY_HOLDER`**| Policy Holder | `INSURANCE` | `HOLDS_POLICY` | Owner/proposer of policy |
| **`PARENT_OF`** | Parent of | `FAMILY` | `CHILD_OF` | Parent-child family relation |
| **`SPOUSE_OF`** | Spouse of | `FAMILY` | `SPOUSE_OF` | Marital relation |
