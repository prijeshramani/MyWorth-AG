# 🚀 LOCAL_SETUP_GUIDE.md — One-Command Local Setup & Onboarding Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 7B.0 (Developer Experience, Local Onboarding & Beta Readiness)  
**Date**: July 28, 2026  
**Status**: APPROVED LOCAL SETUP GUIDE  

---

## 1. Quick Start Guide

FamilyWealthOS supports seamless local setup for developers and personal usage with Indian financial data:

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Reset database & apply migrations 001-011
cd backend && npm run db:reset

# 3. Launch dev servers
npm run dev
```
