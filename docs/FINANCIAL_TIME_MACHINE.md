# Financial Time Machine & Simulation Sandbox Architecture

## 1. Dual Capability Overview

The **Financial Time Machine** provides two core superpowers for the family office:

```
+---------------------------------------------------------------------------------------+
|                              FINANCIAL TIME MACHINE                                   |
+---------------------------------------------------------------------------------------+
        |                                                              |
        v                                                              v
  [ 1. RETROACTIVE RECONSTRUCTION ]             [ 2. COUNTERFACTUAL WHAT-IF SANDBOX ]
  "What was our exact net worth, asset          "What if we had invested ₹25,000/mo into
   allocation, and tax position on               Nifty 50 instead of Fixed Deposits over
   31 March 2024?"                               the last 5 years?"
  -> Deterministic Backward State Engine        -> Zero-Mutation Parallel Simulation Sandbox
```

---

## 2. Retroactive Point-in-Time Reconstruction Engine

### Reconstruction Strategy:
To reconstruct the exact financial state on any target date $T_{\text{target}}$:

1. **Asset Quantity Reconstruction**:
   $$\text{Quantity}(T_{\text{target}}) = \sum_{t \le T_{\text{target}}} \text{BuyUnits}(t) - \sum_{t \le T_{\text{target}}} \text{SellUnits}(t)$$
2. **Historical Asset Pricing**:
   Find price $P(T_{\text{target}})$ from `asset_prices` where $\text{date} \le T_{\text{target}}$ ordered by `date DESC LIMIT 1`.
3. **Historical Cash & FD Valuation**:
   - For Bank Accounts: Reconstruct balance using running balances or cumulative credits/debits up to $T_{\text{target}}$.
   - For Fixed Deposits: Calculate accrued interest up to $T_{\text{target}}$ via `fdValuation.ts`.
4. **Policy & Estate State**:
   Filter `insurance_policies` and `wills` where $\text{created\_at} \le T_{\text{target}}$ and $(\text{deleted\_at} > T_{\text{target}} \text{ OR } \text{deleted\_at IS NULL})$.
5. **Knowledge Graph Temporal Slicing**:
   Filter graph nodes and edges active on $T_{\text{target}}$.

---

## 3. Counterfactual What-If Sandbox Architecture

### Zero-Mutation Isolation Guarantee:
- **Sandbox Context**: Counterfactual simulations run entirely in ephemeral memory (`WhatIfSimulationState`).
- **No Database Writes**: Never modifies live SQLite tables (`assets`, `transactions`, `holdings`).
- **Differential Branching**: Clones the Digital Twin state into an in-memory branch, applies the hypothetical delta parameters (e.g. higher monthly SIP, different asset allocation, early mortgage prepayment), and executes the deterministic projection engine.

```
                    [ Live SQLite Production State ] (IMMUTABLE)
                                   |
                                   | (In-Memory Deep Clone)
                                   v
             [ Ephemeral Simulation Sandbox Context ]
                    |                              |
            (Scenario Branch A)            (Scenario Branch B)
            SIP +₹25k in Nifty 50          Prepay ₹15L Home Loan
                    |                              |
                    v                              v
             [ Projection Engine ]          [ Projection Engine ]
                    |                              |
                    +--------------+---------------+
                                   |
                                   v
             [ Comparative Delta Visualizer & PDF Report ]
```

---

## 4. Technical Schema (`simulation_snapshots`)

```sql
CREATE TABLE IF NOT EXISTS simulation_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  scenario_name TEXT NOT NULL,
  base_date TEXT NOT NULL,
  assumptions_json TEXT NOT NULL,
  projected_outcomes_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id)
);
```
