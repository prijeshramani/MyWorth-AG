# 🔌 API_MIGRATION_PLAN.md — REST API Evolution Strategy

**System Name**: Family Wealth OS  
**Author**: Lead Software Engineer & Software Architect  
**Date**: July 25, 2026  
**Status**: Target Specification (Sprint 0.5)

---

## 1. Executive Summary

The REST API migration transitions legacy endpoints (`/api/*`) to a structured, versioned API (`/api/v1/*`). Existing endpoints are preserved or modified with backward-compatible defaults, while new endpoints are introduced to support Multi-Entity Family Management, Tax Lot analytics, Goals, Investment Theses, and AI Advisor services.

---

## 2. Endpoint Migration Matrix

| Existing Endpoint | Action | Target Versioned Endpoint | Rationale & Changes |
| :--- | :--- | :--- | :--- |
| `GET /health` | **KEEP** | `GET /health` | Retain as system liveness check. |
| `GET /api/dashboard` | **MODIFY** | `GET /api/v1/dashboard` | Support optional query params `?entityId=` and `?familyMemberId=` to scope net worth KPIs. |
| `GET /api/assets` | **MODIFY** | `GET /api/v1/assets` | Add `entityId` filtering and return associated portfolio metadata. |
| `POST /api/assets` | **MODIFY** | `GET /api/v1/assets` | Require `portfolio_id` or `entity_id` in body payload. |
| `DELETE /api/assets/:id` | **KEEP** | `DELETE /api/v1/assets/:id` | Retain cascading deletion behavior. |
| `GET /api/assets/:id/prices`| **KEEP** | `GET /api/v1/assets/:id/prices` | Retain historical price array retrieval. |
| `POST /api/assets/:id/prices`| **KEEP** | `POST /api/v1/assets/:id/prices`| Retain manual price recording. |
| `GET /api/transactions` | **MODIFY** | `GET /api/v1/transactions` | Add filtering by `entityId`, `taxLotId`, and `dateRange`. |
| `POST /api/transactions` | **MODIFY** | `POST /api/v1/transactions` | Require `entity_id` and automatically trigger FIFO tax lot assignment on BUYs. |
| `POST /api/transactions/manual`| **MODIFY** | `POST /api/v1/transactions/manual`| Include `entity_id` in asset creation payload. |
| `DELETE /api/transactions/:id`| **KEEP** | `DELETE /api/v1/transactions/:id`| Retain transaction deletion. |
| `GET /api/cashflow` | **MODIFY** | `GET /api/v1/cashflow` | Filter cashflow metrics by bank account and entity. |
| `POST /api/import/parse` | **MODIFY** | `POST /api/v1/import/parse` | Retain parser logic; return staging result with entity matching options. |
| `POST /api/import/confirm` | **MODIFY** | `POST /api/v1/import/confirm` | Ingest transactions tagged with selected entity ID. |
| `POST /api/sync` | **KEEP** | `POST /api/v1/sync` | Retain market sync trigger. |
| `GET /api/sync/logs` | **KEEP** | `GET /api/v1/sync/logs` | Retain sync audit logs. |

---

## 3. New API Endpoints Required

### 3.1 Family & Entity Management (`/api/v1/family`, `/api/v1/entities`)
- `GET /api/v1/family`: Retrieve family details and list of family members.
- `POST /api/v1/family/members`: Create a new family member (Self, Spouse, Child).
- `GET /api/v1/entities`: Retrieve all entities (Personal, HUF, Minor) across the family.
- `POST /api/v1/entities`: Create a new legal/tax entity.
- `GET /api/v1/accounts`: Retrieve financial accounts mapped by entity.

### 3.2 Tax & Capital Gains (`/api/v1/tax`)
- `GET /api/v1/tax/lots?assetId=123`: Retrieve active purchase tax lots (FIFO) for an asset.
- `GET /api/v1/tax/gains?financialYear=2026-2027`: Calculate realized STCG and LTCG capital gains.

### 3.3 Goals & Retirement (`/api/v1/goals`)
- `GET /api/v1/goals`: List all financial goals and progress metrics.
- `POST /api/v1/goals`: Create a new financial goal.
- `POST /api/v1/goals/simulate-retirement`: Execute Monte Carlo retirement corpus projection.

### 3.4 Investment Thesis & Decision Journal (`/api/v1/decisions`)
- `GET /api/v1/decisions/thesis?assetId=123`: Fetch investment rationale for an asset.
- `POST /api/v1/decisions/thesis`: Log a new investment thesis (Buy/Sell rationale).
- `GET /api/v1/decisions/journal`: Retrieve quarterly decision logs.
- `POST /api/v1/decisions/journal`: Create a decision journal entry.

### 3.5 AI Personal CFO Advisor (`/api/v1/advisor`)
- `POST /api/v1/advisor/recommendations`: Synthesize current asset allocation, rules from `config/*.json`, and `Investment_Constitution.md` to return structured AI advice.
- `GET /api/v1/advisor/context`: View current prompt context sent to the AI engine.

---

## 4. API Standardization Standards
1. **Response Envelope**: All API responses follow a standard JSON envelope:
   ```json
   {
     "success": true,
     "data": { ... },
     "error": null,
     "timestamp": "2026-07-25T11:45:00.000Z"
   }
   ```
2. **Error Format**: All errors return structured error codes:
   ```json
   {
     "success": false,
     "data": null,
     "error": {
       "code": "ENTITY_NOT_FOUND",
       "message": "Specified entity ID does not exist.",
       "details": []
     },
     "timestamp": "2026-07-25T11:45:00.000Z"
   }
   ```
