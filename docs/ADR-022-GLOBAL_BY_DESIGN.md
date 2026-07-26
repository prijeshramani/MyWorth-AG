# ADR-022: Global by Design, Local by Implementation Architecture

**Status**: APPROVED  
**Date**: July 26, 2026  
**Deciders**: Lead Architect, Solution Architect  
**Technical Context**: Sprint 2A Global Market Foundation Architecture Phase  

---

## Context and Problem Statement

Family Wealth OS initially targets Indian (`IN`) and US (`US`) financial markets. However, building an engine with hardcoded assumptions about a single country (e.g. assuming all assets use `INR` currency, or assuming all exchanges follow Indian `NSE` trading hours) causes severe architectural friction when expanding to multi-currency portfolios or international exchanges in the future.

---

## Decision Drivers

1. **Architecture Version 1.0 (Frozen)**: Zero modifications allowed to core database schemas or repository interfaces.
2. **Global Scalability**: Ability to support additional jurisdictions (e.g. UK, EU, Japan, Australia) by configuration rather than refactoring.
3. **Multi-Currency Accuracy**: Transactions and holdings must preserve native currencies (`INR`, `USD`) without premature conversion distortion.

---

## Considered Options

- **Option A**: Build hardcoded single-country logic (India first), refactor later when adding US markets.
- **Option B**: **Global by Design, Local by Implementation**. Build generic, jurisdiction-agnostic interfaces (`MarketRegistry`, `ExchangeDefinition`, `IProviderIdentifierMapper`, `IFXConversionService`) while implementing `IN` and `US` initial providers only.

---

## Decision Outcome

**Chosen Option: Option B**.

### Consequences & Benefits
- **Zero Core Schema Mutations**: Preserves frozen database tables while supporting global identifiers (ISIN, CUSIP, Tickers).
- **Clean Engine Contracts**: Consuming engines (`TransactionEngine`, `ValuationEngine`) remain pure and isolated.
- **Seamless Expansion**: Adding future markets (e.g. LSE in `GBP` or TSE in `JPY`) requires registering a config object in `MarketRegistry` without altering engine code.
