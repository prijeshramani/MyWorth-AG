# 🔔 GLOBAL_NOTIFICATION_CENTER.md — Global Notification Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 5B-2  
**Date**: July 27, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Notification Architecture

The Global Notification Center delivers real-time toast alerts and persistent notification feed history:

- **Toast System**: Slide-in floating toasts for background export completions, provider price syncs, and network status changes.
- **Alert Levels**: `SUCCESS` (Emerald), `WARNING` (Amber), `ERROR` (Rose), `INFO` (Sky Blue).
- **Persistence**: Saved in Zustand notification store with max 50 items.
