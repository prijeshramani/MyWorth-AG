# Permanent Product Management Workflow

## Overview
FamilyWealthOS enforces strict product management and change governance principles. All features, UX improvements, bugs, and release logs must be permanently tracked in the root `ROADMAP.md` and the `product/` governance repository.

---

## Product Governance Structure

```
product/
├── UX_BACKLOG.md           # UX enhancements & UI polish logs
├── BETA_BUGS.md            # Verified beta bugs & resolution history
├── FEATURE_REQUESTS.md     # Feature request tracker
├── AI_BACKLOG.md           # AI skills & pipeline enhancements
├── RELEASE_NOTES.md        # Official version release notes
└── KNOWN_LIMITATIONS.md    # Product guardrails & technical limits
```

---

## Change Governance Rules
Every completed sprint or major feature implementation must update:
1. `ROADMAP.md` (Version, Phase Status, ADRs, Metrics)
2. `product/RELEASE_NOTES.md` (User-facing release highlights)
3. `product/AI_BACKLOG.md` (AI skills & pipeline progress)
4. `AI_CHANGELOG.md` (Technical implementation log)
5. `SESSION_CONTEXT.md` (Active session context tracking)
