# Implementation Plan — Sprint 1D: Transaction Engine Foundation

Introduce the first **Financial Engine** (`TransactionEngine`) and shared engine infrastructure (`backend/src/engines/common/`) on top of stable Architecture v1.0.

> [!IMPORTANT]
> **Sprint Scope Boundary**:
> - **Architecture Version 1.0 Frozen**: Core domain tables (`families`, `family_members`, `entities`, `accounts`, `holdings`, `assets_master`) and repositories remain 100% UNTOUCHED.
> - **Engine Responsibilities**: Focus is strictly on transaction validation, running quantity calculation, average cost basis calculation, oversell detection, and normalized financial state output.
> - **NO Downstream Engine Logic**: Does NOT compute XIRR, Net Worth, Capital Gains, Goal Planning, Analytics, or Asset Allocation.
> - **100% Backward Compatibility**: All 34 existing unit & regression tests continue passing cleanly.

---

## User Review Required

> [!NOTE]
> **Engine Design & Layer Isolation**:
> Engines are pure, stateless computational modules residing in `backend/src/engines/`. They consume input data via `EngineContext`, execute deterministic calculations, and return a structured `EngineResult<T>`. Services orchestrate workflows and pass repository data into engines; engines do NOT make direct database calls.

---

## Proposed Changes

### Phase 1 — Shared Financial Engine Infrastructure (`backend/src/engines/common/`)

#### [NEW] [IFinancialEngine.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/common/IFinancialEngine.ts)
Generic engine contract interface defining:
```ts
export interface IFinancialEngine<TInput = any, TOutput = any> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  execute(context: EngineContext<TInput>): EngineResult<TOutput>;
}
```

#### [NEW] [EngineContext.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/common/EngineContext.ts)
Standardized input context wrapper for engine execution:
```ts
export interface EngineContext<TData = any> {
  entityId?: number;
  accountId?: number;
  holdingId?: number;
  assetId?: number;
  asOfDate?: string;
  data: TData;
  options?: Record<string, any>;
}
```

#### [NEW] [EngineResult.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/common/EngineResult.ts)
Standardized output wrapper for all financial engines:
```ts
export interface EngineWarning {
  code: string;
  message: string;
  details?: any;
}

export interface EngineError {
  code: string;
  message: string;
  details?: any;
}

export interface EngineResult<T = any> {
  success: boolean;
  data?: T;
  warnings: EngineWarning[];
  errors: EngineError[];
  executionTimeMs: number;
}
```

#### [NEW] [EngineErrors.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/common/EngineErrors.ts)
Structured error definitions (`FinancialEngineError`, `OversellError`, `InvalidSequenceError`, `UnresolvedHoldingError`).

#### [NEW] [EngineRegistry.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/common/EngineRegistry.ts)
Central registry singleton managing engine instances by name/key (`TRANSACTION`, `PRICE`, `ANALYTICS`, `TAX`, `GOAL`).

---

### Phase 2 — TransactionEngine Implementation

#### [NEW] [TransactionEngine.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/engines/TransactionEngine.ts)
Concrete implementation of `IFinancialEngine<TransactionEngineInput, TransactionEngineOutput>` handling:
1. **Transaction Sequence Validation**: Orders transactions chronologically by `date ASC, id ASC`. Validates supported type enums (`BUY`, `SELL`, `REINVEST`, `DIVIDEND`, `INTEREST`, `BONUS`, `SPLIT`, `DEPOSIT`, `WITHDRAWAL`, `FEE`, `TAX`).
2. **Holding Ownership Validation**: Verifies all context transactions belong to the specified holding.
3. **Oversell Detection**: Detects when sell/withdrawal quantities exceed available running quantity, logging structured `OversellWarning` / `OversellError`.
4. **Running Quantity Tracking**: Computes cumulative units after each transaction.
5. **Cost Basis & Average Price Calculation**:
   - `BUY` / `REINVEST`: Adds lot cost (`qty * price`), increases running units, recalculates `avgCost = totalCost / runningQty`.
   - `SELL` / `WITHDRAWAL`: Decreases total cost proportionally (`qty * avgCost`) and reduces running units.
   - `SPLIT`: Adjusts running units by split ratio, reduces average cost proportionally, preserving total cost.
   - `BONUS`: Adds bonus units without cost, reducing average cost per unit, preserving total cost.
6. **Normalized State Output**: Returns per-transaction normalized line items with cumulative units, average price, total cost, and holding status.

---

### Phase 3 — Tests & Deliverables

#### [MODIFY] [runTests.ts](file:///c:/Users/prije/Downloads/MyWorth/backend/src/__tests__/runTests.ts)
Add dedicated test suite section for `TransactionEngine`:
- Valid `BUY` -> `SELL` sequence running quantity and average cost tracking
- Oversell detection (`SELL` quantity > available units)
- Corporate action handling (`SPLIT` and `BONUS` unit adjustments)
- Engine registry registration and execution via `EngineRegistry`
- Determinism and idempotency verification
- All 34 existing Sprint 1A, 1B, 1C & Pre-1D unit tests continue passing cleanly

#### [NEW] [Sprint_1D_Retrospective.md](file:///c:/Users/prije/Downloads/MyWorth/docs/Sprint_1D_Retrospective.md)

#### [NEW] [Sprint 1D - Implementation Summary.md](file:///c:/Users/prije/Downloads/MyWorth/prompts/summary/Sprint%201D%20-%20Implementation%20Summary.md)

#### [MODIFY] [AI_CHANGELOG.md](file:///c:/Users/prije/Downloads/MyWorth/docs/AI_CHANGELOG.md) & [.ai/SESSION_CONTEXT.md](file:///c:/Users/prije/Downloads/MyWorth/.ai/SESSION_CONTEXT.md)

---

## Verification Plan

### Automated Tests
1. `npm test` in `backend` (Shared engine infrastructure, `TransactionEngine` logic, & regression suite).
2. `npm run build` in `backend` (`tsc`).
3. `npm run build` in `frontend` (`vite build`).

### Manual Verification
- Verify `TransactionEngine` output accuracy for edge cases (zero quantity, partial sells, oversells, splits).


---

# 🏛 Architecture Review Board (ARB) Comments — ChatGPT Review

**Review Status:** ✅ APPROVED WITH MINOR ENHANCEMENTS

Overall this implementation plan aligns with Architecture v1.0 and the frozen domain model. The scope is well controlled and respects the sprint boundaries. The following recommendations should be incorporated where practical before implementation.

## Recommendation 1 — Strongly Typed Engine Contracts
Avoid `any` generic defaults. Prefer explicit DTOs or `unknown` for better type safety.

## Recommendation 2 — Engine Metadata
Each engine should expose immutable metadata:
- id
- name
- version
- supportedAssetTypes
- deterministic
- idempotent

## Recommendation 3 — Extend EngineContext
Consider adding:
- correlationId
- executionDate
- userContext (optional)
- featureFlags

## Recommendation 4 — Enhance EngineResult
Add optional fields:
- auditTrail
- metrics
- engineVersion

This will support explainable financial calculations later.

## Recommendation 5 — Separate Validation from Calculation
Move transaction validation into dedicated validator classes/functions.
TransactionEngine should orchestrate computation rather than contain all validation logic.

## Recommendation 6 — Business Rule Isolation (Mandatory)
Business policies such as:
- oversell behaviour
- supported transaction types
- transaction ordering
- cost basis strategy

should be configuration-driven where practical rather than hardcoded.

## Recommendation 7 — Engine Quality Gates
Add permanent tests verifying:
- determinism
- idempotency
- stable transaction ordering
- floating-point precision

## Recommendation 8 — Engine Composition
Document the future engine pipeline:

TransactionEngine
→ PriceEngine
→ AnalyticsEngine
→ CapitalGainEngine
→ TaxEngine
→ GoalEngine

Later engines should consume outputs from previous engines rather than directly querying repositories.

## Recommendation 9 — Performance Targets
Document expected complexity:
- Time: O(n)
- Memory: O(n) or better

Avoid nested loops across transactions.

## Recommendation 10 — Financial Precision
Introduce a shared Money/Decimal utility before implementing subsequent engines. Avoid relying on native floating-point arithmetic for critical financial calculations.

---

## Final ARB Decision

✅ Architecture Approved

✅ Sprint Scope Approved

✅ Ready for implementation after incorporating the above recommendations where appropriate.

No changes to the frozen domain model are required.
