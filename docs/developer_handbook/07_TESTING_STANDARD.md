# 📖 07_TESTING_STANDARD.md — Automated Testing & Quality Assurance Standard

**Document Purpose**: Define testing strategies, test pyramids, financial calculation precision testing, migration verification tests, and coverage benchmarks for Family Wealth OS.  
**Target Audience**: Software Engineers, QA Engineers, AI Coding Assistants  
**Status**: Active Engineering Standard  

---

## 1. Executive Summary

Financial software demands rigorous verification. A single rounding error or flawed FIFO lot assignment can miscalculate capital gains tax liability or distort net worth reports. Family Wealth OS enforces automated testing across every layer, requiring 100% test coverage on financial calculation engines and 80% minimum overall codebase coverage.

---

## 2. The Family Wealth OS Testing Pyramid

```mermaid
pyramid
    title Testing Pyramid
    "E2E / Visual Tests (5%)" : 5
    "Integration & API Tests (25%)" : 25
    "Unit & Financial Formula Tests (70%)" : 70
```

---

## 3. Test Categories & Execution Guidelines

### 3.1 Unit Tests (70% Volume)
- **Scope**: Individual pure functions, financial utility helpers, Zod validation schemas, and domain service methods.
- **Framework**: Vitest / Jest.
- **Rule**: Must execute fast (< 10ms per test file) and operate completely in memory without hitting external network or SQLite files.

### 3.2 Financial Calculation Tests (100% Mandatory Coverage)
- **Scope**: Valuation math, XIRR convergence, weighted average cost basis, FIFO tax lot assignment, STCG/LTCG capital gains computation.
- **Requirement**: Must include boundary condition tests:
  - Zero holdings / negative returns / partial unit sales.
  - Leap year date bounds for interest calculations.
  - Multi-year transactions with varying NAV prices.
  - Floating-point precision rounding checks (Must round cleanly to 2 decimal places in currency display).

### 3.3 Integration & API Tests (25% Volume)
- **Scope**: Express REST controllers, middleware, and SQLite repository queries.
- **Framework**: Supertest + `better-sqlite3` in-memory database instance (`new Database(':memory:')`).
- **Rule**: Test complete request-to-response cycles including Zod validation failures, database foreign key constraints, and standard error envelopes.

### 3.4 Migration Tests
- **Scope**: DDL table alterations, schema auto-migrations, and backfill logic.
- **Requirement**: Automated tests must populate a mock SQLite database with pre-migration baseline data, run the migration runner, and verify zero data loss and 100% foreign key integrity (`PRAGMA foreign_key_check`).

### 3.5 Security & Performance Benchmark Tests
- **Security Tests**: Automated suite verifying CORS origin rejections, API route token authentication, and parameterized query execution.
- **Performance Benchmarks**: API latency benchmarks ensuring `GET /api/v1/assets` executes under 50ms under a mock load of 100,000 transaction rows.

---

## 4. Code Coverage Expectations

| Code Category | Minimum Unit Coverage | Mandatory Special Checks |
| :--- | :--- | :--- |
| **Financial Services (`src/services/`)** | **100%** | Precision rounding, XIRR convergence, FIFO tax lot tracking. |
| **Repositories (`src/repositories/`)** | **90%** | Foreign key constraint handling, prepared statement caching. |
| **API Controllers (`src/controllers/`)** | **85%** | Zod input validation failure paths, error envelope format. |
| **React Components (`src/components/`)** | **75%** | Render state, user interaction events, Error Boundary catch. |
| **Overall Project Target** | **80%** | Enforced via pre-commit hooks and CI build gates. |
