# 📖 OPENAPI_SPECIFICATION.md — OpenAPI 3.0 REST API Specification

**System Name**: Family Wealth OS  
**Phase**: Sprint 6B  
**Version**: 1.0.0  
**Status**: APPROVED SPECIFICATION  

---

```yaml
openapi: 3.0.3
info:
  title: Family Wealth OS REST API
  description: High-performance financial OS REST API for multi-entity family wealth consolidation, valuation, performance, analytics, and risk intelligence.
  version: 1.0.0
servers:
  - url: http://localhost:5000/api/v1
    description: Local Development Server

paths:
  /portfolio/summary:
    get:
      summary: API-001 - Get Consolidated Family Portfolio Summary
      parameters:
        - name: familyId
          in: query
          required: true
          schema:
            type: integer
          example: 1
        - name: asOfDate
          in: query
          required: false
          schema:
            type: string
            format: date
          example: "2026-07-27"
        - name: reportingCurrency
          in: query
          required: false
          schema:
            type: string
          example: "INR"
        - name: includeRiskMetrics
          in: query
          required: false
          schema:
            type: boolean
          example: true
      responses:
        '200':
          description: Consolidated portfolio summary retrieved successfully.
        '400':
          description: Invalid request parameters.
        '404':
          description: Family not found.

  /dashboard/overview:
    get:
      summary: API-002 - Get Family Wealth Dashboard Overview
      parameters:
        - name: familyId
          in: query
          required: true
          schema:
            type: integer
          example: 1
      responses:
        '200':
          description: Dashboard overview retrieved successfully.

  /reports/generate:
    post:
      summary: API-003 - Generate Wealth & Tax Report Workflow
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [familyId, reportType, format]
              properties:
                familyId:
                  type: integer
                reportType:
                  type: string
                  enum: [PORTFOLIO_SUMMARY, TAX_STATEMENT, PERFORMANCE_REPORT]
                format:
                  type: string
                  enum: [JSON, CSV, PDF]
      responses:
        '200':
          description: Report generation workflow triggered successfully.
```
