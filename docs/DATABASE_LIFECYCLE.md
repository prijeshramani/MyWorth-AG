# 🗄️ DATABASE_LIFECYCLE.md — Local Database Lifecycle Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 7B.0  
**Date**: July 28, 2026  
**Status**: APPROVED DATABASE LIFECYCLE GUIDE  

---

## 1. NPM Scripts & Lifecycle Commands

```bash
npm run db:reset       # Automatic timestamped backup -> Drop DB -> Run Migrations 001-011 -> Seed baseline reference rules
npm run db:rebuild     # Reset + Seed demo portfolios & holdings
npm run db:backup      # Create compressed recovery point in data/backups/
npm run db:restore     # Validate integrity (Migration v11, FK check) & restore
npm run db:seed-demo   # Seed demo portfolios
npm run db:seed-empty  # Clean baseline without demo data
```
