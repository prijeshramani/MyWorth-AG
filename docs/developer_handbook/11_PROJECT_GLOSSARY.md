# 📖 11_PROJECT_GLOSSARY.md — Project Glossary & Financial Terminology

**Document Purpose**: Definitive glossary of financial, technical, domain-specific terms, and abbreviations used across Family Wealth OS.  
**Target Audience**: Software Engineers, Financial Analysts, AI Coding Assistants  
**Status**: Active Engineering Standard  

---

## 1. Financial Domain Terminology

| Term / Abbreviation | Full Name / Definition | Context & Usage in Family Wealth OS |
| :--- | :--- | :--- |
| **CAS** | **Consolidated Account Statement** | Unified monthly/quarterly PDF statement issued by CAMS or KFintech detailing all Indian Mutual Fund transactions, folio balances, and ISINs. |
| **AMFI** | **Association of Mutual Funds in India** | Industry association publishing daily official Net Asset Values (NAVs) for all Indian mutual fund schemes at `amfiindia.com`. |
| **NAV** | **Net Asset Value** | The per-share market price of a mutual fund scheme calculated daily at market close. |
| **XIRR** | **Extended Internal Rate of Return** | Annualized rate of return calculation for cash flows occurring at irregular intervals (SIPs, lump sums, redemptions). |
| **EPF** | **Employees' Provident Fund** | Mandatory retirement savings scheme for salaried employees in India managed by EPFO. Consists of Employee Contribution, Employer Contribution, and accumulated interest. |
| **PPF** | **Public Provident Fund** | 15-year tax-free government-backed savings scheme in India. |
| **NPS** | **National Pension System** | Government-sponsored voluntary pension scheme in India categorized into Tier I (locked) and Tier II (withdrawable) accounts. |
| **SSA** | **Sukanya Samriddhi Yojana** | Government-backed savings scheme for female minor children in India. |
| **HUF** | **Hindu Undivided Family** | A distinct legal and tax entity under Indian Income Tax law separate from individual family members, used for legal tax optimization. |
| **STCG** | **Short-Term Capital Gains** | Profits realized on assets held below statutory holding periods (12 months for equity, 24/36 months for debt/real estate). |
| **LTCG** | **Long-Term Capital Gains** | Profits realized on assets held above statutory holding periods. |
| **FIFO** | **First-In, First-Out** | Accounting method for capital gains where the earliest purchased units/shares are assumed to be sold first. |
| **ISIN** | **International Securities Identification Number** | 12-character alphanumeric code uniquely identifying a specific stock or mutual fund scheme (e.g. `INF209K01157`). |
| **Folio Number** | **Mutual Fund Account Number** | Unique account identifier assigned by an Asset Management Company (AMC) to an investor. |

---

## 2. Technical Architectural Terminology

| Term | Definition in Family Wealth OS |
| :--- | :--- |
| **Local-First** | Architecture where 100% of data is stored and processed locally on the user's desktop without reliance on external cloud databases. |
| **Layered Monolith** | Architectural pattern separating Express HTTP Controllers, Domain Services, Repositories, and SQLite persistence. |
| **DDD (Domain-Driven Design)**| Software design approach structuring code around real-world domain models and Bounded Contexts. |
| **Repository Pattern** | Abstraction layer isolating database SQL execution (`better-sqlite3`) behind typed interface contracts (`IAssetRepository`). |
| **Zod** | TypeScript-first schema validation library enforcing runtime API payload correctness. |
| **TanStack Query** | Client-side asynchronous server-state fetching and caching library (formerly React Query). |
| **Zustand** | Lightweight React global state management library used for synchronous UI state (e.g. active entity filter). |
| **Argon2id** | Key derivation function used for deriving local master encryption keys from user passwords. |
| **AES-256-GCM** | Authenticated symmetric encryption algorithm used to encrypt credentials and sensitive columns at rest. |

---

## 3. Project-Specific Terminology

| Term | Definition & Responsibility |
| :--- | :--- |
| **BankInsights** | Ingestion service module analyzing bank CSV/Excel statement narrations using regular expressions to categorize income vs. expenses. |
| **Investment Constitution**| Human-written Markdown document (`knowledge/Investment_Constitution.md`) defining family asset allocation principles and purchase rules. |
| **Investment Thesis** | Documented rationale, target exit price, and conviction score written by the user prior to buying or selling an asset. |
| **Decision Journal** | Historical quarterly log (`knowledge/Decision_Log.md`) capturing wealth decisions, market conditions, and expected outcomes. |
| **Session Context** | Persistent AI session memory file (`.ai/SESSION_CONTEXT.md`) tracking sprint status, recent file changes, and recommended tasks. |
