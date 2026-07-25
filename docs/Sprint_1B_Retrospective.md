# Sprint 1B Retrospective — Domain Foundation

**Sprint Name**: Sprint 1B – Domain Foundation (Ownership Model)  
**Date**: July 25, 2026  
**Status**: Complete  

---

## 1. Accomplishments

1. **Versioned Migration Framework**: Established `schema_migrations` tracking table, timestamped database file backups (`data/backups/myworth_backup_<timestamp>.db`), and numbered migration file `001_domain_foundation.ts`.
2. **Soft-Delete Strategy**: Replaced hard `ON DELETE CASCADE` deletes with soft-deletes (`deleted_at TIMESTAMP`) across all financial ownership records (`families`, `family_members`, `entities`, `accounts`).
3. **Domain Ownership Hierarchy**: Implemented clean 4-tier model (`Family -> Family Members -> Entities -> Accounts`) with extended relationship enums (`GRANDPARENT`, `GRANDCHILD`, `IN_LAW`), extended entity types (`PARTNERSHIP`, `LLP`), and auto-masked account numbers (`••••5678`).
4. **Data Integrity & PAN Validation**: Added Zod schemas with PAN regex validation and partial UNIQUE index on `entities(pan_number)` WHERE `deleted_at IS NULL`.
5. **OwnershipService & Transaction Helpers**: Introduced `OwnershipService` to resolve full 4-tier ownership chains and `runInTransaction` for atomic database operations and rollbacks.
6. **Full REST CRUD APIs**: Exposed `/api/v1/families`, `/api/v1/family-members`, `/api/v1/entities`, `/api/v1/accounts` (GET, POST, PUT, DELETE, GET `/ownership-chain`).
7. **Comprehensive Test Suite**: Expanded test coverage to 26 passing automated tests.

---

## 2. What Went Well

- **Zero Regression on Existing Features**: Pre-existing `assets`, `transactions`, `asset_prices`, and `sync_logs` tables remain 100% operational and untouched.
- **Architectural Review Compliance**: Successfully incorporated all 5 mandatory architectural review updates (versioned migrations, soft-deletes, full PUT/PATCH CRUD, partial UNIQUE indexes, transaction support) while preserving existing project patterns.
- **Strict Scope Boundaries**: Kept sprint strictly focused on ownership model without leaking into portfolios, assets, or UI changes.

---

## 3. Lessons Learned & Recommendations for Sprint 1C

- **Lesson**: Soft-delete strategy requires explicit `deleted_at IS NULL` filters in both SQLite queries and Zod/Service validation checks to ensure deleted records don't trigger unique constraint conflicts.
- **Recommendation for Sprint 1C**: Proceed to **Sprint 1C - Portfolio & Asset Linkage** to non-destructively associate existing `assets` and `transactions` with portfolios and accounts.
