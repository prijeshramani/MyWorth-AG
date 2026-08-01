# API Design & Interface Standards

## 1. REST Endpoint Conventions
- Endpoint Base: `/api/v1/`
- Resources are pluralized (`/api/v1/assets`, `/api/v1/holdings`, `/api/v1/ai/actions`).
- Standard HTTP Status Codes: `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Server Error`.

## 2. Response Formats
All JSON responses follow structured payload contracts:
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-08-01T12:00:00Z"
}
```
