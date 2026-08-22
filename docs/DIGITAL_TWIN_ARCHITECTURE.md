# Family Digital Twin Architecture (Sprint 8B.1)

## 1. Overview & Purpose

The **Family Digital Twin (`DigitalTwinService`)** provides a unified, computable, point-in-time semantic projection of a family's multi-domain financial reality.

### Core Architectural Principle
> **SQLite + Deterministic Calculation Engines = Single Authoritative Source of Truth**  
> **DigitalTwinService = Derived In-Memory Semantic Projection & Provenance Layer**

The Digital Twin is **NOT** a second financial database. It does not store duplicated ledger balances or transaction rows. Instead, it dynamically aggregates and evaluates the family's state across 5 core dimensions:
1. **Lineage & Legal Structure**: Members, PANs, HUFs, trusts, and Knowledge Graph entity relationships.
2. **Balance Sheet**: Consolidated gross assets, verified liabilities, net worth, liquid cash reserves, emergency fund months, and asset class distributions.
3. **Protection Shield**: Active term and health cover, human life value (HLV) gap analysis, policy status filtering, and uninsured member detection.
4. **Trajectory (Goals & Cash Flow)**: Active milestone goals, retirement corpus target, projected retirement age, and savings rates.
5. **Governance (Estate & Tax)**: Will registration status, Private Family Trust status, Section 80C headroom, and estate health readiness score.

---

## 2. Architecture & Data Flow

```
+----------------------------------------------------------------------------------------------------+
|                                    AUTHORITATIVE SOURCES OF TRUTH                                  |
|  +--------------------+  +----------------------+  +---------------------+  +--------------------+  |
|  | `family_members`   |  | `assets` / `holdings`|  | `insurance_policies`|  | `financial_goals`  |  |
|  | `entities` (HUFs)  |  | `asset_prices`       |  | `wills` / `trusts`  |  | `graph_nodes/edges`|  |
|  +--------------------+  +----------------------+  +---------------------+  +--------------------+  |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                              DETERMINISTIC ENGINE ORCHESTRATION LAYER                              |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | `NetWorthEngine`    |  | `PortfolioAnalytics|  | `InsuranceService`  |  | `EstateHealth`     |  |
|  | (Valuation/Balances)|  | (Allocations/HHI)  |  | (Policy Analytics)  |  | (Readiness/Trusts) |  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                            DIGITAL TWIN SERVICE (`DigitalTwinService`)                              |
|    - Dynamic Family Scope Resolution (Authorization-enforced)                                      |
|    - 5-Pillar Semantic State Hydration with Domain Failure Isolation                               |
|    - Deterministic Multi-Domain Completeness Model ($S_{comp} \in [0, 100]$)                       |
|    - Canonical State Hash ($H_{\text{state}}$ excluding volatile metadata)                        |
|    - Point-in-Time Freshness (`asOf`, `generatedAt`, `sourceFreshness`)                            |
|    - Deduplicated, Sanitized Fiduciary Audit Dispatch (`AuditHookService`)                         |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                           CONSUMERS & DOWNSTREAM AGENTS                                            |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
|  | Life Events Engine  |  | Proactive Observer |  | Fiduciary AI Advisor|  | REST API / UI      |  |
|  | (Sprint 8B.2)       |  | (Sprint 8B.3)      |  | (Phase 8C)          |  | (/api/v1/...)      |  |
|  +---------------------+  +--------------------+  +---------------------+  +--------------------+  |
+-------------------------------------------------+--------------------------------------------------+
```

---

## 3. Dynamic Family Scope & Security Model

- **Authorized Context Resolver**: `authorizedFamilyId` is resolved strictly from the authenticated request context / `CorrelationContext`.
- **Zero Client Overrides**: Normal user requests cannot access unauthorized family IDs via query parameters. Unauthorized requests are rejected with `403 Forbidden`.
- **Zero Cross-Family Leaks**: All database queries are strictly parameterized with `family_id = ?`.

---

## 4. Deterministic Data Completeness Model

The completeness score $S_{\text{completeness}}$ measures the **structural availability of essential profile information** across the 5 domains:

$$S_{\text{completeness}} = 0.15 \times S_{\text{Lineage}} + 0.25 \times S_{\text{BalanceSheet}} + 0.25 \times S_{\text{Protection}} + 0.20 \times S_{\text{Trajectory}} + 0.15 \times S_{\text{Governance}}$$

### Scoring Rubric
- **Lineage & KYC (15%)**: Registered members (5 pts), Declared head of family (5 pts), Valid PAN on file (5 pts).
- **Balance Sheet & Assets (25%)**: Asset holdings imported (10 pts), Bank/liquid accounts mapped (5 pts), Multi-asset class diversification (10 pts).
- **Protection Shield (25%)**: Active term insurance policy (10 pts), Active health insurance policy (10 pts), All members covered with zero uninsured (5 pts).
- **Trajectory & Goals (20%)**: Active financial goals configured (10 pts), Retirement corpus planned (5 pts), Monthly savings/SIP rate defined (5 pts).
- **Governance & Estate (15%)**: Registered Will on file (8 pts), Estate health readiness score $\ge 50$ (7 pts).

### Tier Thresholds
- **$\ge 80\%$**: `COMPLETE` (Full autonomous recommendations enabled).
- **$50\% - 79\%$**: `PARTIAL` (Proactive observer prompts for missing essential pillars).
- **$< 50\%$**: `INSUFFICIENT_DATA` (Complex tax/estate triggers suppressed; guides user to onboarding).

---

## 5. Canonical State Hash & Point-in-Time Provenance

### State Hash Algorithm
$H_{\text{state}}$ is computed via SHA-256 over a canonical JSON serialization of `DigitalTwinState`:
- **Excluded Volatile Metadata**: Excludes `generatedAt`, `correlationId`, `requestId`, `executionTimeMs`, `snapshotId`.
- **Deterministic Key & Array Ordering**: Object keys sorted alphabetically; member, asset, and policy arrays sorted by entity ID.
- **Result**: Identical underlying financial facts generate identical `stateHash` across independent requests and threads.

---

## 6. Fiduciary Audit & Deduplication

- Every state hydration is associated with an active `CorrelationContext.getCorrelationId()`.
- Publishes `DIGITAL_TWIN_HYDRATED` event to `AuditHookService` which persists an immutable log entry in `ai_audit_trail`.
- **Sanitized Payload**: Sensitive PII and raw portfolio figures are excluded from audit trail logs.
- **Audit Deduplication**: Suppresses redundant audit log writes when hydrated repeatedly within 60 seconds with identical `stateHash` and `asOf` date.

---

## 7. Performance

- **Latency Budget**: p95 $\le 500$ms.
- **Measured Latency**: $\approx 4$ms on real Family 6 dataset (38 assets, 8,005 transactions, graph topology).
