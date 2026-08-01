# Disaster Recovery & Database Backup Strategy

## 1. Automated SQLite Backups
- Local SQLite database (`data/myworth.db`) is copied to `data/backups/myworth_backup_YYYYMMDD.db` before major migrations or destructive data operations.

## 2. Action Rollback Recovery
- Executable actions with `undoSupported: true` generate an inverse audit transaction to restore historical states cleanly.
