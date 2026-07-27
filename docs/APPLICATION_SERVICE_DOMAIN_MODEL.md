# 📊 APPLICATION_SERVICE_DOMAIN_MODEL.md — Application Service Domain Model

**System Name**: Family Wealth OS  
**Phase**: Sprint 6A (Final ARB Integration)  
**Date**: July 27, 2026  
**Status**: APPROVED ARCHITECTURE (ARB ENHANCED)  

---

## 1. Executive Overview & Service Hierarchy

The Application Service Layer acts as the orchestrator of Family Wealth OS, bridging external interface controllers (REST, GraphQL, AI CFO Agent) with internal pure financial engines (`TransactionEngine`, `ValuationEngine`, `NetWorthEngine`, `PerformanceEngine`, `PortfolioAnalyticsEngine`, `RiskEngine`) and SQLite repositories.

```
+-----------------------------------------------------------------------------------+
|                        EXTERNAL INTERFACES (API / UI / AI)                        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                         APPLICATION SERVICE LAYER (SERVICES)                      |
|  • PortfolioApplicationService   • DashboardApplicationService                    |
|  • SnapshotCoordinator           • ImportApplicationService                       |
|  • ReportingApplicationService   • DTO Mappers                                    |
+-----------------------------------------------------------------------------------+
                   │                                     │
                   ▼                                     ▼
+------------------------------------+   +------------------------------------+
|         SQLITE REPOSITORIES        |   |        PURE FINANCIAL ENGINES       |
|  (Data Persistence & Fetching)     |   |    (Stateless Computation Layer)   |
+------------------------------------+   +------------------------------------+
```

---

## 2. ARB Architectural Enhancements (Documentation Only)

### A. `ApplicationExecutionContext`
```typescript
export interface ApplicationExecutionContext {
  correlationId: string;
  userContext: {
    userId: string;
    familyId: number;
    roles: string[];
  };
  reportingCurrency: string; // e.g. 'INR', 'USD'
  asOfDate: string;          // YYYY-MM-DD
  featureFlags?: Record<string, boolean>;
  executionOptions?: {
    bypassCache?: boolean;
    includeRiskMetrics?: boolean;
  };
}
```

### B. Standardized `ApplicationResult<T>` Response Envelope
```typescript
export interface ApplicationExecutionMetadata {
  executionTimeMs: number;
  engineVersion: string;
  snapshotId?: string;
  timestamp: string;
}

export interface ApplicationResult<T> {
  success: boolean;
  data?: T;
  warnings: Array<{ code: string; message: string }>;
  errors: Array<{ code: string; message: string }>;
  metadata: ApplicationExecutionMetadata;
  manifest?: any; // SHA-256 CalculationManifest
  correlationId: string;
}
```

### C. Application Error Taxonomy Model
- **`ValidationError`**: Request payload or parameter validation failure (HTTP 400).
- **`RepositoryError`**: Database query or entity lookup error (HTTP 404 / 500).
- **`EngineError`**: Internal engine calculation exception (HTTP 422).
- **`MappingError`**: DTO mapping or formatting exception (HTTP 500).
- **`OrchestrationError`**: Pipeline sequence execution failure (HTTP 500).

### D. Request Validation Layer Architecture
```
  [HTTP Request]
        │
        ▼
[Request Validator] ── (Passes Validation?) ──► [Application Service]
        │
  (Validation Error)
        │
        ▼
   [HTTP 400 DTO]
```

### E. Idempotency Key Specification
- Supports `X-Idempotency-Key` headers for `ImportApplicationService`, `SnapshotCoordinator`, and `ReportingApplicationService` to guarantee duplicate request safety.

### F. Read / Write Service Separation (CQRS Foundation)
- **Query Services** (`PortfolioApplicationService`, `DashboardApplicationService`, `ReportingApplicationService`): Read-only data orchestration without state mutation.
- **Command Services** (`ImportApplicationService`, `SnapshotCoordinator`): State-mutating data ingestion and snapshot persistence workflows.

---

## 3. Core Service Contracts

```typescript
export interface PortfolioSummaryRequestDTO {
  familyId: number;
  asOfDate?: string;          // YYYY-MM-DD (Default today)
  reportingCurrency?: string; // Default 'INR'
  includeRiskMetrics?: boolean;
}

export interface PortfolioSummaryResponseDTO {
  familyId: number;
  familyName: string;
  asOfDate: string;
  reportingCurrency: string;
  netWorth: {
    totalMarketValue: number;
    totalCostBasis: number;
    unrealizedGain: number;
    unrealizedGainPercent: number;
    formattedTotalMarketValue: string;
    formattedTotalCostBasis: string;
    formattedUnrealizedGain: string;
  };
  performance: {
    absoluteReturnPercent: number;
    cagrPercent: number;
    xirrPercent: number;
  };
  analytics: {
    diversificationScore: number;
    healthRating: string;
    topSector: string;
  };
  masterChecksum: string;
}
```
