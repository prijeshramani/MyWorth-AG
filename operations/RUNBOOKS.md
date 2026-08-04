# Operations Runbooks

## Overview
Operational procedures for FamilyWealthOS local backend and web interface startup, diagnostic checks, database repair, and sync resets.

---

## Runbook 1: System Cold Startup
1. Ensure Node.js v18+ and SQLite native dependencies are available.
2. Run database migration runner: `npm run build --prefix backend`.
3. Start backend server: `npm start --prefix backend` (Port 5001).
4. Start web application: `npm run dev --prefix frontend` (Port 5173).

---

## Runbook 2: Database Migration & Health Recovery
1. Access `/api/v1/platform/registry` or Developer Diagnostic Console.
2. If SQLite schema errors occur, check `backend/data/myworth.db` permissions.
3. To trigger emergency migration re-run, restart node server process.

---

## Runbook 3: Resetting Broker Sync Caches
1. Open Developer Diagnostic Console -> Cache Metrics.
2. Select "Purge Asset Price Cache".
3. Trigger `REFRESH_PORTFOLIO` from AI Action Center.
