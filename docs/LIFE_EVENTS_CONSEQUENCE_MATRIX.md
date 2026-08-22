# Life Events Consequence Matrix: Complete 10-Event Catalog Reference

## 1. Catalog Overview & Consequence Specifications

| Event Type (`LifeEventType`) | Detection / Evidence | Tax Consequence | Protection Shield Consequence | Cashflow Consequence | Goal & Trajectory Consequence | Action Summary & Route |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CHILD_BIRTH`** | New member added (`CHILD`) or hospital invoice | Surcharge review; deduction check | $+₹50\text{L}$ Term cover required; $+₹5\text{L}$ Family Floater health | $-\text{Monthly childcare buffer}$ | Recommend new "Higher Education Fund" goal (18-yr compounding horizon) | Upgrade term & health shields; seed education compounding. (`/planning/goals`) |
| **`MARRIAGE`** | New member added (`SPOUSE`) or joint account | Evaluate joint tax deductions & HUF formation | $+₹10\text{L}$ Health Floater addition for spouse | Recalculate joint household surplus | Align retirement timeline to joint retirement age | Consolidate health policies; update Will beneficiaries. (`/estate`) |
| **`SALARY_INCREASE`** | Monthly income spike | Calculate tax bracket shift; recommend 80C / NPS 80CCD(1B) | Recalculate HLV requirement for higher income ($10\times \Delta \text{Annual}$) | $+50\%$ of increment to investable surplus | Step up active goal SIPs proportionally | Accelerate goal timelines and maximize tax exemptions. (`/portfolio`) |
| **`JOB_CHANGE`** | Employer shift | Transition TDS adjustment | Verify employer group cover gap; ensure personal term shield | Recalculate emergency fund target (3 $\to$ 6 months) | Maintain active SIP continuity | Consolidate EPF (UAN transfer); verify independent health buffer. (`/protection`) |
| **`HOME_PURCHASE`** | Real estate asset + loan | Factor Section 24(b) interest deduction (up to ₹2L) & 80C | Term life cover $\ge \text{Loan Principal}$ | $-\text{Monthly EMI load}$ | Rebalance goal SIPs to accommodate EMI | Deduct home loan interest; insure outstanding debt liability. (`/tax`) |
| **`HOME_LOAN_CLOSURE`**| Loan liability closed | Remove Sec 24(b) deduction | Term insurance liability reduced | $+\text{Freed EMI cashflow}$ | Redirect freed EMI cashflow to accelerated retirement | Re-allocate freed cashflow to long-term wealth compounding. (`/planning`) |
| **`INSURANCE_MATURITY`**| Policy maturity date | Section 10(10D) tax exemption check | Remove matured policy from active cover shield | $+\text{Lump sum payout}$ | Allocate lump sum across existing goal deficits | Re-deploy maturity proceeds according to asset allocation. (`/portfolio`) |
| **`RETIREMENT`** | Target age reached | Shift to post-retirement tax bracket | Transition to senior health floater | Shift from SIP accumulation to SWP drawdown | Goal status marked `ACHIEVED`; activate annuity | Transition portfolio from accumulation to systematic drawdown. (`/planning/retirement`) |
| **`DEATH_OF_MEMBER`** | Demise declaration | Final return filing guidance | Expedite term insurance claim settlement | Release emergency survival liquidity | Reassign goal ownership to surviving head | Activate Emergency Survival Mode & claim settlement dossier. (`/estate`) |
| **`MAJOR_INHERITANCE`**| Asset transfer deed | Capital gains base adjustment | Evaluate estate asset protection | $+\text{Lump sum asset value}$ | Advance timeline on long-term family goals | Stage tax-efficient deployment into diversified portfolio. (`/estate`) |

---

## 2. Invariant Rules for Consequence Calculations

1. **Non-Invention of Missing Facts**: If `monthlyEmi` or `loanAmount` is not provided in a `HOME_PURCHASE` event, cashflow impacts evaluate to `0` with explicit `INSUFFICIENT_DATA` warning flags.
2. **Versioned Tax Rules**: Tax calculations evaluate against versioned rules (`ruleVersion: '2026.1'`) reflecting current Indian tax code (Old vs New Regime, Section 24(b), Section 80C, Section 10(10D)).
3. **Reproducibility Guarantee**: Given identical event facts and baseline Digital Twin state hash ($H_{\text{state}}$), the consequence calculation produces identical output.
