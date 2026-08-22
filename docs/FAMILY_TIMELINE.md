# Family Timeline Architecture & Unified Financial Ledger

## 1. Concept & Multi-Domain Chronology

The **Family Timeline** serves as the chronological memory and family milestone ledger. It synthesizes disjointed domain records (asset transactions, insurance policy starts, tax filings, estate updates, goal completions, and AI fiduciary interventions) into an interactive, multi-generational story.

```
2022
 │
 ├── [Oct 12] ICICI Prudential Term Life Policy Activated (Sum Assured: ₹1.75 Cr)
 │
2023
 │
 ├── [Feb 15] Higher Education Goal Created (Target: ₹50L by 2038)
 ├── [Aug 22] Sukanya Samriddhi Account (SSY) Opened for Hishika
 │
2024
 │
 ├── [Mar 28] Section 80C Limit Fully Maximized (₹1.50L allocated)
 ├── [Nov 10] Portfolio Rebalanced: Shifted 10% from Midcap to Largecap Index
 │
2025
 │
 ├── [Apr 04] Net Worth Milestone Reached: ₹50,00,000 Crossed
 ├── [Dec 18] Will Version 2 Registered with Appointed Primary Executor
 │
2026
 │
 └── [Aug 16] Complete Digital Office Hardening: ₹3.01 Cr Term Shield Verified
```

---

## 2. Event Normalization & Ingestion Sources

All domain events are normalized into a unified `TimelineEventDTO`:

| Source Domain | Native Table / Service | Normalized Event Type | Event Title Template |
| :--- | :--- | :--- | :--- |
| **Transactions** | `transactions` (Debits/Credits $> ₹1,00,000$) | `TRANSACTION_MAJOR` | `{Type} of ₹{Amount} in {AssetName}` |
| **Insurance** | `insurance_policies` | `INSURANCE_MILESTONE`| `{InsurerName} {PolicyType} Policy Activated / Renewed` |
| **Goals** | `financial_goals` | `GOAL_EVENT` | `Goal "{Title}" Created / Reached {Pct}% Target` |
| **Tax** | `tax_calendar`, `capital_gain_summary` | `TAX_EVENT` | `FY{Year} Tax Return Filed / 80C Maximized` |
| **Estate** | `wills`, `will_versions`, `trusts` | `ESTATE_EVENT` | `Will v{Version} Registered / Executor Nominated` |
| **AI Decisions**| `recommendation_history`, `ai_audit_trail`| `AI_ADVISORY_EVENT` | `AI Recommendation Accepted: {Title}` |
| **Life Events** | `life_events` | `LIFE_EVENT` | `Life Event: {EventTitle}` |

---

## 3. Data Schema (`family_timeline_events`)

```sql
CREATE TABLE IF NOT EXISTS family_timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  family_member_id INTEGER,
  domain TEXT CHECK(domain IN ('INVESTMENT', 'PROTECTION', 'TAX', 'ESTATE', 'GOAL', 'LIFE_EVENT', 'AI_DECISION')) NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL,
  event_date TEXT NOT NULL,
  importance_level TEXT CHECK(importance_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (family_member_id) REFERENCES family_members(id)
);
```

---

## 4. Querying, Filtering & Family Member Scoping

The timeline supports high-performance querying by:
1. **Time Window**: Filter by Fiscal Year (e.g. `FY2024-25`), Calendar Year, or Custom Date Range.
2. **Domain Filters**: Multi-select chips for `[Investment, Insurance, Tax, Estate, Life Events]`.
3. **Family Member Scope**: View the entire household narrative or isolate a specific individual (e.g. *Vivaan's Milestone Timeline*).
