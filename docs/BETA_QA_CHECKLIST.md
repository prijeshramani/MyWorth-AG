# FamilyWealthOS — Beta QA Checklist (Phase 7E)

## 1. Functional QA Verification Matrix

| Module | Verification Step | Outcome |
| :--- | :--- | :--- |
| **AIMissionControl** | Verify AI Morning Briefing card rendering with net worth delta | PASS |
| **Global Search** | Press `Ctrl+K`, query assets, members, policies with arrow navigation | PASS |
| **Notification Center** | Click Bell icon in TopNavbar, filter `ALL`/`UNREAD`, trigger actions | PASS |
| **Portfolio Overview** | Filter by family member, compare Cost Basis vs Current Value | PASS |
| **Protection Dashboard** | Register new policy (Term Life / Health), toggle Table/Grid view | PASS |
| **Reports Generator** | Export PDF statement, open in Adobe Acrobat Reader without errors | PASS |
| **Knowledge Graph** | Inspect relationship nodes, search graph, export PNG diagram | PASS |
| **Theme Switcher** | Toggle Sun/Moon switch, verify readable contrast in Light & Dark modes | PASS |
| **Settings Console** | Verify high contrast on "Revoke All Sessions" button | PASS |

---

## 2. Beta Regression Assurance
- **Database Reset**: `npm run db:reset` cleanly runs migrations `001` through `011`.
- **Test Suite**: `cd backend && npm test` passes 214+ test assertions.
