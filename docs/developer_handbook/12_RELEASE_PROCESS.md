# 📖 12_RELEASE_PROCESS.md — Release Engineering & Backup Strategy

**Document Purpose**: Define release candidate preparation, quality verification gates, version tagging, database backup protocols, and zero-data-loss rollback procedures for Family Wealth OS.  
**Target Audience**: Software Engineers, Release Engineers, AI Coding Assistants  
**Status**: Active Engineering Standard  

---

## 1. Executive Summary

Because Family Wealth OS runs locally on end-user desktop machines and manages local SQLite databases (`data/family_wealth.db`), release management requires zero-downtime database safety. Every release candidate MUST pass automated schema migration tests and execute automated file backups prior to applying upgrades.

---

## 2. The 5-Stage Release Lifecycle

```mermaid
flowchart LR
    Stage1["1. Development
    (feature/* -> main)"] --> Stage2["2. Quality Verification
    (npm test & lint)"]
    Stage2 --> Stage3["3. Release Candidate (RC)
    (v1.2.0-rc.1)"]
    Stage3 --> Stage4["4. Database Backup & Production Release
    (v1.2.0)"]
    Stage4 --> Stage5["5. Post-Release Verification & Rollback Plan"]
```

---

### Stage 1: Development Completion
- Feature branches merged into `main` via approved Pull Request following `04_GIT_WORKFLOW.md`.
- All items in `03_DEFINITION_OF_DONE.md` verified.

### Stage 2: Quality Verification Gate
Execute complete automated build verification:
```bash
# 1. Run type checking and linter
npm run lint

# 2. Run backend and frontend automated test suites
cd backend && npm test

# 3. Verify production build compilation
npm run build
```

### Stage 3: Release Candidate (RC) Tagging
- Create a pre-release candidate tag (e.g. `v1.2.0-rc.1`).
- Execute manual end-to-end testing of statement imports, portfolio valuation, and navigation.

### Stage 4: Automated Database Backup & Upgrade Execution
Before applying any app upgrade or schema migration, the application launcher automatically creates a compressed, timestamped physical backup of the SQLite database:
- Backup Path: `data/backups/family_wealth_backup_v1.1.0_20260725_120000.db`
- Retention: Retain last 10 release backups in `data/backups/`.

### Stage 5: Production Tagging & Release Packaging
- Tag `main` with semantic version tag: `git tag -a v1.2.0 -m "Release v1.2.0 - Multi-Entity Family Model"`.
- Push tag to repository: `git push origin v1.2.0`.
- Package desktop executable build output.

---

## 3. Rollback Procedure & Emergency Restoration

If a critical error, database lock, or regression occurs post-release:

```mermaid
sequenceDiagram
    autonumber
    participant App as Application Launcher
    participant DB as Active DB (family_wealth.db)
    participant Backup as Last Good Backup (backups/...)

    Note over App: Critical Migration or Runtime Failure Detected
    App->>DB: Close active database connections safely
    App->>DB: Rename corrupted database to family_wealth_corrupted.db
    App->>Backup: Copy last good backup file
    App->>DB: Restore as active family_wealth.db
    App->>App: Relaunch app on previous stable version tag
    Note over App: System restored with zero data loss
```

1. **Automatic Detection**: If database schema migration fails or foreign key validation checks fail (`PRAGMA foreign_key_check`), the app aborts launch immediately.
2. **Atomic Restoration**: The corrupted DB file is moved to `data/backups/failed_migration_<timestamp>.db`.
3. **Backup Reinstatement**: The pre-upgrade database copy is restored as `data/family_wealth.db`.
4. **Safety Confirmation**: The system relaunches on the previous stable release tag without data loss.
