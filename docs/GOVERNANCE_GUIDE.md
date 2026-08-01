# Platform Governance Guide

## Overview
FamilyWealthOS enforces strict platform governance. All architectural changes, security policies, API conventions, and sprint release notes are maintained in `governance/`, `product/`, and `ROADMAP.md`.

---

## Governance Rules
1. Every sprint update must update `ROADMAP.md`, `CAPABILITIES.md`, `governance/DECISIONS.md`, `product/RELEASE_NOTES.md`, `AI_CHANGELOG.md`, and `SESSION_CONTEXT.md`.
2. All executable actions must be registered in `AIActionRegistry` with explicit preconditions, permissions, and rollback strategies.
