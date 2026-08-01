# Data Retention Policy

## 1. Local Database Persistence
- Asset records, transactions, historical market prices, and Knowledge Graph nodes/edges are persisted permanently in `data/myworth.db`.
- Soft-deletes are utilized (`status = 'DELETED'` or `deleted_at IS NOT NULL`) to preserve auditability.

## 2. Ephemeral Simulation Snapshots
- What-If simulations are ephemeral by default.
- Simulation snapshots saved by the user are retained in `simulation_snapshots` table for historical scenario comparisons.
