# Life Events Data Model & Schema Reference

## 1. Relational Database Schema (`life_events`)

```sql
CREATE TABLE IF NOT EXISTS life_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  status TEXT CHECK(status IN ('DETECTED', 'VERIFIED', 'PROCESSED', 'DISMISSED')) DEFAULT 'DETECTED',
  event_version INTEGER NOT NULL DEFAULT 1,
  declared_at TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  declared_by_member_id INTEGER,
  confidence_pct REAL NOT NULL DEFAULT 100.0,
  evidence_completeness_pct REAL NOT NULL DEFAULT 100.0,
  event_payload_json TEXT NOT NULL DEFAULT '{}',
  evidence_payload_json TEXT NOT NULL DEFAULT '{}',
  impact_summary_json TEXT NOT NULL DEFAULT '{}',
  baseline_state_hash TEXT,
  baseline_as_of TEXT,
  rule_version TEXT DEFAULT '2026.1',
  calculation_version TEXT DEFAULT '1.0.0',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  dismissed_at TEXT,
  dismiss_reason TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

CREATE INDEX IF NOT EXISTS idx_life_events_family_status ON life_events(family_id, status);
CREATE INDEX IF NOT EXISTS idx_life_events_family_type ON life_events(family_id, event_type);
```

---

## 2. TypeScript Interfaces & DTO Contracts

### `LifeEventDeclarationInput`
```typescript
interface LifeEventDeclarationInput {
  familyId: number;
  eventType: LifeEventType;
  eventTitle: string;
  eventDate: string; // YYYY-MM-DD
  evidenceDetails?: Record<string, any>;
  declaredByMemberId?: number;
}
```

### `LifeEventCandidate`
```typescript
interface LifeEventCandidate {
  candidateId: string;
  familyId: number;
  eventType: LifeEventType;
  confidencePct: number; // 0 - 100
  detectedAt: string; // ISO-8601
  triggerSource: string;
  evidence: Record<string, any>;
  status: 'DETECTED' | 'VERIFIED' | 'PROCESSED' | 'DISMISSED';
}
```

### `LifeEventConsequence`
```typescript
interface LifeEventConsequence {
  eventId: string;
  eventType: LifeEventType;
  taxImpact: {
    deductionHeadroomDelta: number;
    taxLiabilityDelta: number;
    regimeRecommendation: 'OLD' | 'NEW' | 'UNCHANGED';
  };
  protectionImpact: {
    additionalTermCoverRequired: number;
    additionalHealthCoverRequired: number;
  };
  cashflowImpact: {
    monthlySurplusDelta: number;
    recommendedSipAdjustment: number;
  };
  goalImpact: {
    newGoalsRecommended?: string[];
    timelineShiftYears?: number;
  };
  actionSummary: string;
  suggestedActionPath?: string;
}
```
