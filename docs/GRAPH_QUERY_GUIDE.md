# 🔍 GRAPH_QUERY_GUIDE.md — Graph Query & Traversal Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 6B.0  
**Date**: July 27, 2026  
**Status**: APPROVED QUERY GUIDE  

---

## 1. API Query Endpoints

- `GET /api/v1/graph/overview?familyId=1`: Fetches entire knowledge graph nodes, active edges, and estate readiness metrics.
- `GET /api/v1/graph/person/:id?familyId=1`: Traverses ego-network around a specific person.
- `GET /api/v1/graph/asset/:id?familyId=1`: Returns ownership, nominee, and document linkage tree for an asset.
- `POST /api/v1/graph/relationship`: Connects two nodes with a directed edge.
- `DELETE /api/v1/graph/relationship/:id`: Soft-deletes a relationship edge (marks `status = 'INACTIVE'`).
