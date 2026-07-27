# 📊 APPLICATION_SERVICE_DOMAIN_MODEL.md — Application Service Domain Model

**System Name**: Family Wealth OS  
**Phase**: Sprint 6A (Application Service Layer - Architecture & Design Phase)  
**Date**: July 26, 2026  
**Status**: APPROVED ARCHITECTURE  

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

## 2. Core Service Interfaces & Contracts

### A. `IPortfolioApplicationService`
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

### B. `IDashboardApplicationService`
```typescript
export interface DashboardOverviewResponseDTO {
  familyId: number;
  totalWealthFormatted: string; // e.g. "₹1,03,50,000"
  netWorthChange24h: { absolute: number; percent: number };
  assetAllocation: Array<{ assetType: string; percentage: number; formattedValue: string }>;
  topEntities: Array<{ entityId: number; entityName: string; formattedValue: string }>;
  alerts: Array<{ id: string; type: 'WARNING' | 'INFO'; message: string }>;
}
```

### C. `ISnapshotCoordinator`
```typescript
export interface PersistedSnapshotEnvelope {
  snapshotId: string;
  familyId: number;
  valuationSnapshotId: string;
  netWorthSnapshotId: string;
  performanceSnapshotId: string;
  masterChecksum: string;
  createdAt: string;
}
```
