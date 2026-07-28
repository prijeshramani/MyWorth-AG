# 🧠 AI_CONTEXT_ARCHITECTURE.md — AI Context & Intelligence Architecture

**System Name**: Family Wealth OS  
**Phase**: Phase 7A (AI Context, Memory & Evidence Layer)  
**Date**: July 28, 2026  
**Status**: APPROVED AI CONTEXT ARCHITECTURE  

---

## 1. Overview & Architectural Blueprint

Phase 7A establishes the **AI Context, Memory & Evidence Layer**, the intelligence synthesis foundation for FamilyWealthOS that prepares explainable, evidence-backed context payloads for future Phase 7B AI Wealth Advisor consumption without raw database queries.

```
+-----------------------------------------------------------------------------------+
|               AI CONTEXT, MEMORY & EVIDENCE LAYER (PHASE 7A)                     |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
                      [ AI Capability Registry (ai_capabilities) ]
            Portfolio Analysis | Tax Explanation | Estate Review | Retirement
                                          │
                                          ▼
                      [ AI Context Aggregator (AIContextService) ]
        Synthesizes Investment, Tax, Estate, Planning, Recommendation Engine payloads
                                          │
       ┌─────────────────────┬────────────┴──────────┬───────────────────┐
       ▼                     ▼                       ▼                   ▼
[ Context Freshness ]  [ AI Memory Layer ]   [ Evidence Provenance ] [ Safety Guardrails ]
  • Generated At        • Permanent            • SHA-256 Calculation  • PII Redaction
  • Cache Status        • Session              • Engine Version       • RIA Disclaimer
  • Freshness Status    • Expiring             • Rule Version         • Query Validation
  • Auto-Refresh        • User Removable       • Correlation ID       • Out-of-bounds Check
       │                     │                       │                   │
       └─────────────────────┴───────────────────────┴───────────────────┘
                                          │
                                          ▼
                      [ Prompt Builder Service (PromptBuilderService) ]
           Compiles System & User Prompts using Configurable Templates & Proofs
```

---

## 2. Key Architecture Rules Enforced

1. **No Raw Queries**: AI services never query raw database tables directly. They consume Domain Context Providers only.
2. **Every Context Element Has Evidence**: Every metric and summary has attached source proof (`ai_evidence` table linking calculation inputs, formulas, engine versions, and calculation hashes).
3. **Multi-Session Memory**: Persists short-term session state and long-term user preferences, decisions, and facts in `ai_memory`.
4. **AI Safety & Guardrails**: Enforces PII redaction (PAN, Aadhaar, Account numbers) and SEBI RIA disclaimer injection.
5. **AI Context Health Score**: Measures completeness across Context, Evidence, Memory Quality, Freshness, and Permissions ($S_{\text{AIContext}} \ge 90$).
