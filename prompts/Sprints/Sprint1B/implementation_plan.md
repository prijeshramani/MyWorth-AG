# Implementation Plan — Sprint 1B: Domain Foundation (Ownership Model)

Establish the ownership hierarchy (`Family` -> `Family Members` -> `Entities` -> `Accounts`) for Family Wealth OS.

> [!IMPORTANT]
> **Sprint Scope Boundary**:
> - **NO Portfolio or Transaction Migration**: Portfolios and Assets remain unlinked to entities/accounts in this sprint.
> - **NO UI Modifications**: Frontend components are 100% untouched.
> - **NO Goal, Tax, or Advisor Engines**: Logic remains focused strictly on ownership entities.
> - **Reversible & Non-Destructive**: SQLite database migrations run safely inside transactions with automatic pre-migration backup snapshots.

---

## User Review Required

> [!NOTE]
> **Primary Key & Foreign Key Strategy**:
> `id INTEGER PRIMARY KEY AUTOINCREMENT` will be used for `families`, `family_members`, `entities`, and `accounts` to remain 100% consistent with existing MyWorth SQLite tables (`assets`, `transactions`, `sync_logs`).

---

## Proposed Changes

### Phase 1 — Database Schema & Migration Script

#### [NEW] [migrations.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db/migrations.ts)
Create a migration runner with reversible migration support and automated backup snapshotting (`myworth_backup_v1b.db` in `data/backups/`).

Create 4 new tables:
1. `families`
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `name TEXT NOT NULL`
   - `currency TEXT NOT NULL DEFAULT 'INR'`
   - `created_at TEXT DEFAULT CURRENT_TIMESTAMP`
   - `updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
2. `family_members`
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE`
   - `name TEXT NOT NULL`
   - `relationship TEXT NOT NULL CHECK(relationship IN ('SELF', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'))`
   - `date_of_birth TEXT`
   - `created_at TEXT DEFAULT CURRENT_TIMESTAMP`
   - `updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
3. `entities`
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `family_member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE`
   - `name TEXT NOT NULL`
   - `entity_type TEXT NOT NULL CHECK(entity_type IN ('INDIVIDUAL', 'HUF', 'MINOR', 'COMPANY', 'TRUST', 'OTHER'))`
   - `pan_number TEXT`
   - `created_at TEXT DEFAULT CURRENT_TIMESTAMP`
   - `updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
4. `accounts`
   - `id INTEGER PRIMARY KEY AUTOINCREMENT`
   - `entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE`
   - `account_name TEXT NOT NULL`
   - `account_type TEXT NOT NULL CHECK(account_type IN ('DEMAT', 'BANK', 'EPF', 'PPF', 'NPS', 'FD', 'MUTUAL_FUND_FOLIO', 'CREDIT_CARD', 'OTHER'))`
   - `provider TEXT`
   - `account_number TEXT`
   - `created_at TEXT DEFAULT CURRENT_TIMESTAMP`
   - `updated_at TEXT DEFAULT CURRENT_TIMESTAMP`

#### [MODIFY] [db.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/db.ts)
Integrate Phase 1 migration execution into `initDb()`.

---

### Phase 2 — Repository Layer

#### [NEW] [IFamilyRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/IFamilyRepository.ts) & [SQLiteFamilyRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteFamilyRepository.ts)
Interface and concrete SQLite implementation for `Family` CRUD operations.

#### [NEW] [IFamilyMemberRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/IFamilyMemberRepository.ts) & [SQLiteFamilyMemberRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteFamilyMemberRepository.ts)
Interface and concrete SQLite implementation for `FamilyMember` CRUD operations.

#### [NEW] [IEntityRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/IEntityRepository.ts) & [SQLiteEntityRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteEntityRepository.ts)
Interface and concrete SQLite implementation for `Entity` CRUD operations.

#### [NEW] [IAccountRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/IAccountRepository.ts) & [SQLiteAccountRepository.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/repositories/SQLiteAccountRepository.ts)
Interface and concrete SQLite implementation for `Account` CRUD operations.

---

### Phase 3 & 4 — Domain Services & Zod Validation Schemas

#### [NEW] [domainSchemas.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/schema/domainSchemas.ts)
Zod validation schemas for ownership DTOs:
- `CreateFamilySchema`, `UpdateFamilySchema`
- `CreateFamilyMemberSchema`, `UpdateFamilyMemberSchema`
- `CreateEntitySchema`, `UpdateEntitySchema`
- `CreateAccountSchema`, `UpdateAccountSchema`

#### [NEW] [FamilyService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/FamilyService.ts)
Domain service for managing families and hierarchy context.

#### [NEW] [EntityService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/EntityService.ts)
Domain service for validating family member ownership relationships.

#### [NEW] [AccountService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/AccountService.ts)
Domain service for managing financial accounts linked to entities.

---

### Phase 5 — REST API Endpoints (`/api/v1/*`)

#### [NEW] [families.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/v1/families.ts)
- `GET /api/v1/families`
- `GET /api/v1/families/:id`
- `POST /api/v1/families`
- `DELETE /api/v1/families/:id`

#### [NEW] [familyMembers.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/v1/familyMembers.ts)
- `GET /api/v1/family-members`
- `GET /api/v1/family-members/:id`
- `POST /api/v1/family-members`
- `DELETE /api/v1/family-members/:id`

#### [NEW] [entities.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/v1/entities.ts)
- `GET /api/v1/entities`
- `GET /api/v1/entities/:id`
- `POST /api/v1/entities`
- `DELETE /api/v1/entities/:id`

#### [NEW] [accounts.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/v1/accounts.ts)
- `GET /api/v1/accounts`
- `GET /api/v1/accounts/:id`
- `POST /api/v1/accounts`
- `DELETE /api/v1/accounts/:id`

#### [MODIFY] [index.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/index.ts)
Mount new `/api/v1/*` routers.

---

### Phase 6 — Documentation & Sprint Retrospective

#### [MODIFY] [.ai/SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/.ai/SESSION_CONTEXT.md)
Update session context with Sprint 1B deliverables.

#### [MODIFY] [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_CHANGELOG.md)
Append Sprint 1B technical audit log.

#### [NEW] [Sprint Retrospective.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Sprint_1B_Retrospective.md)
Sprint retrospective detailing accomplishments, challenges, and lessons learned.

#### [NEW] [Sprint 1B - Implementation Summary.md](file:///c:/Users/prije/Downloads/MyWorth/prompts/summary/Sprint%201B%20-%20Implementation%20Summary.md)
Summary document placed under `prompts/summary/` as requested.

---

## Verification Plan

### Automated Tests
1. **Unit & Integration Tests**: Update [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts) to verify:
   - Schema creation and table structures (`families`, `family_members`, `entities`, `accounts`).
   - Foreign key integrity (`PRAGMA foreign_key_check`).
   - Cascade deletions (deleting a family cascades to members, entities, and accounts).
   - Domain Service validations (rejecting orphan member/entity creation).
   - Zod schema validation errors.
   - Reversible database migration & backup verification.
   - Non-destruction of existing `assets`, `transactions`, and `asset_prices`.
2. **Compilation**:
   - `npm run build` in `backend` (`tsc`).
   - `npm run build` in `frontend` (`vite build`).

### Manual Verification
- Test REST endpoint responses for `/api/v1/families`, `/api/v1/family-members`, `/api/v1/entities`, `/api/v1/accounts`.
