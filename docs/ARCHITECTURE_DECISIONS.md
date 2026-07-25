# 📜 ARCHITECTURE_DECISIONS.md — Architecture Decision Records (ADR)

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: Approved ADR Log (Sprint 0.5)

---

## Index of ADRs
- [ADR-001: SQLite via `better-sqlite3` as Primary Local Database Engine](#adr-001-sqlite-via-better-sqlite3-as-primary-local-database-engine)
- [ADR-002: Repository Pattern with Layered Architecture](#adr-002-repository-pattern-with-layered-architecture)
- [ADR-003: No Heavy ORM — Raw SQL inside Typed DAO Repositories](#adr-003-no-heavy-orm--raw-sql-inside-typed-dao-repositories)
- [ADR-004: Externalized Configuration-Driven Business Rules](#adr-004-externalized-configuration-driven-business-rules)
- [ADR-005: Persistent Knowledge Layer for AI Context](#adr-005-persistent-knowledge-layer-for-ai-context)
- [ADR-006: Privacy-Preserving AI Personal CFO Architecture](#adr-006-privacy-preserving-ai-personal-cfo-architecture)
- [ADR-007: FIFO Tax Lot Tracking Engine for Capital Gains](#adr-007-fifo-tax-lot-tracking-engine-for-capital-gains)
- [ADR-008: Localhost Network Hardening & Strict CORS](#adr-008-localhost-network-hardening--strict-cors)

---

## ADR-001: SQLite via `better-sqlite3` as Primary Local Database Engine

### Status: Accepted

### Context
Family Wealth OS requires a fast, reliable, zero-configuration local database that runs natively on user desktop machines without requiring background database services (such as PostgreSQL or MySQL daemons).

### Decision
Retain SQLite 3 via the synchronous `better-sqlite3` driver as the core storage engine.

### Consequences
- **Benefits**:
  - Zero setup or database installation required for end users.
  - Entire database resides in a single portable file (`data/family_wealth.db`), simplifying local backups.
  - Synchronous C-bindings provide sub-millisecond query execution speeds.
- **Risks & Trade-offs**:
  - SQLite does not natively support concurrent client writes (single-writer model).
  - Schema migrations require explicit DDL table rebuilding for complex ALTER operations.
- **Long-Term Impact**: Ideal for desktop single-user execution over a 20+ year horizon.

---

## ADR-002: Repository Pattern with Layered Architecture

### Status: Accepted

### Context
In the baseline application, Express route controllers execute raw SQL queries directly inline, mixing HTTP parsing, database access, and financial calculations.

### Decision
Adopt the **Repository Pattern** with strict Layered Architecture (`Controller -> Service -> Repository -> SQLite`).

### Consequences
- **Benefits**:
  - Decouples Express HTTP infrastructure from core domain logic and SQL execution.
  - Enables unit testing of financial domain logic using mock repository interfaces (`IAssetRepository`).
- **Risks & Trade-offs**:
  - Increases the number of TypeScript files and interface definitions.
- **Long-Term Impact**: High maintainability; allows underlying database drivers to be upgraded without touching domain logic.

---

## ADR-003: No Heavy ORM — Raw SQL inside Typed DAO Repositories

### Status: Accepted

### Context
We evaluated adding a heavy JavaScript ORM (such as Prisma or TypeORM) versus maintaining raw SQL inside Data Access Objects (DAOs).

### Decision
Do NOT adopt a heavy ORM. Retain raw, parameterized SQL queries isolated inside typed Repository classes.

### Consequences
- **Benefits**:
  - Avoids ORM memory overhead, slow cold starts, and complex shadow schema generation.
  - Provides total control over SQL performance, indexed joins, and complex financial aggregations.
- **Risks & Trade-offs**:
  - SQL schema changes must be manually reflected in TypeScript interface types.
- **Long-Term Impact**: Keeps bundle size minimal, runtime lightweight, and avoids ORM deprecation churn over decades.

---

## ADR-004: Externalized Configuration-Driven Business Rules

### Status: Accepted

### Context
Financial parameters (asset allocation targets, tax rates, risk limits) were previously embedded directly in application code.

### Decision
Externalize all financial business rules into human-readable JSON files located in `config/` (`asset_allocation.json`, `tax_rules.json`, `risk_rules.json`).

### Consequences
- **Benefits**:
  - Financial rules can be updated without recompiling code or re-deploying application binaries.
  - Non-technical users or AI advisors can inspect and adjust investment rules.
- **Risks & Trade-offs**:
  - Invalid JSON configuration syntax can break domain calculations; requires Zod schema validation on startup.
- **Long-Term Impact**: Establishes a configuration-driven architecture suitable for changing tax laws and investment rules.

---

## ADR-005: Persistent Knowledge Layer for AI Context

### Status: Accepted

### Context
The application must maintain long-term memory of family financial principles, investment constitutions, and decision histories across sessions.

### Decision
Establish a dedicated `knowledge/` directory containing structured Markdown files (`Investment_Constitution.md`, `Family_Wealth_Master.md`, `Decision_Log.md`).

### Consequences
- **Benefits**:
  - Provides a human-readable and AI-readable persistent memory of family wealth strategy.
  - Decouples financial wisdom and decision reasoning from application code.
- **Risks & Trade-offs**:
  - Files must be kept synchronized with database actions.
- **Long-Term Impact**: Preserves the family's financial operating manual over 20+ years.

---

## ADR-006: Privacy-Preserving AI Personal CFO Architecture

### Status: Accepted

### Context
The application integrates an AI Personal CFO to provide decision support while maintaining strict user data privacy.

### Decision
Implement a local prompt synthesis engine that converts local database state into anonymized summaries combined with `knowledge/Investment_Constitution.md` before querying AI models.

### Consequences
- **Benefits**:
  - Guarantees sensitive raw financial data (account numbers, full PANs) are never exposed to external AI endpoints.
  - AI recommendations are strictly grounded in user-defined rules and investment principles.
- **Risks & Trade-offs**:
  - Synthesizing concise summaries requires careful prompt token budget management.
- **Long-Term Impact**: High trust and privacy-first AI collaboration model.

---

## ADR-007: FIFO Tax Lot Tracking Engine for Capital Gains

### Status: Accepted

### Context
The baseline system used simple weighted average cost calculation, which cannot compute accurate Short-Term (STCG) and Long-Term (LTCG) capital gains for Indian tax filings.

### Decision
Implement a dedicated FIFO (First-In, First-Out) Tax Lot Engine in `backend/src/services/taxLotService.ts`.

### Consequences
- **Benefits**:
  - Calculates exact tax liability for equity, mutual funds, and gold sales based on actual holding periods.
  - Enables tax-loss harvesting recommendations.
- **Risks & Trade-offs**:
  - Requires maintaining a new `tax_lots` database table and backfilling historical transactions.
- **Long-Term Impact**: Accurate capital gains accounting for Indian income tax compliance.

---

## ADR-008: Localhost Network Hardening & Strict CORS

### Status: Accepted

### Context
The baseline application configured CORS with wildcard origins (`origin: '*'`) and bound to `0.0.0.0`, exposing local APIs to any website open in the user's browser.

### Decision
Bind Express server strictly to loopback interface `127.0.0.1` and enforce strict CORS origin validation restricted to `http://localhost:5173`.

### Consequences
- **Benefits**:
  - Prevents cross-site request forgery (CSRF) and cross-site data theft from external web pages.
  - Blocks external network devices on local Wi-Fi from reaching port 5000.
- **Risks & Trade-offs**:
  - Remote access from mobile devices on local network will require explicit proxying or SSH tunneling.
- **Long-Term Impact**: Production-grade local security posture.
