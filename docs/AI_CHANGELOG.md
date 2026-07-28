# AI Changelog

All changes executed by AI Coding Assistant are logged in reverse chronological order.

---

## [Phase 7B.0] - Developer Experience (DX), Local Onboarding & Beta Readiness (2026-07-28)

### Summary
Implemented **Developer Experience (DX), Local Onboarding & Beta Readiness**. Created CLI database lifecycle tool `dbLifecycle.ts` and added npm scripts (`npm run db:reset`, `npm run db:rebuild`, `npm run db:backup`, `npm run db:restore`, `npm run db:seed-demo`, `npm run db:seed-empty`). Created `BackupService.ts` (Beta Safe Mode automatic recovery points, SHA-256 and Foreign Key integrity verification), `SystemHealthService.ts` (real-time health monitoring & System Health Score), `OnboardingService.ts` (first-run onboarding status & beta feedback), `DXController.ts`, and `dxRoutes.ts` serving `/api/v1/dx`. Built frontend `dxService.ts`, production `DeveloperConsole.tsx` view (System Health Cards, Beta Safe Mode controls, Engine recalculation triggers), and `FeedbackWidget.tsx` (global floating Beta Feedback button). Added 8 architectural documentation files. Added Section 29 unit tests (**215 PASSED, 0 FAILED**). Verified production bundle build via Vite (`dist/` built cleanly in 14.48s with 0 errors).

### Added
- `backend/src/scripts/dbLifecycle.ts`: CLI script for local database lifecycle.
- `backend/src/services/BackupService.ts`: Beta Safe Mode backup & restore engine.
- `backend/src/services/SystemHealthService.ts`: Real-time health monitoring service.
- `backend/src/services/OnboardingService.ts`: First-run onboarding & feedback service.
- `backend/src/controllers/DXController.ts`: DX REST API controller.
- `backend/src/routes/dxRoutes.ts`: Express router for DX endpoints.
- `frontend/src/services/dxService.ts`: Typed API client for DX endpoints.
- `frontend/src/components/developer/DeveloperConsole.tsx`: Production Developer Console view.
- `frontend/src/components/common/FeedbackWidget.tsx`: Global floating Beta Feedback widget.
- `docs/LOCAL_SETUP_GUIDE.md`: Local setup guide document.
- `docs/DATABASE_LIFECYCLE.md`: Database lifecycle guide document.
- `docs/ONBOARDING_GUIDE.md`: Onboarding guide document.
- `docs/IMPORT_CENTER_GUIDE.md`: Import center guide document.
- `docs/BACKUP_RESTORE_GUIDE.md`: Backup restore guide document.
- `docs/BETA_SAFE_MODE_GUIDE.md`: Beta safe mode guide document.
- `docs/HEALTH_DASHBOARD_GUIDE.md`: Health dashboard guide document.
- `docs/Sprint_7B0_Retrospective.md`: Phase 7B.0 retrospective report.
- `prompts/summary/Phase 7B0 - Implementation Summary.md`: Comprehensive Phase 7B.0 summary report.

### Updated
- `backend/package.json`: Added `db:reset`, `db:rebuild`, `db:backup`, `db:restore`, `db:seed-demo`, `db:seed-empty` scripts.
- `backend/src/routes/index.ts`: Mounted `dxRouter`.
- `backend/src/__tests__/runTests.ts`: Added Section 29 DX tests (**215 PASSED, 0 FAILED**).
- `frontend/src/App.tsx`: Rendered global `FeedbackWidget` and routed `DeveloperConsole`.

---

## [Phase 7A] - AI Context, Memory & Evidence Layer (2026-07-28)

### Summary
Implemented the **AI Context, Memory & Evidence Layer**.
