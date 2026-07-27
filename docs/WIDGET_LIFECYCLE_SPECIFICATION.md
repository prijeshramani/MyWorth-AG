# 🔄 WIDGET_LIFECYCLE_SPECIFICATION.md — Dashboard Widget Lifecycle & Refresh Policies

**System Name**: Family Wealth OS  
**Phase**: Phase 5B-2 (Documentation Enhancement)  
**Date**: July 27, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Widget Lifecycle Phases

All modular dashboard widgets move through 5 distinct lifecycle phases:

```
[INITIALIZE] ➔ [LOADING] ➔ [SUCCESS] ➔ [REFRESH] ➔ [DISPOSE]
```

1. **`INITIALIZE`**: Mounts widget component, registers event listeners, loads cached local storage preferences.
2. **`LOADING`**: Displays standardized skeleton placeholder matching exact widget panel dimensions.
3. **`SUCCESS`**: Renders data visualization, updates timestamp badge, caches snapshot.
4. **`REFRESH`**: Executes background refetch on manual trigger or stale interval without tearing down DOM nodes.
5. **`DISPOSE`**: Unmounts widget, cancels active background queries, cleans up timers.

---

## 2. Refresh Policies

- **Stale-Time Refresh**: Background revalidation every 5 minutes.
- **Manual User Refresh**: Instant pull-to-refresh / button click re-trigger.
- **Window Focus Refetch**: Disabled by default for quiet financial dashboard monitoring.
