# AI Explainability & Fiduciary Lineage Architecture

## 1. The Fiduciary Explainability Standard

In wealth management, opaque "black-box" AI recommendations erode user trust. A recommendation without proof is an unacceptable risk. 

FamilyWealthOS implements the **5-Point Fiduciary Lineage Standard**:
Every insight, score, and action emitted by the system must provide complete mathematical, rule-based, and evidence-backed transparency.

```
+---------------------------------------------------------------------------------------+
|                                1. RECOMMENDATION                                      |
|            "Increase Term Life Insurance by ₹50.0 Lakhs for Prijesh"                  |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                2. THE "WHY?" SUMMARY                                  |
| "Current term cover of ₹2.0 Cr is below your Human Life Value requirement of ₹2.5 Cr"|
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                3. AUTHORITATIVE EVIDENCE                              |
|   - Active Term Policies: LIC (₹1.2 Cr) + Max Life (₹80L) = Total: ₹2.0 Cr            |
|   - Annual Salary Income: ₹24,00,000 | Outstanding Debt: ₹15,00,000                   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                4. CALCULATION ENGINE & RULE                           |
|   - Engine: ProtectionEngineService v2.4 (HLV Income Replacement Multiple Method)    |
|   - Rule: `PROTECTION_TERM_UNDERINSURED` (10x Annual Income + Debt - Liquid Assets)   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                           5. DATA FRESHNESS & CONFIDENCE                              |
|   - Freshness: Statements synced 16 Aug 2026 | Confidence Score: 96.0% (Deterministic)|
+---------------------------------------------------------------------------------------+
```

---

## 2. Technical Schema (`ExplanationDTO`)

```typescript
export interface ExplainabilityLineageDTO {
  recommendationId: number;
  ruleCode: string;
  category: 'INVESTMENT' | 'PROTECTION' | 'TAX' | 'ESTATE' | 'PLANNING';
  
  // 1. Plain English Statement
  headline: string;
  detailedWhy: string;

  // 2. Underlying Authoritative Evidence
  evidence: Array<{
    label: string;
    value: string | number;
    sourceTable: string;
    sourceRecordId?: number;
    lastUpdated: string;
  }>;

  // 3. Mathematical Formula / Engine Specification
  engineName: string;
  engineVersion: string;
  formulaDescription: string;
  mathParameters: Record<string, number | string>;

  // 4. Governance & Confidence
  confidencePct: number;
  dataFreshnessTimestamp: string;
  isDeterministic: boolean; // True if calculated purely by code engine without LLM sampling

  // 5. Suggested Actionable Path
  action: {
    label: string;
    targetRoute: string;
    prefillPayload?: Record<string, any>;
  };
}
```

---

## 3. Explainability Drawer UI Component Contract

When the user clicks the `( ? ) Why this recommendation?` badge on any card in the Command Center or Recommendations Dashboard:

1. **Slide-Out Inspection Drawer**: Opens from the right side without navigating away from the dashboard.
2. **Formula Visualizer**: Shows the exact mathematical equation with actual numbers plugged into variables.
3. **Source Breadcrumbs**: Displays clickable links to the underlying assets, bank accounts, or insurance policies that contributed to the calculation.
4. **Data Verification Badge**: Displays green lock indicator (*"Verified Against SQLite Local Ledger"*).
