# Phase7B0_Master_Implementation_Prompt.md

# FamilyWealthOS -- Phase 7B.0

## Developer Experience (DX), Local Onboarding & Beta Readiness

> **Mission** Prepare FamilyWealthOS for real-world usage with the
> owner's personal data while continuing platform development. Focus on
> local usability, onboarding, database lifecycle, import experience,
> health monitoring and developer productivity.

------------------------------------------------------------------------

# Objectives

-   One-command local setup
-   Safe database lifecycle
-   First-run onboarding
-   Import real Indian financial data
-   Continuous beta testing

------------------------------------------------------------------------

# 1. Local Database Lifecycle

Implement:

``` bash
npm run db:reset
npm run db:rebuild
npm run db:backup
npm run db:restore
npm run db:seed-demo
npm run db:seed-empty
npm run db:seed-all
```

`db:reset` must: - Automatically create a timestamped backup - Drop the
SQLite database - Execute migrations 001--011 - Seed master/reference
data only - Never seed demo investments unless explicitly requested

------------------------------------------------------------------------

# 2. First Run Experience

If no user exists, launch an onboarding wizard.

Collect: - Name - Email - Password - Family Name - Country (India
default) - Currency (INR default) - Financial Year - Timezone

Automatically create: - User - Family - Default Roles - Default Settings

------------------------------------------------------------------------

# 3. Import Center

Reuse all existing parsers and broker integrations.

Support:

-   CAMS CAS
-   NSDL/CDSL
-   Zerodha
-   Groww
-   Bank CSV
-   Credit Card CSV
-   Manual Excel

Features:

-   Import progress
-   Validation summary
-   Duplicate detection
-   Rollback
-   Import history

------------------------------------------------------------------------

# 4. Developer Tools

Settings → Developer

-   Reset Database
-   Backup Database
-   Restore Backup
-   Refresh AI Context
-   Rebuild Knowledge Graph
-   Recalculate Tax
-   Recalculate Estate
-   Recalculate Recommendations
-   Clear AI Memory
-   System Health Check

------------------------------------------------------------------------

# 5. Health Dashboard

Display health of:

-   Database
-   Migration Version
-   AI Context
-   Knowledge Graph
-   Recommendation Engine
-   Tax Engine
-   Estate Engine
-   Projection Engine
-   Import Engine
-   Storage Usage

------------------------------------------------------------------------

# 6. Backup & Restore

Support encrypted local backup containing:

-   SQLite Database
-   Uploaded Documents
-   AI Memory
-   Settings

Validate backup before restore.

------------------------------------------------------------------------

# 7. Beta Feedback

Provide a floating Feedback button.

Capture:

-   Current screen
-   Screenshot (optional)
-   Category
-   Notes
-   Priority

Store locally.

------------------------------------------------------------------------

# 8. Test Data Strategy

Support:

-   Empty Mode
-   Demo Mode
-   Hybrid Mode

Switch between modes without reinstalling.

------------------------------------------------------------------------

# 9. ⭐ Beta Safe Mode (Mandatory Enhancement)

Implement a dedicated **Beta Safe Mode** for developers using real
financial data.

Requirements:

-   Confirm every destructive operation.
-   Automatically create a backup before:
    -   Database reset
    -   Bulk delete
    -   Import rollback
    -   Restore overwrite
-   Create timestamped restore points.
-   One-click **Restore Last Backup**.
-   Health Dashboard warns when backups are stale.
-   Never permanently delete user data without a recovery path.

------------------------------------------------------------------------

# 10. Beta Readiness Checklist

Display readiness before allowing production-style usage:

-   User created
-   Family configured
-   Onboarding completed
-   Imports configured
-   Backup available
-   Health checks passing

------------------------------------------------------------------------

# Acceptance Criteria

-   One-command setup
-   One-command reset
-   Safe backup before reset
-   First-run onboarding
-   Empty database ready for personal data
-   Beta Safe Mode operational
-   Existing 206 tests remain passing
-   215+ tests after DX additions
-   Clean production build

------------------------------------------------------------------------

# Documentation

Generate:

-   LOCAL_SETUP_GUIDE.md
-   DATABASE_LIFECYCLE.md
-   ONBOARDING_GUIDE.md
-   IMPORT_CENTER_GUIDE.md
-   BACKUP_RESTORE_GUIDE.md
-   BETA_SAFE_MODE_GUIDE.md
-   HEALTH_DASHBOARD_GUIDE.md
-   Sprint_7B0_Retrospective.md
-   AI_CHANGELOG.md
-   SESSION_CONTEXT.md
-   Phase 7B0 - Implementation Summary.md

------------------------------------------------------------------------

# Final Instruction

Optimize this phase for daily development and beta usage. After
completion, FamilyWealthOS should be installable on a fresh machine,
safely resettable, able to onboard a new family in minutes, import real
Indian financial data, protect local data through Beta Safe Mode, and
support parallel development of Phase 7B (AI Wealth Advisor).
