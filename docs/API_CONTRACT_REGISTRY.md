# 📜 API_CONTRACT_REGISTRY.md — REST API Contract Registry

**System Name**: Family Wealth OS  
**Phase**: Sprint 6B (REST API Layer Architecture & Implementation)  
**Date**: July 27, 2026  
**Status**: APPROVED ARCHITECTURE & IMPLEMENTATION  

---

## 1. API Contract Registry

| API ID | Method | Endpoint Path | Description | Controller |
| :--- | :--- | :--- | :--- | :--- |
| **API-001** | `GET` | `/api/v1/portfolio/summary` | Consolidated family portfolio summary, net worth, XIRR, analytics & risk | `PortfolioController` |
| **API-002** | `GET` | `/api/v1/dashboard/overview` | Top-level family wealth dashboard, total wealth, asset breakdown & alerts | `DashboardController` |
| **API-003** | `POST` | `/api/v1/reports/generate` | Generates portfolio summary and tax export report workflows | `ReportingController` |

---

## 2. Standardized Response Envelope Model

Every REST API endpoint returns a standardized JSON response envelope:

```typescript
export interface StandardResponseEnvelope<T> {
  success: boolean;
  data?: T;
  metadata: {
    snapshotId?: string;
    calculationManifestId?: string;
    executionTimeMs: number;
    apiVersion: string;
  };
  correlationId: string;
  warnings: Array<{ code: string; message: string }>;
  errors: Array<{ code: string; category: string; message: string; timestamp: string }>;
}
```

---

## 3. Standardized Error Contract

```typescript
export interface StandardApiErrorResponse {
  success: false;
  metadata: {
    executionTimeMs: number;
    apiVersion: string;
  };
  correlationId: string;
  warnings: [];
  errors: Array<{
    code: string;        // e.g. 'VALIDATION_ERROR', 'NOT_FOUND'
    category: string;    // e.g. 'CLIENT_ERROR', 'SERVER_ERROR'
    message: string;
    timestamp: string;  // ISO 8601
  }>;
}
```

---

## 4. Future Pagination Strategy (Documentation Only)

- **Cursor-Based Pagination**: Supports `limit` and `cursor` query parameters for high-cardinality transaction endpoints.
- **Filtering & Sorting**: Supports `sort_by` (e.g. `date`, `amount`) and `order` (`asc`, `desc`).
