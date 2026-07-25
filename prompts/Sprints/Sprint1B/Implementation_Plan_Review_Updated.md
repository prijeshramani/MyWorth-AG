# Implementation Plan --- Sprint 1B: Domain Foundation (Ownership Model)

## Review Status

**Approved for implementation after incorporating the mandatory
architectural updates below.**

## Mandatory Updates

1.  Replace the single migration runner with a **versioned migration
    framework** (`schema_migrations` table, numbered migration files,
    timestamped backups).
2.  Replace `ON DELETE CASCADE` with a **soft-delete strategy**
    (`is_deleted`, `deleted_at`, or equivalent) for financial ownership
    records.
3.  Complete CRUD by adding **PUT/PATCH** endpoints for Families, Family
    Members, Entities and Accounts.
4.  Add appropriate **UNIQUE constraints**, especially `pan_number`.
5.  Add **repository transaction support** (`beginTransaction`,
    `commit`, `rollback`) for atomic operations.

## Strong Recommendations

-   Extend Accounts with `institution_name`, `masked_account_number`,
    `nickname`, `is_active`.
-   Extend relationship enum: GRANDPARENT, GRANDCHILD, IN_LAW.
-   Extend entity types: PARTNERSHIP, LLP.
-   Introduce an OwnershipService responsible for validating Family →
    Member → Entity → Account hierarchy.
-   Add `created_by` and `updated_by` audit fields.
-   Prefer encrypted + masked account number storage in future.

## Additional Tests

-   Duplicate PAN rejection
-   Invalid relationship/entity/account type
-   Migration rollback
-   Transaction rollback
-   Update API behaviour
-   Duplicate account handling
-   Foreign key integrity
-   Non-destructive migration verification

## Deferred

Keep future design open for:

``` text
ownership_links
entity_id
asset_id
ownership_percentage
```

Do not implement in Sprint 1B.

## Final Approval

Go ahead with implementation **after incorporating the five mandatory
updates above**.
