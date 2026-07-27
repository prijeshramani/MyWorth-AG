# 🌱 GRAPH_SEED_GUIDE.md — Relationship Seed Loader Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6B.0  
**Date**: July 27, 2026  
**Status**: APPROVED SEED GUIDE  

---

## 1. Idempotent Seeding Protocol

The `KnowledgeGraphSeedLoader` executes at backend initialization:
1. Verifies `relationship_types` table existence.
2. Performs `INSERT OR IGNORE` for baseline codes (`OWNS`, `JOINT_OWNER`, `NOMINEE`, `BENEFICIARY`, `INSURED`, `POLICY_HOLDER`, `DEPENDENT`, `GUARDIAN`, `PARENT_OF`, `CHILD_OF`, `SPOUSE_OF`, `DOCUMENT_FOR`, `TAX_PROFILE_OF`, `ACCOUNT_HOLDER`).
3. Future Estate, Trust, and Will relationship codes can be added via seed configuration without schema changes.
