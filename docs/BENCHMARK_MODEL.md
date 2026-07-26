# 📈 BENCHMARK_MODEL.md — Benchmark Index Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 5B (Risk Intelligence Engine - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Supported Benchmark Index Architecture

The Risk Intelligence Engine includes built-in metadata models for 5 major market benchmarks:

| Benchmark ID | Index Name | Country | Asset Focus | Currency |
| :--- | :--- | :--- | :--- | :--- |
| `NIFTY_50` | Nifty 50 Index | India | Large-Cap Indian Equities | INR |
| `SENSEX` | BSE Sensex | India | Top 30 Indian Companies | INR |
| `NIFTY_500` | Nifty 500 Index | India | Broad Indian Market | INR |
| `NASDAQ_100` | Nasdaq 100 Index | United States | US Tech & Growth | USD |
| `S_AND_P_500` | S&P 500 Index | United States | US Large-Cap Equities | USD |

---

## 2. Decoupled Provider Integration Strategy

The engine accepts pre-aligned benchmark return series inside `RiskInputPayload.benchmarkTimeSeries`.
- **Zero API Lock-in**: Benchmark prices are supplied by upstream services (e.g. via `YahooFinanceProvider` symbols `^NSEI`, `^BSESN`, `^NDX`, `^GSPC`).
- **Date Alignment Policy**: Aligns portfolio evaluation dates with market trading days using `MarketCalendar`.
