# AI Audit Trail & Decision Journal Specification

## Overview
Every AI action proposal, execution request, user decision, and evidence snapshot is permanently logged in the SQLite `ai_audit_trail` and `ai_decision_journal` tables.

---

## Logged Metrics
- **Audit ID & Action ID**: Unique tracking identifiers.
- **User Decision**: `CONFIRMED`, `REJECTED`, `DISMISSED`, `EXECUTED`, or `UNDONE`.
- **Evidence Snapshot**: Engine calculation versions, rule versions, and evidence items cited.
- **Searchable Decision Journal**: Searchable history linking questions, explanations, simulations, decisions, and completed actions.
