# Sprint 1D – Transaction Engine Foundation

## Context

Architecture Version 1.0 is frozen.

Do not modify the core domain model.

Do not redesign repositories.

Do not redesign services.

The objective is to introduce the first Financial Engine.

--------------------------------------------------

Before implementation read:

1. .ai/SESSION_CONTEXT.md
2. docs/Architecture_v1.0.md
3. docs/Transaction_Ownership_Design.md
4. docs/SYSTEM_ARCHITECTURE.md
5. docs/DATA_MODEL.md
6. docs/ARCHITECTURE_DECISIONS.md
7. docs/developer_handbook/*
8. docs/Post_PreSprint1D_Architecture_Recommendations.md

--------------------------------------------------

Objective

Implement the Transaction Engine foundation.

The engine is responsible only for transaction processing and holding-level financial state.

It must NOT calculate:

- XIRR
- Net Worth
- Capital Gains
- Goal Planning
- Analytics
- Asset Allocation

--------------------------------------------------

Create

backend/src/engines/common/

Containing:

- IFinancialEngine.ts
- EngineContext.ts
- EngineResult.ts
- EngineErrors.ts
- EngineRegistry.ts

These become the shared infrastructure for all future financial engines.

--------------------------------------------------

Create

TransactionEngine

Responsibilities:

- Validate transaction sequence
- Validate holding ownership
- Detect oversell conditions
- Maintain running quantity
- Maintain average cost basis
- Produce normalized transaction output
- Emit warnings where business rules are violated
- Be deterministic and idempotent

--------------------------------------------------

Requirements

- Follow the shared Engine contract.
- Keep business rules separate from repositories.
- Do not duplicate repository logic.
- Support future corporate actions without redesign.
- Be fully unit tested.
- Do not change existing APIs unless required.
- Preserve backward compatibility.

--------------------------------------------------

Deliverables

- Engine implementation
- Engine unit tests
- Updated documentation
- Updated SESSION_CONTEXT.md
- Updated AI_CHANGELOG.md
- Sprint Retrospective.md

--------------------------------------------------

At the end provide:

1. Engine architecture summary
2. Test results
3. Risks
4. Performance considerations
5. Exactly ONE recommendation for Sprint 2