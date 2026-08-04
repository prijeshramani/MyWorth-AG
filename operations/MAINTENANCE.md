# System Maintenance Guide

## Maintenance Tasks
1. **SQLite Database Vacuuming**: Perform `VACUUM` on SQLite database monthly to optimize memory and disk footprint.
2. **Sync Logs Pruning**: Clear `sync_logs` and transient audit logs older than 90 days.
3. **Dependency Auditing**: Run `npm audit` across root, backend, and frontend packages to patch vulnerabilities.
