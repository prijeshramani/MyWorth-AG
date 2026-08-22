# Family Financial Health (FFH) Score Architecture

## 1. Concept & Unified Index Philosophy

The **Family Financial Health (FFH) Index** is a 0–100 composite fiduciary metric. It does **NOT** replace individual domain engines (e.g. Estate Health, Goal Health, Protection Adequacy); instead, it acts as an **executive aggregator** that weights each domain based on family life stage, solvency risk, and governance integrity.

```
+---------------------------------------------------------------------------------------+
|                    UNIFIED FAMILY FINANCIAL HEALTH SCORE (0 - 100)                    |
+---------------------------------------------------------------------------------------+
        |                  |                 |                  |                 |
        v                  v                 v                  v                 v
  [ PROTECTION ]     [ LIQUIDITY ]     [ RETIREMENT ]     [ ESTATE & WILL ]  [ TAX & DATA ]
     (Weight: 25%)      (Weight: 20%)     (Weight: 20%)      (Weight: 15%)     (Weight: 20%)
```

---

## 2. Pillar Weightings, Formulas & Minimum Data Rules

| Pillar Domain | Sub-Score Component | Weight | Deterministic Formula / Underlying Engine | Minimum Data Required | Missing Data Penalty |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Protection & Insurance** | Term Life Cover + Health Shield | **25%** | $\min(100, (\text{TermCover} / \text{HLV Target}) \times 60 + (\text{HealthCover} / \text{Target}) \times 40)$ | At least 1 active earning member | Defaults to 20/100 (Unprotected Risk) |
| **2. Liquidity & Emergency** | Liquid Cash vs Monthly Burn | **20%** | $\min(100, (\text{LiquidReserves} / (\text{MonthlyBurn} \times 6)) \times 100)$ | Bank account balance + 30-day expense ledger | Defaults to 50/100 (Assumes 3-month baseline) |
| **3. Goals & Retirement** | Goal Trajectory & Wealth Pace | **20%** | Average of active goal probability scores from `GoalPlanningService` | At least 1 registered financial goal | Defaults to 60/100 (General growth mode) |
| **4. Estate & Succession** | Will Status, Nominees, Trusts | **15%** | Direct score from `EstateHealthService.calculateEstateHealth(familyId)` | Family members + Asset ownership | Score accurately computed as 0–25% |
| **5. Tax & Asset Quality** | 80C Utilization & Asset Hygiene| **20%** | $(\text{80C Utilized} / 150000) \times 50 + \text{DataQualityScore} \times 50$ | Asset holding ledger + Tax profile | Pro-rated on known data points |

---

## 3. Dynamic Life-Stage Weight Rebalancing

The FFH aggregator dynamically adapts weight distribution depending on the primary earner's life stage:

```typescript
export function getDynamicHealthWeights(lifeStage: 'EARLY_CAREER' | 'FAMILY_EXPANSION' | 'WEALTH_PRESERVATION' | 'RETIREMENT') {
  switch (lifeStage) {
    case 'EARLY_CAREER': // Age < 32
      return { protection: 0.20, liquidity: 0.30, retirement: 0.25, estate: 0.05, taxAndData: 0.20 };
    case 'FAMILY_EXPANSION': // Age 32-50 (Default)
      return { protection: 0.25, liquidity: 0.20, retirement: 0.20, estate: 0.15, taxAndData: 0.20 };
    case 'WEALTH_PRESERVATION': // Age 50-65
      return { protection: 0.20, liquidity: 0.15, retirement: 0.25, estate: 0.25, taxAndData: 0.15 };
    case 'RETIREMENT': // Age > 65
      return { protection: 0.10, liquidity: 0.30, retirement: 0.20, estate: 0.30, taxAndData: 0.10 };
  }
}
```

---

## 4. Historical Tracking & Delta Attribution

The system records periodic snapshots into `family_health_history`:

```sql
CREATE TABLE IF NOT EXISTS family_health_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  overall_score REAL NOT NULL,
  protection_score REAL NOT NULL,
  liquidity_score REAL NOT NULL,
  retirement_score REAL NOT NULL,
  estate_score REAL NOT NULL,
  tax_score REAL NOT NULL,
  confidence_pct REAL NOT NULL,
  calculated_at TEXT DEFAULT (datetime('now')),
  delta_summary TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id)
);
```

When a score shifts by $\pm 3$ points, the system automatically writes a plain-English delta explanation (e.g. *"Health Score increased from 78 to 84 due to new ICICI Prudential Term Policy covering the ₹1.2 Cr HLV gap"*).
