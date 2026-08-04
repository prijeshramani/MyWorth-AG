# FamilyWealthOS – System Context

## System Purpose
FamilyWealthOS is a privacy-first, local-first AI Wealth Operating System built for Indian family wealth management. It unifies asset tracking, capital gains tax calculation under Finance Act 2024, estate health planning, goal-based Monte Carlo projections, and AI-driven advisory workflows.

## System Boundaries & Layers
1. **Presentation Layer**: Glassmorphic React single-page application with rich micro-animations.
2. **Orchestration Layer**: `AIAdvisorService` and `AIContextAggregator` orchestrating evidence-based skills and permission-gated actions.
3. **Engine Layer**: Deterministic financial calculation engines (`CapitalGainsCalculator`, `ProjectionEngine`, `RuleEngine`, `EstateHealthService`, `RebalancingEngine`).
4. **Data & Repository Layer**: SQLite WAL database with versioned migrations (`001` to `012`), Knowledge Graph network nodes/edges, and encrypted credential storage.
5. **Platform Registry Layer**: Central discoverable inventory for Skills, Actions, Plugins, Features, and Capabilities.
