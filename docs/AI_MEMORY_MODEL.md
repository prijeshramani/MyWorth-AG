# AI Memory & Context Boundary Architecture

## 1. Fiduciary Memory Philosophy & Strict Tier Separation

In financial advisory systems, catastrophic hallucinations occur when an AI treats its own previous generated text as verified financial truth. To prevent this, FamilyWealthOS enforces a **4-Tier Strict Separation of Memory**.

```
+---------------------------------------------------------------------------------------+
|  TIER 1: AUTHORITATIVE FINANCIAL EVIDENCE (Immutable Database Truth)                 |
|  - Real ledger balances, trade transactions, registered policies, verified PANs       |
|  - Source: SQLite tables via calculation engines. (NEVER OVERWRITTEN BY AI)           |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|  TIER 2: EXPLICIT USER PREFERENCES & MANDATES (User-Authored Fiduciary Intent)        |
|  - Risk tolerance (Conservative/Aggressive), ethical exclusions, target retirement    |
|  - Source: User settings & profile form inputs. Full user edit/delete access.         |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|  TIER 3: AI CONVERSATION EPISODIC MEMORY (Context Window Continuity)                  |
|  - Short-term conversational context, previous questions in active session.           |
|  - Source: `ai_conversation_state`. Flushed on session end or manual clear.           |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|  TIER 4: AI DERIVED INSIGHTS & HYPOTHESES (Provisional Reasoning Layer)               |
|  - Pattern inferences (e.g. "User seems interested in Sovereign Gold Bonds").         |
|  - STRICT ISOLATION: Must NEVER become authoritative balance sheet evidence.          |
+---------------------------------------------------------------------------------------+
```

---

## 2. Memory Governance Matrix

| Memory Category | What May Be Stored | What Must NEVER Be Stored | Retention Policy | User Visibility & Control | Source Lineage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Financial Truth** | Actual balances, transactions, policy numbers, asset holdings. | Unverified guesses, projected estimates disguised as actuals. | Permanent (Managed via Ledger DB) | Visible in Portfolio / Ledger; immutable to AI. | Bank / Broker / CAMS statements |
| **Tier 2: User Mandates** | Preferred retirement age (58), ESG/Ethical constraints, asset limits. | Inferred psychological assumptions without user confirmation. | Persistent until modified by user | 100% editable in Settings Console. | User form submission |
| **Tier 3: Dialogue Memory** | Last 10 user chat exchanges, clarified user queries in session. | Plaintext passwords, 2FA tokens, full PAN credentials. | 30 Days (Rolling session expiry) | One-click "Purge AI Chat History" button. | Chat interface interaction |
| **Tier 4: Derived Hypotheses**| Tagged topic interests (e.g. `INTEREST_NPS_TIER2`, `RISK_CONSERVATIVE`). | Financial figures (e.g. AI must NOT store "User net worth is ₹1 Cr"). | 90 Days (Requires re-verification) | Visible in "What AI Knows About Me" panel. | Derived from interaction patterns |

---

## 3. "Why Does AI Know This?" Explainability Lineage

Every time the AI presents an insight or memory-driven recommendation, it provides an interactive provenance badge:

```typescript
export interface AIMemoryProvenance {
  factKey: string;
  tier: 'TIER_1_EVIDENCE' | 'TIER_2_PREFERENCE' | 'TIER_4_DERIVED';
  value: string;
  sourceTableOrOrigin: string;
  recordedAt: string;
  confidenceScore: number;
  userCorrectionPath: string;
}
```

### Example UI Inspector:
> **Question**: *"Why did AI suggest NPS Tier-1 tax savings for Prijesh?"*
> - **Source 1 (Tier 1 Evidence)**: Salary income is in the 30% tax bracket (`tax_income_sources`).
> - **Source 2 (Tier 1 Evidence)**: Section 80C is 100% maximized at ₹1,50,000 (`assets`).
> - **Source 3 (Tier 2 User Mandate)**: User preferred Old Tax Regime for FY2025-26 (`tax_profiles`).
> - **Engine Rule**: Section 80CCD(1B) provides an additional ₹50,000 deduction exclusively for NPS.

---

## 4. User Privacy & Right to Erasure / Correction
1. **Memory Inspector Console**: A dedicated modal under Settings allowing users to review every persisted Tier 2 & Tier 4 memory key.
2. **One-Click Memory Purge**: Users can reset episodic AI memory without affecting financial database records.
3. **Local Encryption**: All AI memory caches are stored in the local SQLite database file (`data/myworth.db`) with zero remote cloud syncing.
