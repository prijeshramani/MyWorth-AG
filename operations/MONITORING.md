# Monitoring & Telemetry Guide

## Overview
Monitoring policies and metrics collection for FamilyWealthOS Observability Platform.

---

## Tracked Metrics
- **API Latency**: Response times for `/api/v1/*` endpoints (Target: < 200ms).
- **AI Latency**: Skills execution and multi-skill pipeline generation time (Target: < 1,500ms).
- **Database Performance**: Query latency and SQLite WAL checkpoint times.
- **Cache Performance**: Hit/Miss ratios for price repository and rule engine cache.
- **Context Build Time**: `AIContextAggregator` execution duration (Target: < 300ms).
- **Simulation Time**: `WhatIfSimulationEngine` 4-scenario projection time (Target: < 500ms).
- **Error Rates**: HTTP 5xx errors and unhandled exception counts.

---

## Health Endpoints
- `GET /api/v1/dx/health`: DX controller system health DTO.
- `GET /api/v1/platform/observability`: Real-time latency and error metrics.
- `GET /api/v1/platform/production-readiness`: Overall readiness score.
