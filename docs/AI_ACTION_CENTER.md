# AI Action Center Specification

## Overview
The **AI Action Center** provides a preview-first execution workflow managing actions across categories: `Pending Approval`, `Draft Actions`, `Recommended Actions`, `Completed Actions`, `Scheduled Actions`, and `Dismissed Actions`.

---

## Safe Execution Workflow

```
Explain ──► Preview ──► Impact Analysis ──► User Confirmation ──► Execute ──► Audit Log ──► Undo
```

1. **Explain**: AI details the rationale and underlying engine evaluation.
2. **Preview**: Displays expected duration, owner engine, and preconditions.
3. **Impact Analysis**: Shows financial benefit, risk delta, goal impact, and tax implications.
4. **User Confirmation**: Requires explicit confirmation for medium/high risk actions.
5. **Execute**: Invokes backend capability and records entry in `ai_audit_trail` and `ai_decision_journal`.
6. **Undo**: Provides 1-click rollback using defined recovery strategies for supported actions.
