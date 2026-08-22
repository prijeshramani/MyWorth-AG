# 💡 API_EXAMPLES.md — API Request & Response Examples

**System Name**: Family Wealth OS  
**Phase**: Sprint 6D  
**Date**: July 27, 2026  
**Status**: APPROVED EXAMPLES DOCUMENT  

---

## 1. API-001: Consolidated Family Portfolio Summary

### Request
`GET /api/v1/portfolio/summary?familyId=${activeFamilyId}&includeRiskMetrics=true`

Headers:
`X-Correlation-ID: req_9901_test`

### Successful Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "data": {
    "familyId": 1,
    "familyName": "Sharma Family",
    "asOfDate": "2026-07-27",
    "reportingCurrency": "INR",
    "netWorth": {
      "totalMarketValue": 10350000.5,
      "totalCostBasis": 8280000.4,
      "unrealizedGain": 2070000.1,
      "unrealizedGainPercent": 25,
      "formattedTotalMarketValue": "₹1,03,50,000.50",
      "formattedTotalCostBasis": "₹82,80,000.40",
      "formattedUnrealizedGain": "₹20,70,000.10"
    },
    "analytics": {
      "diversificationScore": 85.5,
      "healthRating": "HEALTHY",
      "topSector": "Technology"
    },
    "risk": {
      "annualizedVolatilityPercent": 14.5,
      "maxDrawdownPercent": 12.7,
      "sharpeRatio": 1.15,
      "sortinoRatio": 1.82,
      "riskRating": "MODERATE"
    },
    "masterChecksum": "c71092a88102f901192837162534485960718293049586716253448596071829"
  },
  "metadata": {
    "snapshotId": "master_snap_c71092a8",
    "calculationManifestId": "c71092a88102f901192837162534485960718293049586716253448596071829",
    "executionTimeMs": 10.5,
    "apiVersion": "v1.0"
  },
  "correlationId": "req_9901_test",
  "warnings": [],
  "errors": []
}
```

---

## 2. API Validation Error Example

### Request
`GET /api/v1/portfolio/summary` (Missing `familyId`)

### Error Response (`HTTP 400 Bad Request`)
```json
{
  "success": false,
  "metadata": {
    "executionTimeMs": 1.2,
    "apiVersion": "v1.0"
  },
  "correlationId": "req_err_1001",
  "warnings": [],
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "category": "CLIENT_ERROR",
      "message": "Query parameter \"familyId\" is required and must be a valid number",
      "timestamp": "2026-07-27T13:30:00.000Z"
    }
  ]
}
```
