# 📄 POLICY_DATA_MODEL.md — Insurance Policy Data Model & Schema

**System Name**: Family Wealth OS  
**Phase**: Phase 5C  
**Date**: July 27, 2026  
**Status**: APPROVED DATA MODEL  

---

## 1. Supported Policy Types Taxonomy

### Active Supported Policy Types (10 Categories)
1. **`TERM_INSURANCE`**: Pure life cover term policy.
2. **`HEALTH_INSURANCE`**: Individual medical health insurance cover.
3. **`FAMILY_FLOATER`**: Comprehensive family floater medical health cover.
4. **`LIC_ENDOWMENT`**: LIC traditional endowment policy (Sum Assured + Vested Bonus).
5. **`LIC_MONEY_BACK`**: LIC money back policy with periodic survival benefits.
6. **`LIC_PENSION`**: Annuity and retirement pension plan.
7. **`LIC_CHILD`**: Child education and marriage security policy.
8. **`ULIP`**: Unit Linked Insurance Plan (Protection + Market-Linked Component).
9. **`PERSONAL_ACCIDENT`**: Accidental death and disability cover.
10. **`CRITICAL_ILLNESS`**: Specific critical disease benefit payout cover.

### Future Expansion Categories (3 Categories)
- `VEHICLE_INSURANCE` (Motor comprehensive/third-party)
- `HOME_INSURANCE` (Property & structure protection)
- `TRAVEL_INSURANCE` (International medical & luggage protection)

---

## 2. Policy Master Schema Attributes

| Attribute Name | Data Type | Required | Description / Example |
| :--- | :--- | :--- | :--- |
| `policyId` | `string` | Yes | Unique policy ID (`pol_lic_9901`) |
| `familyId` | `number` | Yes | Foreign key to Family entity |
| `policyNumber` | `string` | Yes | Official insurer policy number (`098765432`) |
| `insurerName` | `string` | Yes | Insurer name (`LIC of India`, `HDFC ERGO`, `Max Life`) |
| `policyType` | `enum` | Yes | One of the 10 policy type taxonomy values |
| `policyHolderId` | `number` | Yes | Foreign key to Family Member entity |
| `sumAssured` | `number` | Yes | Total death/health coverage amount (`₹1,00,00,000`) |
| `premiumAmount` | `number` | Yes | Recurring premium payment amount (`₹25,000`) |
| `premiumFrequency` | `enum` | Yes | `ANNUAL`, `SEMI_ANNUAL`, `QUARTERLY`, `MONTHLY`, `SINGLE` |
| `startDate` | `string` | Yes | Policy issuance date (`YYYY-MM-DD`) |
| `maturityDate` | `string` | Optional | Policy maturity date (`YYYY-MM-DD`) |
| `nextPremiumDueDate`| `string` | Yes | Next due date for premium payment (`YYYY-MM-DD`) |
| `status` | `enum` | Yes | `ACTIVE`, `GRACE_PERIOD`, `LAPSED`, `MATURED`, `CLAIMED` |
| `nomineeDetails` | `object` | Optional | Nominee name, relationship, and allocation % |
| `documents` | `array` | Optional | Array of stored policy PDF bond document URIs |
| `notes` | `string` | Optional | Custom notes or advisor instructions |
