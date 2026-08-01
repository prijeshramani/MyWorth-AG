# ADR 007 – AI Action Registry & Preview-First Execution Framework

## Context
The AI Wealth Advisor must transition from an explanation-only engine into an interactive decision assistant capable of triggering platform actions (such as re-evaluating recommendations, generating ITR JSON files, or rebalancing portfolios).

## Decision
We implement a central `AIActionRegistry` where every executable platform capability is explicitly registered with strict preconditions, permissions, risk levels (`LOW`, `MEDIUM`, `HIGH`), audit event types, and rollback strategies. High-risk actions require mandatory preview impact analysis and user confirmation before execution.

## Consequences
- Guarantees 100% auditable action execution.
- Eliminates accidental or unconfirmed database mutations.
- Enables 1-click undo for supported actions.
