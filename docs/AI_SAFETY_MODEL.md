# 🔒 AI_SAFETY_MODEL.md — AI Safety & Regulatory Guardrails Model

**System Name**: Family Wealth OS  
**Phase**: Phase 7A  
**Date**: July 28, 2026  
**Status**: APPROVED AI SAFETY MODEL  

---

## 1. Safety Guardrails & PII Redaction

`AISafetyService` enforces regulatory compliance:
- **PII Redaction**: Redacts Indian PAN numbers (`[REDACTED_PAN]`) and Aadhaar numbers (`[REDACTED_AADHAAR]`).
- **SEBI RIA Disclaimer**: Injects statutory disclaimer on all financial model responses.
- **Boundary Validation**: Blocks out-of-scope non-financial queries.
