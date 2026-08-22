# Family Digital Twin Architecture

## 1. Concept & Purpose

The **Family Digital Twin** is the living, computable virtual representation of a family office. It aggregates the tangible balance sheet, legal structures, income streams, insurance risk shields, estate succession plans, and human relationships into a single coherent state machine.

Rather than maintaining a separate disconnected duplicate database, the Digital Twin is an **orchestrated semantic overlay** backed by the authoritative SQLite database and the **Knowledge Graph** (`graph_nodes` & `graph_edges`).

---

## 2. Conceptual Domain Model

```
                           [ FAMILY / HOUSEHOLD ]
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
   [ FAMILY MEMBERS ]                                   [ LEGAL ENTITIES ]
     - Personal Info                                      - HUF / Private Trust
     - PAN / Tax Status                                   - LLC / Partnership
     - Risk Tolerance                                     - Holding Co.
           |                                                   |
           +-------------------------+-------------------------+
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
      [ CASHFLOW & INCOME ]     [ ACCOUNTS ]          [ ASSETS & WEALTH ]
       - Salary / Business       - Savings / Current   - Stocks / Mutual Funds
       - Rental / Dividends      - Demat / Trading     - US Equities / Gold
       - Annuities / Pension     - Wallets / Escrow    - Real Estate / EPF/PPF/NPS
             |                       |                       |
             +-----------------------+-----------------------+
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
      [ LIABILITIES ]          [ PROTECTION ]           [ GOALS & RETIREMENT ]
       - Home Loans              - Term Life Cover       - Child Education
       - Vehicle / Personal      - Health Floater        - Retirement Target
       - Credit Card Debt        - Critical Illness      - Milestone Corpus
             |                       |                       |
             +-----------------------+-----------------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
             v                                               v
      [ TAX & STATUTORY ]                             [ ESTATE & SUCCESSION ]
       - Slabs & Regime (Old/New)                      - Registered Wills
       - 80C/80D/80CCD Headroom                        - Designated Beneficiaries
       - Realized LTCG/STCG                            - Appointed Executors/Witnesses
```

---

## 3. Data Inventory & Mapping Matrix

| Domain Element | Current Persistence (SQLite) | Knowledge Graph Node / Edge | Derived Dynamically (Engine) | Proposed Phase 8 Extensions |
| :--- | :--- | :--- | :--- | :--- |
| **Family Members** | `family_members` (`id`, `name`, `pan`, `relationship`) | `PERSON` node (`NodeId: member_{id}`) | Age, Life Stage, Primary Earner status | Risk Profiling, Retirement Target Age |
| **Legal Entities** | `entities` (`id`, `entity_name`, `entity_type`) | `ENTITY` node (`NodeId: entity_{id}`) | Aggregate entity net worth | HUF / Trust Deed metadata |
| **Income Streams** | `tax_income_sources` | `INCOME_SOURCE` node | Annual Gross Income, Taxable Base | Frequency-based cashflow cadence |
| **Bank / Demat A/cs** | `accounts`, `assets` (`type: BANK_ACCOUNT`) | `ACCOUNT` node $\xrightarrow{\text{HELD\_BY}}$ `PERSON` | Available liquid cash, 6M emergency reserve | Real-time automated balance sync |
| **Asset Holdings** | `assets`, `holdings`, `asset_prices`, `assets_master` | `ASSET` node $\xrightarrow{\text{OWNED\_BY}}$ `PERSON` | NAV, Cost Basis, Unrealized Gain, Accrued FD Interest | Multi-currency consolidated valuation |
| **Liabilities & Debt** | `assets` (`category: REAL_ESTATE` notes/loans) | `LIABILITY` node $\xrightarrow{\text{OWED\_BY}}$ `PERSON` | Total Debt, Debt-to-Asset ratio, Monthly EMI load | Dedicated `liabilities` table |
| **Insurance Shield** | `insurance_policies` (`sum_assured`, `policy_type`) | `POLICY` node $\xrightarrow{\text{COVERS}}$ `PERSON` | Human Life Value (HLV) gap, Health adequacy | Claim ratio scoring & premium reminders |
| **Financial Goals** | `financial_goals`, `goal_allocations` | `GOAL` node $\xrightarrow{\text{TARGETED\_BY}}$ `PERSON` | Goal On-Track %, Required Monthly SIP | Dynamic inflation adjustor |
| **Tax Intelligence** | `tax_profiles`, `tax_deductions`, `tax_rules` | `TAX_PROFILE` node | 80C headroom, LTCG tax liability, Old vs New regime | Automated Form 26AS/AIS reconciliation |
| **Estate & Wills** | `wills`, `will_versions`, `trusts`, `beneficiaries` | `WILL` node $\xrightarrow{\text{ALLOCATES}}$ `ASSET` | Estate Health Score, Intestacy Risk | Asset-Nominee cross-reconciliation matrix |

---

## 4. Digital Twin Semantic Schema (`DigitalTwinContextDTO`)

```typescript
export interface DigitalTwinState {
  familyId: number;
  timestamp: string;
  version: string;
  
  // 1. Structure & Identity
  lineage: {
    primaryTestator: FamilyMemberDTO;
    members: FamilyMemberDTO[];
    entities: LegalEntityDTO[];
    relationships: GraphEdgeDTO[];
  };

  // 2. Balance Sheet
  balanceSheet: {
    grossAssets: number;
    totalLiabilities: number;
    netWorth: number;
    liquidReserves: number;
    emergencyFundMonths: number;
    assetDistribution: Record<AssetCategory, number>;
  };

  // 3. Risk & Protection Shield
  protection: {
    activeTermCover: number;
    requiredHlvCover: number;
    hlvGap: number;
    healthCoverTotal: number;
    isAdequate: boolean;
    uninsuredMembers: number[];
  };

  // 4. Financial Trajectory
  trajectory: {
    activeGoals: GoalTrajectoryDTO[];
    retirementCorpusTarget: number;
    projectedRetirementAge: number;
    savingsRatePct: number;
  };

  // 5. Tax & Estate Posture
  governance: {
    currentFy80CUtilized: number;
    currentFy80CHeadroom: number;
    projectedTaxLiability: number;
    willRegistered: boolean;
    estateHealthScore: number;
    unassignedNomineeAssetCount: number;
  };
}
```

---

## 5. Architectural Guardrails
1. **Single Source of Truth**: The Digital Twin is never a separate database duplicate. It is hydrated on demand by the `DigitalTwinService` from authoritative tables.
2. **Knowledge Graph Integration**: Complex N-to-N relationships (e.g., *Dhvani owns 50% of Property X which is mortgaged with HDFC Bank under Loan Y with Prijesh as co-borrower and Vivaan as primary nominee*) are modelled as directed graph edges in `graph_edges`.
3. **Reactive Invalidation**: When any transaction, policy, asset, or family member record is added, updated, or deleted, the Digital Twin cache invalidates immediately.
