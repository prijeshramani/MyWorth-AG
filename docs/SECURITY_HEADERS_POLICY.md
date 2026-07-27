# 🔒 SECURITY_HEADERS_POLICY.md — Security Headers & CSP Policy

**System Name**: Family Wealth OS  
**Phase**: Sprint 6D  
**Date**: July 27, 2026  
**Status**: APPROVED SECURITY POLICY  

---

## 1. Security HTTP Headers Policy

Family Wealth OS enforces the following mandatory HTTP security headers across all API endpoints and Swagger documentation interfaces:

1. **`X-Content-Type-Options: nosniff`**: Prevents browser MIME-sniffing attacks.
2. **`X-Frame-Options: DENY`**: Mitigates clickjacking attacks by disallowing iframe embedding.
3. **`X-XSS-Protection: 1; mode=block`**: Enables browser cross-site scripting filters.
4. **`Strict-Transport-Security: max-age=31536000; includeSubDomains`**: Enforces HTTPS connections.
5. **`Content-Security-Policy: default-src 'self'`**: Prevents unauthorized external script execution.
6. **`Referrer-Policy: strict-origin-when-cross-origin`**: Controls referrer header leakage.
