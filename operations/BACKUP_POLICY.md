# Backup & Retention Policy

## Strategy
1. **Automated Daily Backups**: SQLite database `myworth.db` is backed up to `backend/data/backups/myworth_backup_YYYYMMDD.db`.
2. **Pre-Migration Backups**: `migrationRunner.ts` automatically snapshot-backs up database before applying new versioned migrations.
3. **Pre-Action Backups**: High-risk actions in `AIActionRegistry` (`APPLY_REBALANCING_PLAN`) trigger automatic WAL snapshots.
4. **Retention Window**: Retain daily backups for 30 days locally.
