# 🏗 FRONTEND_ARCHITECTURE.md — Frontend Platform Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 5A (Frontend Platform Architecture & UX Design)  
**Date**: July 27, 2026  
**Status**: APPROVED ARCHITECTURE  

---

## 1. Executive Architecture Overview

Family Wealth OS Frontend is designed as a modern, high-performance, single-page application (SPA) built with **React 18**, **Vite**, **TypeScript**, **TanStack Query v5**, **Zustand v4**, and **React Router v6**.

The frontend interacts strictly with **Backend Platform v1.0 REST APIs** (`/api/v1/portfolio/summary`, `/api/v1/dashboard/overview`, `/api/v1/reports/generate`, `/health`) adhering to standard JSON envelopes.

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER (UI)                              |
|  • 9 Core Pages (Dashboard, Portfolio, Holdings, Details, Perf, Analytics, etc.)  |
|  • Atomic Component Library (MetricCard, PortfolioCard, HoldingTable, Charts)     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           APPLICATION & STATE LAYER                               |
|  • Client UI State (Zustand): Active Family, Currency Preference, Selected Tab    |
|  • Server State Cache (TanStack Query): Automatic Background Refetch, Stale-Time  |
|  • Navigation & Routing (React Router v6): Suspense Skeletons & Route Guards       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                             API CONSUMPTION LAYER                                 |
|  • Typed Axios API Client with Correlation Header Injection (X-Correlation-ID)    |
|  • API-001 (Portfolio Summary) • API-002 (Dashboard Overview) • API-003 (Reports) |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack & Decision Matrix

| Technology | Selection | Version | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^18.3.0` | Declarative, component-based UI rendering with concurrent features |
| **Build Tool** | Vite | `^5.2.0` | Ultra-fast HMR and optimized Rollup production bundler |
| **Language** | TypeScript | `^5.4.5` | Strict end-to-end type safety matching backend DTO interfaces |
| **Data Fetching** | TanStack Query | `^5.28.0` | Declarative server-state caching, automatic refetching, & stale management |
| **Client State** | Zustand | `^4.5.2` | Minimalist, unopinionated atomic store for global UI preferences |
| **Routing** | React Router | `^6.22.0` | Declarative nested routing with dynamic code-splitting (`React.lazy`) |
| **Styling** | Vanilla CSS / CSS Modules | Standard | CSS Variables, HSL color tokens, dark-mode glassmorphism, responsive grid |
| **Charts** | Recharts | `^2.12.0` | SVG-based responsive charting library tailored for financial dashboards |
| **Icons** | Lucide React | `^0.368.0` | Crisp, scalable SVG icons |

---

## 3. API Consumption & Data Pipeline

Frontend API clients wrap `axios` with interceptors injecting `X-Correlation-ID` headers for end-to-end request tracing:

```typescript
// frontend/src/services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = `gui_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  return config;
});
```
