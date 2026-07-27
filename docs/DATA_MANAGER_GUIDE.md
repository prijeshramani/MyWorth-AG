# ⚙️ DATA_MANAGER_GUIDE.md — Data Manager & Review Console Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6UX  
**Date**: July 27, 2026  
**Status**: APPROVED OPERATIONAL GUIDE  

---

## 1. Operational Capabilities

The Data Manager console (`DataManager.tsx`) serves as the single operational portal for:
1. **Import History & Pending Reviews**: Review all import batches prior to committing data to production tables.
2. **Duplicate Record Resolution**: Automated detection based on ISIN, transaction date, quantity, and amount with user configurable strategy:
   - `MERGE`: Combines incoming metadata with existing holdings.
   - `SKIP`: Ignores duplicate incoming transaction lines.
   - `OVERWRITE`: Replaces existing holding record with fresh incoming values.
3. **Column Mapping Engine**: Save reusable custom CSV/Excel header mappings.
4. **Import Rollback**: Single-click rollback of approved import batches.
