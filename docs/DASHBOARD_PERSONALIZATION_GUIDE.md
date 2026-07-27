# 🎨 DASHBOARD_PERSONALIZATION_GUIDE.md — Dashboard Layout Personalization

**System Name**: Family Wealth OS  
**Phase**: Phase 5B-1  
**Date**: July 27, 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. User Layout Personalization Rules

Dashboard layouts can be customized per user/family profile via local storage and Zustand state persistence:

- **Widget Drag & Drop Ordering**: Users can rearrange dashboard widget cards.
- **Widget Visibility Toggle**: Enable or disable specific widgets (e.g. hide Risk Alert panel for simplified view).
- **Default Currency Preference**: Save default currency (`INR` vs `USD`).
- **Persistence Storage**: Saved in `localStorage` under `myworth_dashboard_layout_v1`.
