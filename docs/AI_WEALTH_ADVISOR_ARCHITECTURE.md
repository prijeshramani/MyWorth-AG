# AI Wealth Advisor Architecture

## Overview
The **AI Wealth Advisor** in FamilyWealthOS operates as an evidence-backed, permission-aware orchestration layer over the platform's core calculation and memory engines (**Finance Act 2024 Tax Engine, Projection Engine, Rule Engine, Knowledge Graph Repository**).

---

## Mandatory Constraints & Guardrails
1. **Zero Raw Queries**: AI never executes direct SQL queries on database tables.
2. **Zero Financial Math**: AI never performs custom or manual financial math calculations. All numbers and valuations are computed deterministically by backend calculation engines.
3. **Evidence-Backed Responses**: Every response cites evidence items with confidence score, freshness, source engine, calculation version, and rule version.
4. **Safety Policy Enforcement**: Reject or safely handle unsupported financial speculation or speculative stock tips.

---

## Conversation Intent Pipeline

```
User Query ──► Intent Detection ──► Skill Resolution ──► Context Assembly
                                                               │
                                                               ▼
Response Generation ◄── Safety Validation ◄── Evidence Validation
         │
         ▼
Follow-up Prompt Suggestions & Action Items
```

### Pipeline Steps
1. **Intent Detection & Skill Resolution**: Matches query against `AISkillRegistry` supported intents and categories.
2. **Multi-Skill Orchestration**: If a query spans multiple domains (e.g. Retirement + Tax), multiple skills are invoked simultaneously, and their evidence snapshots are merged seamlessly.
3. **Context Assembly**: `AIContextAggregator` fetches permission-aware context snapshots from `CapitalGainsCalculator`, `RecommendationEngine`, `KnowledgeGraphRepository`, and asset master tables.
4. **Evidence Validation**: Verifies evidence metrics (`confidence`, `freshness`, `sourceEngine`, `calculationVersion`, `ruleVersion`).
5. **Safety Validation**: Evaluates safety guardrails (e.g. rejecting speculative penny stock tips or guaranteed return claims).
6. **Response Generation**: Generates grounded markdown explanations with evidence cards and actionable items tagged as `EXPLAIN`, `RECOMMEND`, or `EXECUTE` (with user confirmation).

---

## Skill Registry Architecture
All 7 wealth advisor skills are registered centrally in `AISkillRegistry.ts`:
- **Portfolio Analysis** (`portfolio_analysis`)
- **Tax Assistant** (`tax_assistant`)
- **Estate Advisor** (`estate_advisor`)
- **Retirement Coach** (`retirement_coach`)
- **Goal Planner** (`goal_planner`)
- **Recommendation Explainer** (`recommendation_explainer`)
- **Insurance Advisor** (`insurance_advisor`)
