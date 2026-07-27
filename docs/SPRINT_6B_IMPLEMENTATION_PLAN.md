# 📋 SPRINT_6B_IMPLEMENTATION_PLAN.md — Sprint 6B Execution Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 6B (REST API Layer Architecture & Implementation Plan)  
**Date**: July 27, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Scope

Implement the **REST API Layer** under `backend/src/middleware/`, `backend/src/controllers/`, `backend/src/routes/`, and `backend/src/app.ts`. Build Express controllers, correlation ID middleware, request validation middleware, standard error handling middleware, and request telemetry logging middleware.

> [!IMPORTANT]
> - **Architecture Version 2 Compliant**: Preserves application services, calculation engines, and repository layer.
> - **Zero Schema / Engine Mutations**: Communicates with existing `PortfolioApplicationService`, `DashboardApplicationService`, and `ReportingApplicationService`.
> - **100% Backward Compatibility**: All 101 existing unit tests must pass cleanly alongside new REST API endpoint tests.

---

## 2. Proposed Implementation Components

### Component 1 — Express Middleware (`backend/src/middleware/`)
- `correlationIdMiddleware.ts`: Assigns or extracts `X-Correlation-ID` header.
- `requestLoggingMiddleware.ts`: Telemetry logging of incoming requests & latencies.
- `validationMiddleware.ts`: Validates request query parameters & body payloads.
- `errorHandlerMiddleware.ts`: Formats errors into standard `StandardApiErrorResponse` envelopes.

### Component 2 — Express Controllers (`backend/src/controllers/`)
- `PortfolioController.ts`: Wraps `portfolioApplicationService.getConsolidatedPortfolio`.
- `DashboardController.ts`: Wraps `dashboardApplicationService.getDashboardOverview`.
- `ReportingController.ts`: Wraps `reportingApplicationService.generateReport`.

### Component 3 — Express Routes & App (`backend/src/routes/` & `backend/src/app.ts`)
- `portfolioRoutes.ts`, `dashboardRoutes.ts`, `reportingRoutes.ts`, `index.ts`.
- `app.ts`: Express application builder exposing HTTP routes and middlewares.

### Component 4 — Automated Tests (`backend/src/__tests__/runTests.ts`)
- Add section 18 testing:
  - `GET /api/v1/portfolio/summary` (API-001) returning 200 OK + standard envelope
  - `GET /api/v1/dashboard/overview` (API-002) returning 200 OK
  - `POST /api/v1/reports/generate` (API-003) returning 200 OK
  - Error middleware handling for missing parameter (400 Bad Request) and missing family (404 Not Found)
  - Correlation ID header propagation (`X-Correlation-ID`)
  - All existing 101 unit tests passing cleanly

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (101 existing + new REST API tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
