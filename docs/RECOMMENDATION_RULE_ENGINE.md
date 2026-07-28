# ⚙️ RECOMMENDATION_RULE_ENGINE.md — Recommendation Rule Engine Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6D  
**Date**: July 28, 2026  
**Status**: APPROVED RULE ENGINE GUIDE  

---

## 1. Configurable Rule Schema

The `recommendation_rules` table stores configurable definitions:
- `rule_code`: Unique identifier (e.g. `TAX_80C_OPTIMIZATION`, `PROTECTION_TERM_UNDERINSURED`).
- `category`: Domain category (`INVESTMENT`, `TAX`, `ESTATE`, `PROTECTION`, `PLANNING`).
- `title_template` & `description_template`: Configurable strings supporting placeholders `{taxSaving}`, `{currentCover}`, `{estateValue}`.
- `priority_default`: Baseline priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- `journey_id`: Link to Recommendation Journey.
- `prerequisite_rule_code`: Dependency rule for conflict resolution.
