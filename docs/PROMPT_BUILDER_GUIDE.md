# 📝 PROMPT_BUILDER_GUIDE.md — Prompt Builder Service Guide

**System Name**: Family Wealth OS  
**Phase**: Phase 7A  
**Date**: July 28, 2026  
**Status**: APPROVED PROMPT BUILDER GUIDE  

---

## 1. Configurable Prompt Templates

Prompt templates stored in `ai_prompt_templates` compile deterministic system and user prompts:
- `{userQuery}`: Sanitized user input query.
- `{contextPayload}`: Structured JSON domain context.
- `{evidenceProof}`: Evidence proof payload with SHA-256 hash.
