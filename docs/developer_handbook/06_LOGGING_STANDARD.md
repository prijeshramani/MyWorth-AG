# 📖 06_LOGGING_STANDARD.md — Logging & Audit Standard

**Document Purpose**: Define log levels, structured JSON logging formats, correlation tracing, audit trails, and sensitive data masking rules for Family Wealth OS.  
**Target Audience**: Backend Engineers, Security Auditors, AI Coding Assistants  
**Status**: Active Engineering Standard  

---

## 1. Executive Summary

Logging in Family Wealth OS serves three distinct purposes: diagnostic debugging, performance monitoring, and security audit trails. Because the application handles personal financial transactions and stored API credentials, logging MUST strictly enforce sensitive data masking to prevent accidental credential leakage in local log files.

---

## 2. Log Levels & Usage

| Log Level | Usage Scenario | Production Enabled? |
| :--- | :--- | :--- |
| **`FATAL`** | System crash, unrecoverable database corruption, boot failure. | Yes |
| **`ERROR`** | Operational failure (e.g. statement parsing failed, API call timeout). | Yes |
| **`WARN`** | Recoverable issues (e.g. AMFI price lookup fallback to transaction price). | Yes |
| **`INFO`** | Key operational milestones (e.g. statement ingested, price sync finished). | Yes |
| **`DEBUG`** | Detailed diagnostic data during development. | No (Development only) |
| **`TRACE`** | Granular SQL query execution traces or raw parser character scans. | No (Development only) |

---

## 3. Log Categorization & Structured Format

All logs MUST be formatted as structured JSON containing consistent metadata attributes:

```json
{
  "timestamp": "2026-07-25T12:05:00.123Z",
  "level": "INFO",
  "category": "FINANCIAL_AUDIT",
  "correlationId": "req_8f3a1b2c",
  "message": "Statement transactions ingested successfully.",
  "context": {
    "entityId": "ent_9921",
    "transactionCount": 14,
    "source": "PDF_IMPORT",
    "parser": "CAMS_CAS"
  }
}
```

### Log Categories
1. **`SECURITY_AUDIT`**: Local PIN login attempts, OAuth token refresh events, CORS access rejections.
2. **`FINANCIAL_AUDIT`**: Ingestion of statements, transaction creations, asset deletions, tax lot assignments.
3. **`PERFORMANCE`**: Slow database queries (> 50ms), statement parser execution times.
4. **`SYSTEM`**: Server startup, database schema auto-migrations, health check statuses.

---

## 4. Sensitive Data Masking Standard

The following data fields MUST BE MASKED automatically before writing to any log stream:

| Sensitive Field | Masking Rule | Raw Value | Masked Output |
| :--- | :--- | :--- | :--- |
| **PAN Number** | Keep last 4 chars | `ABCDE1234F` | `******1234F` |
| **Account Number**| Keep last 4 digits | `123456789012` | `********9012` |
| **API Tokens** | Redact completely | `kite_token_abc123` | `[REDACTED_SECRET]` |
| **PDF Passwords** | Redact completely | `my_pdf_pass` | `[REDACTED_SECRET]` |
| **Full Name / DOB**| Mask middle names | `Prijesh Ramani` | `P****** R*****` |

### Masking Utility Implementation Pattern
```typescript
export function maskSensitiveObject(obj: Record<string, any>): Record<string, any> {
  const masked = { ...obj };
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'pan'];

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      masked[key] = '[REDACTED_SECRET]';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveObject(masked[key]);
    }
  }

  return masked;
}
```
