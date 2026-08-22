# Life Events Engine Architecture

## 1. Concept & Overview

In real family offices, wealth management decisions are not driven by daily market noise, but by **Life Events**. A child's birth changes life cover requirements, a new home introduces debt and alters liquidity, a salary bump increases investment capacity, and a retirement milestone triggers de-risking and annuity planning.

The **Life Events Engine** is an event-driven subsystem that:
1. Detects or accepts declaration of major life milestones.
2. Formulates deterministic mathematical consequence propagation across all financial domains.
3. Generates explainable, high-confidence fiduciary recommendations.
4. Requires explicit user approval before updating long-term plans.

```
+---------------------------------------------------------------------------------------+
|                                LIFE EVENT TRIGGER                                     |
|           (Explicit User Declaration OR Automated Transaction/Statement Evidence)     |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                              EVIDENCE & CONFIDENCE GATE                               |
|        - Minimum Evidence Verification       - Confidence Scoring (0 - 100%)          |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                         MULTI-DOMAIN CONSEQUENCE PROPAGATOR                           |
|   Tax Impact  -->  Protection HLV  -->  Cash Flow EMI  -->  Retirement  -->  Estate  |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                             PROACTIVE AI RECOMMENDATION                               |
|        - Evidence Traceability Lineage       - Fiduciary Action Proposal              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                          USER APPROVAL & TIMELINE COMMIT                              |
|        - Human Fiduciary Sign-off            - Permanent Audit Trail Entry            |
+---------------------------------------------------------------------------------------+
```

---

## 2. Comprehensive Event Catalog & Consequence Matrix

| Life Event Type | Detection Mechanism | Required Evidence | Impacted Domains | Confidence Threshold | AI Advisory Response | User Approval Required? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Child Birth / Adoption** | User declaration or hospital invoice/insurance addition | New family member added (`relationship: 'CHILD'`) | Protection (HLV, Health), Goals (Education), Estate (Will, Nominees) | 100% | Propose term cover upgrade (+₹50L), new Higher Education goal, and Will clause update | **YES** |
| **Marriage / New Spouse** | User declaration or joint bank account link | New family member added (`relationship: 'SPOUSE'`) | Tax (Joint filing/HUF), Protection, Estate (Spousal Will), Health Floater | 100% | Propose Family Floater insurance addition, Nominee updates, and HUF formation assessment | **YES** |
| **Salary Increase** | Monthly income credit spike in Bank/Form 16 import | 3 consecutive higher salary transaction credits (>15% increase) | Cashflow, Tax (New bracket/TDS), Goals (SIP step-up), Retirement | 90% | Recommend 50% surplus allocation to SIPs and calculate 80C/NPS 80CCD(1B) optimization | **YES** |
| **Job Change / Career Gap** | Salary credit source employer change or gap in monthly credits | Statement credit source change or missing salary for 60+ days | Cashflow, Emergency Fund, EPF Transfer, Gratuity | 85% | Advise EPF consolidation (UAN transfer), emergency buffer review, and temporary SIP pause | **YES** |
| **Home Purchase** | Large debit transaction + Property asset creation | Real estate asset registration + loan disbursement transaction | Net Worth, Cashflow (EMIs), Tax (Sec 24b, 80C principal), Liquidity | 95% | Factor Section 24(b) interest deduction (up to ₹2L), recalculate emergency fund for EMI load | **YES** |
| **Home Loan Closure** | Final loan repayment transaction / NOC upload | Loan asset balance $\to 0$ | Cashflow (Surplus freed), Credit, Goal Accrual | 98% | Redirect freed EMI cashflow toward accelerated retirement or child wealth compounding | **YES** |
| **Insurance Maturity / Payout**| Inward insurance claim or maturity credit | Policy maturity date reached + Bank credit matching payout | Liquidity, Re-investment, Tax (Sec 10(10D) exemption) | 95% | Suggest disciplined asset allocation strategy rather than keeping idle in savings account | **YES** |
| **Retirement Milestone** | Reaching target retirement age or user declaration | Age $\ge$ Target Retirement Age + Superannuation payout | Cashflow (SWP), Asset Allocation (De-risking), Tax, Health Cover | 100% | Shift portfolio from accumulation to Systematic Withdrawal Plan (SWP) and annuity security | **YES** |
| **Death of Family Member** | User emergency declaration or death certificate upload | User confirmation with date of demise | Estate (Probate, Will Execution), Insurance Claims, Nominee Transfer | 100% | Trigger **Emergency Survival Mode**, generate Step-by-Step Claim & Succession Dossier | **YES** (Strict Fiduciary Protocol) |
| **Major Inheritance** | Large unexpected asset/funds transfer | Probate order, asset transfer deed, or large lump-sum credit | Estate, Asset Allocation, Capital Gains Tax Base | 90% | Formulate multi-asset diversification plan with tax-efficient deployment staging | **YES** |

---

## 3. Detailed Event Propagation Workflow

### Example: Salary Increase Detected ($\Delta +25\%$)

```
1. Ingestion Layer:
   Bank statement import identifies salary credit increased from ₹2,00,000 to ₹2,50,000/month.
   
2. Life Events Engine Validation:
   Checks consistency over 2 consecutive salary cycles. Marks event `SALARY_INCREASE_CONFIRMED` (Confidence: 94%).

3. Consequence Propagation Engine:
   a. Tax Engine: Recalculates projected FY tax liability under Old vs New Tax Regime.
   b. Cashflow Engine: Calculates freed monthly investable surplus: +₹35,000/month.
   c. Goal Planning Engine: Simulates +15% step-up across active goals (Child Education goal completion accelerates by 2.4 years).
   d. Protection Engine: Adjusts Human Life Value target (+₹50L required term shield to match higher income replacement).

4. Proactive AI Recommendation Card:
   - "Your monthly income increased by ₹50,000. We recommend stepping up SIPs by ₹25,000 and allocating ₹10,000 to NPS Tier-1 for ₹31,200 additional tax savings."

5. User Action & Audit:
   - User clicks "Accept & Update Goals".
   - Transaction logged into `life_events` and `ai_audit_trail`.
```

---

## 4. Technical Schema (`life_events`)

```sql
CREATE TABLE IF NOT EXISTS life_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  status TEXT CHECK(status IN ('DETECTED', 'VERIFIED', 'PROCESSED', 'DISMISSED')) DEFAULT 'DETECTED',
  confidence_pct REAL NOT NULL DEFAULT 100.0,
  evidence_json TEXT NOT NULL,
  impact_summary_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id)
);
```
