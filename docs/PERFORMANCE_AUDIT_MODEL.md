# 📜 PERFORMANCE_AUDIT_MODEL.md — Audit Trail & Quality Model

**System Name**: Family Wealth OS  
**Phase**: Sprint 4 (Performance Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Audit Trail Requirements

Every `PerformanceEngine` execution produces a complete, human-readable `auditTrail` log array inside its `EngineResult<PerformanceSnapshot>` output envelope.

```text
[PerformanceEngine v1.0.0 | Rules: 2026.1] Execution started at 2026-07-26T21:30:00.000Z
[Context] Correlation ID: perf_calc_1002 | Scope: HOLDING (Reliance Industries)
[Input] 4 CashFlow events received spanning 2024-01-15 to 2026-07-26 (923 days)
[CashFlow] 2024-01-15: BUY -₹1,00,000.00 (Inflow)
[CashFlow] 2025-01-15: BUY -₹50,000.00 (Inflow)
[CashFlow] 2025-06-30: DIVIDEND +₹5,000.00 (Outflow)
[TerminalValuation] 2026-07-26: Current Market Value +₹2,10,000.00
[Solver] Newton-Raphson XIRR converged in 6 iterations -> XIRR: 18.45%
[CAGR] Time horizon: 2.53 years (923 days) -> CAGR: 17.82%
[Manifest] Checksum: c8e920d... generated in 0.8ms
```

---

## 2. Quality Metrics & Warning System

- `XIRR_NEWTON_RAPHSON_NON_CONVERGENCE`: Newton-Raphson failed to converge; fallback bisection solver invoked.
- `INSUFFICIENT_CASH_FLOWS`: Fewer than 2 cash flow dates provided; XIRR cannot be computed.
- `SHORT_HOLDING_PERIOD`: Holding period < 365 days; CAGR annualized return omitted to prevent distortion.
