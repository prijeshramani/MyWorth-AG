# 📋 SPRINT_6C_IMPLEMENTATION_PLAN.md — Sprint 6C Execution Plan

**System Name**: Family Wealth OS  
**Phase**: Sprint 6C (Platform Security Foundation & Production Readiness Plan)  
**Date**: July 27, 2026  
**Status**: APPROVED IMPLEMENTATION PLAN  

---

## 1. Goal & Scope

Implement security middlewares, observability health endpoints, CORS origin configuration, Helmet HTTP security headers, IP rate limiting, body size limits, request timeouts, and trusted proxy settings under `backend/src/middleware/`, `backend/src/controllers/`, `backend/src/routes/`, and `backend/src/app.ts`.

> [!IMPORTANT]
> - **Preserve Backend Platform v1.0**: Zero calculation engine or repository mutations.
> - **Zero Login Coding**: Authentication strategy (JWT/RBAC) is documented only.
> - **100% Backward Compatibility**: All 117 existing unit tests must pass cleanly alongside new security & health check tests.

---

## 2. Proposed Implementation Components

### Component 1 — Security Middlewares (`backend/src/middleware/`)
- `helmetSecurityMiddleware.ts`: Attaches security HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`).
- `rateLimiterMiddleware.ts`: IP rate limiting (100 requests per 60s).
- `requestTimeoutMiddleware.ts`: 15s execution timeout handler.

### Component 2 — Health Controller & Observability (`backend/src/controllers/` & `backend/src/routes/`)
- `HealthController.ts`: Exposes `/health`, `/health/liveness`, and `/health/readiness`.
- `healthRoutes.ts`: Mounts health endpoints.

### Component 3 — App Integration (`backend/src/app.ts`)
- Configures CORS origins, body size limit (`1mb`), trusted proxy settings (`app.set('trust proxy', 1)`), security headers, and rate limiting.

### Component 4 — Automated Tests (`backend/src/__tests__/runTests.ts`)
- Add section 19 testing:
  - Security HTTP headers present on responses (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`)
  - Rate limiting behavior & header propagation
  - Body size limit enforcement (HTTP 413 Payload Too Large)
  - `/health`, `/health/liveness`, `/health/readiness` endpoints returning HTTP 200 OK
  - All 117 existing unit tests passing cleanly

---

## 3. Verification Plan

### Automated Tests
1. `npm test` in `backend` (117 existing + new Security & Health tests).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).
