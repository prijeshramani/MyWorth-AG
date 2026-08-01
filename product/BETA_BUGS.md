# Product Management – Beta Bugs Log

| Bug ID | Title | Component | Priority | Status | Fixed Date | Resolution Details |
|---|---|---|---|---|---|---|
| BUG-001 | 0% Unrealized Gain on Stock Holdings | Import / Market Feed | High | Fixed | 2026-07-31 | Added live market LTP lookup fallback for Zerodha, AngelOne, and Upstox assets. |
| BUG-002 | Idempotent Edge Sync Graph Inflation | Knowledge Graph | High | Fixed | 2026-07-31 | Enforced unique constraint on `(source_node_id, target_node_id, relationship_type)`. |
| BUG-003 | 404 Error on `/api/v1/tax/summary` | Tax Intelligence | Medium | Fixed | 2026-07-31 | Added active family fallback in `TaxApplicationService.ts`. |
| BUG-004 | INDMoney API 500 Header Conflict | Broker Ingestion | High | Fixed | 2026-07-31 | Refactored requests to try isolated single-header strategies sequentially. |
| BUG-005 | TCS EPF Multi-Column Regex Parsing | PDF Ingestion | High | Fixed | 2026-07-31 | Updated parser for multi-column opening balance, monthly rows, and net closing balance. |
