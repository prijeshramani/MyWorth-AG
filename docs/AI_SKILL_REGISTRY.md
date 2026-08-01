# AI Skill Registry Specification

## Overview
The `AISkillRegistry` defines the explicit capabilities, context requirements, evidence providers, safety policies, and prompt templates for all AI Wealth Advisor skills in FamilyWealthOS.

---

## Skill Specifications

### 1. Portfolio Analysis Skill
- **ID**: `portfolio_analysis`
- **Category**: `PORTFOLIO`
- **Supported Intents**: `portfolio_summary`, `asset_allocation`, `risk_analysis`, `holding_breakdown`, `net_worth_inquiry`
- **Context Providers**: `AssetMetricsContext`, `AccountHoldingsContext`
- **Evidence Providers**: `AssetRepository`, `PriceRepository`
- **Permissions**: `READ_PORTFOLIO`
- **Safety Policy**: Only consume aggregated asset metrics. Do not provide stock-picking advice or speculate on future asset prices.

### 2. Tax Assistant Skill
- **ID**: `tax_assistant`
- **Category**: `TAX`
- **Supported Intents**: `capital_gains_inquiry`, `tax_loss_harvesting`, `itr_filing_guidance`, `form16_summary`, `deduction_check`
- **Context Providers**: `TaxSummaryContext`, `CapitalGainsContext`, `Form16Context`
- **Evidence Providers**: `CapitalGainsCalculator`, `Form16Parser`
- **Permissions**: `READ_TAX_DATA`
- **Safety Policy**: Ground all calculations in official Finance Act 2024 rules. Do not fabricate tax exemptions or filing codes.

### 3. Estate Advisor Skill
- **ID**: `estate_advisor`
- **Category**: `ESTATE`
- **Supported Intents**: `estate_summary`, `nomination_audit`, `family_wealth_distribution`, `legacy_planning`
- **Context Providers**: `KnowledgeGraphContext`, `FamilyMemberContext`
- **Evidence Providers**: `KnowledgeGraphRepository`, `FamilyRepository`
- **Permissions**: `READ_ESTATE_DATA`
- **Safety Policy**: Respect family permissions. Only reference verified Knowledge Graph nodes and edges.

### 4. Retirement Coach Skill
- **ID**: `retirement_coach`
- **Category**: `RETIREMENT`
- **Supported Intents**: `retirement_readiness`, `fire_target_check`, `corpus_projection`, `savings_gap_analysis`
- **Context Providers**: `ProjectionEngineContext`, `RetirementMetricsContext`
- **Evidence Providers**: `ProjectionEngine`
- **Permissions**: `READ_PROJECTIONS`
- **Safety Policy**: Always cite ProjectionEngine simulation parameters (growth rate, inflation rate, confidence level).

### 5. Goal Planner Skill
- **ID**: `goal_planner`
- **Category**: `GOALS`
- **Supported Intents**: `goal_status_check`, `goal_sip_calculation`, `milestone_projection`, `goal_prioritization`
- **Context Providers**: `GoalMetricsContext`, `ProjectionEngineContext`
- **Evidence Providers**: `GoalRepository`, `ProjectionEngine`
- **Permissions**: `READ_GOALS`
- **Safety Policy**: Base all goal milestone projections on verified user asset allocations and ProjectionEngine calculations.

### 6. Recommendation Explainer Skill
- **ID**: `recommendation_explainer`
- **Category**: `RECOMMENDATIONS`
- **Supported Intents**: `explain_recommendation`, `recommendation_audit`, `action_item_inquiry`
- **Context Providers**: `RecommendationEngineContext`, `RuleEngineContext`
- **Evidence Providers**: `RecommendationEngine`, `RuleEngine`
- **Permissions**: `READ_RECOMMENDATIONS`
- **Safety Policy**: Must cite exact RuleEngine rule IDs, trigger thresholds, and calculation versions. Never invent rules.

### 7. Insurance Advisor Skill
- **ID**: `insurance_advisor`
- **Category**: `INSURANCE`
- **Supported Intents**: `insurance_audit`, `term_cover_check`, `health_insurance_gap`, `policy_summary`
- **Context Providers**: `InsuranceMetricsContext`, `FamilyIncomeContext`
- **Evidence Providers**: `InsurancePolicyRepository`
- **Permissions**: `READ_INSURANCE`
- **Safety Policy**: Only assess cover adequacy against established financial benchmarks. Do not endorse specific insurance products.
