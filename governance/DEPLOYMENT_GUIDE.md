# Production Deployment & Build Guide

## 1. Local Production Build
```bash
npm run build
```
Compiles backend TypeScript (`tsc`) and bundles frontend assets with Vite.

## 2. Server Startup
```bash
npm run start
```
Launches express server on `http://localhost:5000` and serves static frontend dist on `http://localhost:5173`.
