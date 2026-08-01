# TypeScript & Code Quality Guidelines

## 1. Strict Typing
- `noImplicitAny: true` enforced in `tsconfig.json`.
- Avoid arbitrary `any` casts; use explicit DTO interfaces for engine outputs and API responses.

## 2. Decoupled Service Architecture
- Calculation logic belongs in deterministic engines (`CapitalGainsCalculator`, `ProjectionEngine`, `RuleEngine`).
- AI services only orchestrate and aggregate context.
