# 📡 OFFLINE_BEHAVIOR_STRATEGY.md — Offline Behavior & Stale Data Strategy

**System Name**: Family Wealth OS  
**Phase**: Phase 5B-1  
**Date**: July 27, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Local-First Caching Strategy

Family Wealth OS adopts a **Stale-While-Revalidate (SWR)** caching policy powered by TanStack Query and IndexedDB persistence:

- **Offline Support**: When internet/API connectivity is lost, the frontend displays cached portfolio snapshots with a subtle `"Offline Cached Data"` indicator badge.
- **Background Refetch**: Automatically background refetches portfolio valuations when network connectivity is restored.
