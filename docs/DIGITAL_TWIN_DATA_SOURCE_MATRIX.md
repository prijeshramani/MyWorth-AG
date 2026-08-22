# Digital Twin Data Source-of-Truth Matrix (Sprint 8B.1)

This matrix defines the authoritative data sources, calculation engines, freshness indicators, and missing-data semantics for every field in `DigitalTwinState`.

| Field Path | Type | Authoritative Source Table / Service | Calculation Engine | Freshness Indicator | Missing / Incomplete Data Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **lineage.members** | `Array<Member>` | `family_members` via `SQLiteFamilyMemberRepository` | Direct DB lookup | Real-time | Returns `[]` if none; incurs completeness penalty |
| **lineage.entities** | `Array<Entity>` | `entities` via `SQLiteEntityRepository` | Direct DB lookup | Real-time | Returns `[]` if none |
| **lineage.relationships** | `Array<Relation>` | `graph_edges` via `SQLiteKnowledgeGraphRepository` | Direct DB lookup | `latestGraphSyncDate` | Returns `[]` if none |
| **balanceSheet.grossAssets** | `number` | `assets`, `asset_prices`, `transactions` | Real DB Valuation | `latestPriceDate` | Returns `0.00` if no assets imported |
| **balanceSheet.totalLiabilities** | `number` | `liabilities` table | Deterministic sum | Real-time | Returns `0.00` if verified no debt |
| **balanceSheet.netWorth** | `number` | $\text{grossAssets} - \text{totalLiabilities}$ | `NetWorthEngine` | Real-time | Calculated difference |
| **balanceSheet.liquidReserves** | `number` | `assets.type IN ('BANK', 'SAVINGS', 'CASH')` | Real DB Valuation | `latestPriceDate` | Returns `0.00` if no liquid accounts |
| **balanceSheet.emergencyFundMonths** | `number` | $\text{liquidReserves} / (\text{monthlyExpenses})$ | GoalPlanning formula | Real-time | Returns `0.0` if liquid reserves is 0 |
| **balanceSheet.assetDistribution** | `Record<string, number>` | `assets` grouped by `category` / `type` | PortfolioAnalytics | `latestPriceDate` | Returns `{}` if no assets |
| **protection.activeTermCover** | `number` | `insurance_policies` WHERE `status = 'ACTIVE'` | Policy repo filter | `latestPolicySyncDate`| Returns `0.00` if no active policies |
| **protection.requiredHlvCover** | `number` | Member annual income $\times 10-15$ | HLV standard formula | Dynamic | **Returns `0.00` if income unconfigured** (Zero artificial fallbacks) |
| **protection.hlvGap** | `number` | $\max(0, \text{HLV} - \text{Cover})$ | Protection formula | Real-time | Returns `0.00` if HLV is 0 |
| **protection.healthCoverTotal** | `number` | `insurance_policies` (`HEALTH`) | Policy repo filter | `latestPolicySyncDate`| Returns `0.00` if no health policies |
| **protection.isAdequate** | `boolean` | $\text{activeTermCover} \ge \text{requiredHlvCover}$ | Protection formula | Real-time | `false` if activeTermCover is 0 |
| **protection.uninsuredMemberIds** | `number[]` | Unmatched members vs covered policy IDs | Set difference | Real-time | Returns all member IDs if no active policies |
| **trajectory.activeGoals** | `Array<Goal>` | `financial_goals` WHERE status IN ('IN_PROGRESS', 'ON_TRACK') | `SQLiteGoalRepository` | Real-time | Returns `[]` if none |
| **trajectory.retirementTargetCorpus**| `number` | `financial_goals` (`RETIREMENT`) | Retirement planning | Real-time | Returns `0.00` if no retirement goal |
| **trajectory.projectedRetirementAge** | `number` | `projection_assumptions` / default | Assumptions repo | Real-time | Defaults to 60 |
| **trajectory.savingsRatePct** | `number` | Active goals savings vs income | Goal planning | Real-time | Returns `0` if no active goals |
| **governance.willRegistered** | `boolean` | `wills` WHERE `status = 'REGISTERED'` | `SQLiteEstateRepository` | Real-time | `false` if unregistered or missing |
| **governance.estateHealthScore** | `number` | Will + Trust + Nominee weighted metrics | `EstateHealthService` | Real-time | Returns score between 0 and 100 |
| **governance.fy80CUtilized** | `number` | Tax deduction items / Section 80C | `TaxApplicationService` | Real-time | Returns utilized amount or 0 |
| **governance.fy80CHeadroom** | `number` | $\max(0, 150000 - \text{fy80CUtilized})$ | Tax calculation | Real-time | Returns remaining headroom |
