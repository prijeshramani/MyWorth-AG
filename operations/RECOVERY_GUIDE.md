# Disaster Recovery & Restore Guide

## Disaster Scenarios & Recovery Procedures

### Scenario 1: Corrupted SQLite Database
1. Stop backend service.
2. Locate latest healthy snapshot in `backend/data/backups/`.
3. Copy snapshot to `backend/data/myworth.db`.
4. Restart backend server.

### Scenario 2: Rollback Failed Action Execution
1. Open AI Action Center -> Audit Trail.
2. Find Action Execution Audit ID.
3. Click "Undo" or send `POST /api/v1/ai/actions/undo` with `auditId` and `actionId`.
4. Verify engine state returned to pre-action baseline.
