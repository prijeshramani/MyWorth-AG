# 📜 WILL_MANAGEMENT_GUIDE.md — Will & Testament Management Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6B  
**Date**: July 27, 2026  
**Status**: APPROVED WILL GUIDE  

---

## 1. Will Lifecycle & Versioning

The Will Management module tracks:
- **Testator & Executor Roles**: Connected directly to Knowledge Graph `PERSON` nodes.
- **Status Lifecycle**: `DRAFT` ──> `ACTIVE` ──> `REGISTERED` (Sub-Registrar) ──> `REVOKED`.
- **Witnesses**: Primary witness records (`witness1_name`, `witness2_name`).
- **Version Tracking**: `will_versions` table maintains historical versioning summaries and document attachments.
- **Review Reminders**: Periodic review notifications triggered for annual estate updates.
