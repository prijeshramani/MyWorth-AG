# 📐 COMPONENT_PATTERNS.md — UI Component Design & Loading Patterns

**System Name**: Family Wealth OS  
**Phase**: Phase 5B-1  
**Date**: July 27, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. 3-State Component Pattern

Every data-driven component in Family Wealth OS MUST implement 3 standard visual states:

1. **Loading Skeleton State**: Render animated pulse placeholder skeletons matching exact dimensions.
2. **Empty Data State**: Render clean, informative empty state illustrations with action trigger (e.g. "No Holdings Found — Add Transaction").
3. **Error Fallback State**: Render Inline Error Tile with retry button.

```
┌────────────────────────────────────────────────────────┐
│  State 1: Loading Skeleton (Pulse Animation)           │
├────────────────────────────────────────────────────────┤
│  State 2: Empty Data (Illustration + Call to Action)  │
├────────────────────────────────────────────────────────┤
│  State 3: Error Fallback (Message + Retry Trigger)     │
└────────────────────────────────────────────────────────┘
```
