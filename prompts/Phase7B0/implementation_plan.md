# Phase 7B.0 Implementation Plan — Developer Experience (DX), Local Onboarding & Beta Readiness

**Goal**: Prepare FamilyWealthOS for real-world usage with personal Indian financial data while maintaining safe database lifecycle management, first-run onboarding, Beta Safe Mode automatic backups, system health monitoring, and developer tooling.

---

## Proposed Changes

### 1. Database Lifecycle & CLI Tooling
#### [NEW] [dbLifecycle.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/scripts/dbLifecycle.ts)
CLI script providing database management:
- `reset`: Timestamped automatic backup -> drop SQLite file -> run migrations 001–011 -> seed baseline reference rules & relationship types.
- `rebuild`: Reset + seed demo portfolios.
- `backup`: Create compressed, timestamped SQLite backup in `data/backups/`.
- `restore`: Validate backup file integrity -> restore SQLite database.
- `seed-demo`: Seed demo family & transactions.
- `seed-empty`: Clean baseline without demo portfolios.

#### [MODIFY] [package.json](file:///c:/Users/prije/Downloads/MyWorth/backend/package.json)
Add npm scripts: `db:reset`, `db:rebuild`, `db:backup`, `db:restore`, `db:seed-demo`, `db:seed-empty`.

---

### 2. System Health & Beta Safe Mode Backend Services
#### [NEW] [SystemHealthService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/SystemHealthService.ts)
- Inspects component health across Database, Migration Version (11), AI Context, Knowledge Graph, Recommendation Engine, Tax Engine, Estate Engine, Projection Engine, Import Engine, and Storage Usage.
- Calculates overall System Health Score ($S_{\text{Health}}$).

#### [NEW] [BackupService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/BackupService.ts)
- Manages Beta Safe Mode automatic backups before destructive operations.
- Validates backup integrity and handles one-click restore.

#### [NEW] [OnboardingService.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/services/OnboardingService.ts) & [DXController.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/controllers/DXController.ts) & [dxRoutes.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/routes/dxRoutes.ts)
- REST endpoints mounted at `/api/v1/dx`:
  - `GET /api/v1/dx/health`
  - `GET /api/v1/dx/onboarding/status`
  - `POST /api/v1/dx/onboarding/complete`
  - `POST /api/v1/dx/backup`
  - `POST /api/v1/dx/restore`
  - `POST /api/v1/dx/reset`
  - `POST /api/v1/dx/feedback`

---

### 3. Frontend First-Run Onboarding & Developer Console
#### [NEW] [OnboardingWizard.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/onboarding/OnboardingWizard.tsx)
- Guided multi-step onboarding modal collecting User details, Family name, Currency (INR default), Financial Year, and baseline settings.

#### [NEW] [DeveloperConsole.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/developer/DeveloperConsole.tsx)
- Full Developer Console under Platform Settings / Developer Mode:
  - System Health Dashboard Cards
  - Beta Safe Mode Controls (Backup, Restore Last Backup, Reset Database)
  - Engine Re-calculation Triggers (Refresh AI Context, Rebuild Knowledge Graph, Recalculate Tax/Estate/Recommendations)

#### [NEW] [FeedbackWidget.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/common/FeedbackWidget.tsx)
- Floating Beta Feedback widget capturing screen context, category, notes, and priority.

#### [MODIFY] [NavigationDrawer.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/components/layout/NavigationDrawer.tsx) & [App.tsx](file:///c:/Users/prije/Downloads/MyWorth/frontend/src/App.tsx)
- Support onboarding check on initial app load and developer tab routing.

---

### 4. Backend Unit Tests
#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
- Add Section 29 tests: System Health monitoring, Beta Safe Mode automatic backups, Onboarding status, Backup restoration validation, and DX REST endpoints. (Target: **215+ tests passing**).

---

## Verification Plan

### Automated Build & Unit Tests
- Backend Unit Tests: `npm test` in `backend` (Target: 215+ tests passing).
- Frontend Production Build: `npm run build` in `frontend` (`tsc -b && vite build` completes with 0 errors).

### Manual Lifecycle Verification
- Run `npm run db:backup` and verify backup file creation in `data/backups/`.
- Verify Onboarding Wizard trigger on empty database state.
- Test Beta Safe Mode one-click restore.
