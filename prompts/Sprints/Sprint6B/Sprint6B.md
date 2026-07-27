# Sprint 6B – REST API Layer (Architecture + Implementation)

Architecture Review Board Status:

Sprint 6A Implementation APPROVED.

Phase 4 COMPLETE.

--------------------------------------------------

Objective

Implement the REST API Layer for Family Wealth OS.

This sprint includes both Architecture and Implementation because the transport layer is well understood.

Do NOT modify Financial Engines.

Do NOT modify Repository Layer.

Do NOT modify Application Services.

--------------------------------------------------

Read:

1. SESSION_CONTEXT.md
2. AI_CHANGELOG.md
3. Architecture v2 Review
4. Application Service Layer documentation
5. Sprint 6A Retrospective

--------------------------------------------------

Implement

Express Controllers

- PortfolioController
- DashboardController
- ReportingController

Middleware

- Request Validation
- CorrelationId Middleware
- Error Handling Middleware
- Request Logging Middleware

Documentation

- OpenAPI / Swagger
- API Contract Registry

Endpoints

GET /api/v1/portfolio/summary
GET /api/v1/dashboard/overview
POST /api/v1/reports/generate

Response Model

Every response should support:

{
  success,
  data,
  metadata,
  correlationId,
  warnings,
  errors
}

--------------------------------------------------

Documentation Enhancements

1. API Contract Registry

Document API IDs:

API-001 Portfolio Summary

API-002 Dashboard Overview

API-003 Report Generation

--------------------------------------------------

2. Standard Error Contract

Document

ErrorCode

Category

Message

CorrelationId

Timestamp

--------------------------------------------------

3. Standard Response Metadata

Document

SnapshotId

CalculationManifestId

ExecutionTime

API Version

--------------------------------------------------

4. Future Pagination Strategy

Document

Cursor Pagination

Filtering

Sorting

Documentation only.

--------------------------------------------------

Rules

- Preserve Architecture v2
- Preserve Application Services
- Preserve Financial Engines
- Preserve Repository Layer
- No authentication yet
- No authorization yet

--------------------------------------------------

Update

- SESSION_CONTEXT.md
- AI_CHANGELOG.md
- Sprint 6B Implementation Summary
- Sprint 6B Retrospective

Deliver:

1. Test Results
2. API Coverage
3. Swagger Summary
4. Performance Metrics
5. Exactly ONE recommendation before Sprint 6C.