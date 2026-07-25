# Sprint 1C Retrospective — Asset Master & Holdings Foundation

**Sprint Name**: Sprint 1C – Asset Master & Holdings Foundation  
**Date**: July 25, 2026  
**Status**: Complete  

---

## 1. Accomplishments

1. **Canonical System & Data Documentation**: Created `docs/DATA_MODEL.md`, `docs/SYSTEM_ARCHITECTURE.md`, and `docs/ER_DIAGRAM.md` documenting table relationships, cardinalities, JSON metadata schemas, 4-layer architecture, and data flows.
2. **Asset Master Model**: Implemented `assets_master` table (supporting 14 asset types: `STOCK`, `MUTUAL_FUND`, `ETF`, `BOND`, `FD`, `PPF`, `EPF`, `NPS`, `SSA`, `BANK`, `GOLD`, `REAL_ESTATE`, `CRYPTO`, `OTHER`) and `IAssetMasterRepository` / `SQLiteAssetMasterRepository.ts`.
3. **3-Tier Asset Master Deduplication**: Created `AssetMasterService` executing 3-tier lookup order:
   - Priority 1: `ISIN`
   - Priority 2: `Symbol` + `Asset Type`
   - Priority 3: `Name` + `Asset Type`
4. **Holding Ownership Link Model**: Implemented `holdings` table (`account_id`, `asset_id`, `opened_at`, `closed_at`, `status`) and `IHoldingRepository` / `SQLiteHoldingRepository.ts` establishing ownership links without a Portfolio abstraction.
5. **Soft-Delete & Data Integrity**: Added `deleted_at TIMESTAMP` columns and partial unique indexes `idx_assets_master_isin_unique` and `idx_holdings_account_asset_unique`.
6. **Full REST CRUD APIs**: Exposed `/api/v1/assets-master` and `/api/v1/holdings` (`GET`, `POST`, `PUT`, `DELETE`).
7. **Automated Test Suite Expansion**: Expanded automated tests from 26 to 34 passing tests.

---

## 2. What Went Well

- **100% Backward Compatibility**: Legacy `assets`, `transactions`, `asset_prices`, and Sprint 1B ownership tables continue functioning without breaking existing dashboards or parsing logic.
- **Transactions Preserved as Source of Truth**: `holdings` strictly serves as an ownership link rather than persisting authoritative quantity or valuation state.
- **Deduplication Efficiency**: Master assets are shared across multiple accounts without duplication.

---

## 3. Lessons Learned & Recommendations for Sprint 1D / Phase 2

- **Lesson**: Standardizing asset metadata using flexible JSON fields allows deep attributes (e.g. FD interest rates, UAN numbers, AMC details) without requiring schema alterations for every new asset type.
- **Recommendation for Sprint 1D / Phase 2**: Proceed to **Sprint 1D / Portfolio & Asset Linkage** to non-destructively associate existing transactions and holdings to their corresponding accounts.
