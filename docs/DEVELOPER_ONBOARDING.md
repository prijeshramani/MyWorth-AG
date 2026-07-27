# 🚀 DEVELOPER_ONBOARDING.md — Developer Onboarding & Portal Guide

**System Name**: Family Wealth OS  
**Phase**: Sprint 6D (Developer Experience Platform)  
**Date**: July 27, 2026  
**Status**: APPROVED ONBOARDING GUIDE  

---

## 1. Welcome to Family Wealth OS

Family Wealth OS is an enterprise-grade, local-first personal and family wealth management backend platform built on TypeScript, Node.js, Express, and SQLite.

### Platform Highlights
- **6 Pure Financial Engines**: `TransactionEngine`, `ValuationEngine`, `NetWorthEngine`, `PerformanceEngine`, `PortfolioAnalyticsEngine`, `RiskEngine`.
- **4-Level Domain Hierarchy**: **Family -> Family Member -> Entity -> Account -> Holdings**.
- **Cryptographic Auditability**: Every engine execution generates verifiable SHA-256 calculation manifest hashes.
- **REST API Endpoints**: `/api/v1/portfolio/summary`, `/api/v1/dashboard/overview`, `/api/v1/reports/generate`.
- **Observability & Health Probes**: `/health`, `/health/liveness`, `/health/readiness`.
- **Interactive API Docs**: `/api-docs` (Swagger UI).

---

## 2. Quick Start Guide

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher

### Local Development Setup
```bash
# 1. Clone repository
git clone https://github.com/myworth/family-wealth-os.git
cd family-wealth-os/backend

# 2. Install dependencies
npm install

# 3. Build TypeScript codebase
npm run build

# 4. Run automated unit test suite (129+ tests)
npm test

# 5. Start local development server
npm run dev
```

The API server will listen on `http://localhost:5000`. Interactive Swagger UI documentation is available at `http://localhost:5000/api-docs`.
