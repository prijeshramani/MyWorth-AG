# Performance Benchmark Framework Specification

## Overview
The `BenchmarkFramework` executes stress-tests for all deterministic calculation engines and AI context components.

---

## Latest Benchmark Report (`bm_v2.0.0`)

| Engine Name | Executions | Avg Latency | P95 Latency | Throughput | Threshold Max | Status |
|---|---|---|---|---|---|---|
| Portfolio Engine | 100 | 3.9 ms | 7.8 ms | 256 / sec | 15 ms | PASS |
| Capital Gains Tax Engine | 100 | 2.9 ms | 5.9 ms | 344 / sec | 10 ms | PASS |
| Projection Engine (Monte Carlo) | 50 | 34.4 ms | 58.0 ms | 29 / sec | 100 ms | PASS |
| Recommendation Rule Engine | 100 | 5.9 ms | 11.2 ms | 169 / sec | 25 ms | PASS |
| Knowledge Graph Repository | 100 | 2.6 ms | 4.9 ms | 384 / sec | 10 ms | PASS |
| AI Context Aggregator | 50 | 17.0 ms | 29.5 ms | 58 / sec | 50 ms | PASS |
| What-If Simulation Engine | 50 | 15.2 ms | 25.0 ms | 65 / sec | 50 ms | PASS |

**Performance Improvement vs Previous Build (v1.9.0)**: **4.2% faster**.
