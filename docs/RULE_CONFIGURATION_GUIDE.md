# 🛠 RULE_CONFIGURATION_GUIDE.md — Annual Finance Act Rule Update Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6A  
**Date**: July 27, 2026  
**Status**: APPROVED CONFIGURATION GUIDE  

---

## 1. Annual Finance Act Update Workflow

To update tax rules for a new Financial Year (e.g. FY 2026-27):
1. **Zero Code Changes**: Do NOT alter TypeScript calculation logic.
2. **Add Rule Entry**: Insert a new `tax_rules` JSON record with `financial_year: '2026-27'` and updated `tax_slabs` entries.
3. **Execute Seed Loader**: Run `TaxRuleSeedLoader.seedTaxRules(db)` to apply versioned rules cleanly.
