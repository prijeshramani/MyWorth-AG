# 🔒 API_SECURITY_GUIDE.md — Developer API Security Guide

**System Name**: Family Wealth OS  
**Phase**: Sprint 6C  
**Date**: July 27, 2026  
**Status**: APPROVED SECURITY GUIDE  

---

## 1. Security Header Enforcement

All API controllers and routes must inherit security header policies defined in `helmetSecurityMiddleware`:

- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY`
- `X-XSS-Protection`: `1; mode=block`
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains`

---

## 2. Input Validation & Parameter Sanitization

1. **Numeric Parameters**: Validate that parameters such as `familyId` are numbers before executing database queries.
2. **ISO Date Formatting**: Enforce strict ISO date format (`YYYY-MM-DD`).
3. **Payload Size Guard**: Restrict JSON body inputs to `1MB`.
