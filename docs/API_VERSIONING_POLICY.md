# 📌 API_VERSIONING_POLICY.md — API Versioning & Lifecycle Policy

**System Name**: Family Wealth OS  
**Phase**: Sprint 6D  
**Date**: July 27, 2026  
**Status**: APPROVED VERSIONING POLICY  

---

## 1. URI Path Versioning Standard

All public REST endpoints are explicitly scoped under major version paths:
`http://localhost:5000/api/v1/...`

---

## 2. API Lifecycle Stages

1. **`STABLE` (Current: v1.0)**: Production-ready endpoints with guaranteed backward compatibility.
2. **`DEPRECATED`**: Endpoints scheduled for removal with minimum 6-month warning header (`Deprecation: true`).
3. **`RETIRED`**: Formally decommissioned endpoints returning `HTTP 410 Gone`.
