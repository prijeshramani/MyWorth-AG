# 🛡 SECURITY_ARCHITECTURE.md — Platform Security Architecture

**System Name**: Family Wealth OS  
**Phase**: Sprint 6C (Platform Security Foundation & Production Readiness)  
**Date**: July 27, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Executive Security Architecture

Family Wealth OS enforces defense-in-depth security principles across transport, application, repository, and encryption layers to safeguard sensitive family financial data.

```
+-----------------------------------------------------------------------------------+
|                            PLATFORM SECURITY FOUNDATION                           |
|  • Security Headers (Helmet)     • Rate Limiting (100 req/min)                    |
|  • Request Body Size Limits     • CORS Origin Restriction                        |
|  • Request Timeouts (15s)        • Trusted Proxy Configuration                    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        AUTHENTICATION & AUTHORIZATION STRATEGY                    |
|  • JWT Bearer Token Strategy     • Refresh Token Rotation & Storage               |
|  • Role Model (FAMILY_OWNER, FAMILY_MEMBER, ADVISOR, READ_ONLY)                   |
|  • Resource Scope Controls       • Idempotency Header Enforcement                 |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        ENCRYPTION & STORAGE SECURITY                              |
|  • AES-256-GCM Credential Storage (SQLite Encrypted Credentials Table)            |
|  • SHA-256 Calculation Manifest Hashes (Verifiable Computation Auditability)     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Authentication & Authorization Strategy (Documentation Only)

### A. JWT Bearer Token Specification
```json
{
  "sub": "usr_9001",
  "familyId": 1,
  "role": "FAMILY_OWNER",
  "iat": 1785139696,
  "exp": 1785143296,
  "iss": "family-wealth-os"
}
```

### B. Role-Based Access Control (RBAC) Taxonomy
- **`FAMILY_OWNER`**: Full read/write access to all family entities, members, accounts, and credentials.
- **`FAMILY_MEMBER`**: Read/write access strictly restricted to member's owned accounts and entities.
- **`ADVISOR`**: Read-only portfolio summary, analytics, and risk report access (restricted credential access).
- **`READ_ONLY`**: View-only access to consolidated family dashboards.

---

## 3. Implemented Security Middlewares

1. **Helmet HTTP Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Strict-Transport-Security`.
2. **IP Rate Limiter**: Limits client IPs to 100 requests per 60-second window.
3. **Request Body Size Limit**: Restricts JSON request payloads to a maximum of `1MB` (returns HTTP 413 Payload Too Large).
4. **Request Timeout**: Aborts requests exceeding 15 seconds.
