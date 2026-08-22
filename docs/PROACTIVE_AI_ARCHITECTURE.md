# Proactive AI Architecture & Autonomous Fiduciary Intelligence

## 1. Paradigm Shift: Reactive vs. Proactive Fiduciary AI

| Characteristic | Reactive AI (Chatbot Model) | Proactive AI (Family Office Fiduciary Model) |
| :--- | :--- | :--- |
| **Invocation** | User types a query into a prompt box. | Automated background observer evaluates state shifts. |
| **Context** | Dependent on user prompt completeness. | Complete, verified Family Digital Twin state. |
| **Timing** | User must already suspect an issue exists. | Anticipatory; alerts before deadlines or risk compounding. |
| **Evidence Basis** | Probabilistic text generation. | Verified calculation engine output with full audit lineage. |
| **Execution** | Pure text suggestions. | Structured action items with 1-click user execution & audit trail. |

```
+---------------------------------------------------------------------------------------+
|                               PROACTIVE OBSERVABILITY BUS                             |
|    - Market NAV Sync    - Statement Imports    - Policy Dates    - Cashflow Ledger   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                            ANOMALY & DRIFT DETECTORS                                  |
|  * Asset Drift (>5%)  * Renewal in 30d  * 80C Gap  * Emergency < 6M  * Nominee Void   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                         CONFIDENCE & COOLDOWN GATEWAY                                 |
|  * Confidence >= 85%   * Cooldown (14-30 Days)   * Duplicate Suppression Filter       |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                          STRUCTURED RECOMMENDATION DISPATCH                           |
|       * Morning Briefing     * Executive Notification     * Action Center Card        |
+---------------------------------------------------------------------------------------+
```

---

## 2. Trigger Catalog, Rules & Cooldown Thresholds

| Observer Rule Code | Evaluation Frequency | Detection Trigger Condition | Evidence Required | Confidence Gate | Urgency | Cooldown Period | User Approval? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DRIFT_EQUITY_OVERWEIGHT` | Weekly / Post-Price Sync | Equity allocation exceeds target asset allocation by $>5.0\%$ | Portfolio NAV, Target Asset Allocation table | $\ge 90\%$ | `MEDIUM` | 14 Days | **YES** |
| `INSURANCE_RENEWAL_DUE` | Daily | Active policy `next_premium_due_date` within 30 days | `insurance_policies` active status & due date | $100\%$ | `HIGH` | 7 Days | No (Informational) |
| `TAX_80C_OPPORTUNITY` | Monthly / Q3-Q4 FY | 80C deduction shortfall $> ₹25,000$ and current month $\ge$ Oct | `tax_deductions`, `assets` (EPF, PPF, ELSS) | $\ge 95\%$ | `HIGH` | 30 Days | **YES** |
| `EMERGENCY_FUND_DEFICIT` | Weekly / Post-Transaction | Liquid savings cover $< 4.0$ months of fixed household expenses | Bank balances, 6-month trailing debit expenses | $\ge 90\%$ | `CRITICAL`| 14 Days | **YES** |
| `NOMINEE_REGISTRATION_GAP`| Post-Asset Import | Asset holding or bank account missing verified nominee | `assets`, `accounts`, `graph_edges` (`NOMINATES`) | $100\%$ | `HIGH` | 30 Days | **YES** |
| `EXCESS_IDLE_CASH` | Bi-Weekly | Savings account balance $> 12$ months of living expenses | Bank account balances, monthly expense burn | $\ge 92\%$ | `LOW` | 30 Days | **YES** |
| `GOAL_OFF_TRACK_DRIFT` | Monthly | Goal probability score $< 60\%$ based on trailing 6-month CAGR | `financial_goals`, `goal_allocations` | $\ge 88\%$ | `HIGH` | 21 Days | **YES** |
| `CONCENTRATION_SINGLE_STOCK`| Post-Price Sync | Single stock holding constitutes $> 20\%$ of total liquid portfolio | `holdings`, `asset_prices`, `portfolio` | $\ge 95\%$ | `HIGH` | 14 Days | **YES** |
| `ESTATE_WILL_LAPSED` | Quarterly | No Will registered, or last Will version updated $> 3$ years ago | `wills`, `will_versions`, Net Worth $> ₹50\text{L}$ | $\ge 95\%$ | `MEDIUM` | 60 Days | **YES** |

---

## 3. False-Positive Prevention & Noise Suppression

To avoid user alert fatigue:
1. **Cooldown Registry (`recommendation_history`)**:
   - When an insight is dismissed or snoozed, the engine records `status: 'DISMISSED'` or `snoozed_until: timestamp`.
   - The engine will not regenerate the same recommendation until the cooldown expires.
2. **Confidence Threshold Gating**:
   - No recommendation is emitted if calculation confidence is below $85\%$.
3. **Actionability Requirement**:
   - Every proactive insight must contain a concrete `nextAction` (e.g. navigation path, form pre-fill, or rebalance execution).
