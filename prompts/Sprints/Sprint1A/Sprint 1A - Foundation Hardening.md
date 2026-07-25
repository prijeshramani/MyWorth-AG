# Sprint 1A - Foundation Hardening

## Objective

Begin the first implementation sprint.

This sprint focuses ONLY on strengthening the application's technical foundation.

Do NOT implement Family entities, Goals, AI Advisor, or any new business features.

The objective is to prepare the existing codebase for future evolution while preserving current functionality.

--------------------------------------------------

Before making any changes:

1. Read:
   - .ai/SESSION_CONTEXT.md
   - docs/PROJECT_CHARTER.md
   - docs/TARGET_ARCHITECTURE.md
   - docs/developer_handbook/*
   - docs/ARCHITECTURE_DECISIONS.md

2. Confirm understanding of:
   - Evolution before Replacement
   - Local First
   - Privacy First
   - Repository Pattern
   - Configuration over Hardcoding

--------------------------------------------------

Tasks

### Phase 1 – Security Hardening

- Restrict Express binding to localhost only.
- Replace wildcard CORS with explicit localhost origins.
- Identify all stored credentials.
- Implement an encryption service (AES-256-GCM as defined in the handbook).
- Ensure sensitive data is never logged.

### Phase 2 – Repository Layer

- Create repository interfaces for existing modules.
- Extract SQL from controllers into repositories.
- Preserve all existing functionality.
- Do not change business logic.

### Phase 3 – Error Handling

- Introduce centralized AppError hierarchy.
- Implement global Express error middleware.
- Standardize API response envelopes.

### Phase 4 – Logging

- Introduce structured logging.
- Apply sensitive data masking.
- Add correlation IDs where appropriate.

### Phase 5 – Testing

- Add unit tests for repository layer.
- Add regression tests proving no functionality changed.
- Verify existing features still work.

--------------------------------------------------

Deliverables

- Updated code
- Unit tests
- Documentation updates
- Updated .ai/SESSION_CONTEXT.md
- Updated AI_CHANGELOG.md (if decisions changed)

--------------------------------------------------

Rules

- Do not modify database schema.
- Do not change UI.
- Do not implement new financial features.
- Preserve backward compatibility.
- Follow Definition of Done before considering the sprint complete.

At the end of the sprint, provide:

1. Implementation summary
2. Files modified
3. Risks encountered
4. Test results
5. Exactly ONE recommendation for Sprint 1B