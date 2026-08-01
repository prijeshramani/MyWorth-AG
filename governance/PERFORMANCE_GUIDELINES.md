# Performance & Optimization Guidelines

## 1. Query & Index Optimization
- Indexes on `transactions(asset_id, date)` and `asset_prices(asset_id, date)` guarantee sub-10ms query execution across 10,000+ transaction ledgers.

## 2. Ephemeral Simulation Memory Overhead
- What-If simulations are computed in-memory without disk I/O bottlenecks.
