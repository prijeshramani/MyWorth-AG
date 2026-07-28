# 💾 AI_MEMORY_MODEL.md — AI Multi-Session Memory Model Specification

**System Name**: Family Wealth OS  
**Phase**: Phase 7A  
**Date**: July 28, 2026  
**Status**: APPROVED AI MEMORY MODEL  

---

## 1. Governance & Memory Types

The `ai_memory` table manages multi-session intelligence:
- `PERMANENT`: Long-term user preferences (e.g. Risk Tolerance, Retirement Age Target). Never expires unless deleted by user.
- `SESSION`: Short-term active conversation context (e.g. active holding entity, temporary goal filter).
- `EXPIRING`: Time-sensitive user decisions (e.g. 80C tax optimization snooze for 30 days).
- `USER_REMOVABLE`: Explicitly removable facts or preferences.
