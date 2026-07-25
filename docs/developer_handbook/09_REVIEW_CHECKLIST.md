# 📖 09_REVIEW_CHECKLIST.md — Code & Architecture Review Checklists

**Document Purpose**: Provide standardized code review checklists for peer reviews and AI self-audits in Family Wealth OS.  
**Target Audience**: Software Engineers, Code Reviewers, AI Coding Assistants  
**Status**: Active Engineering Standard  

---

## 1. Executive Summary

Every Pull Request submitted to Family Wealth OS must pass a rigorous, multi-axis review. Reviewers (human or AI) must systematically audit changes against six specialized checklists: Architecture, Security, Performance, UI/UX & Accessibility, Financial Correctness, and Documentation.

---

## 2. Review Checklists

### 2.1 🏗 Architecture Review Checklist
- [ ] Conforms to `TARGET_ARCHITECTURE.md` layered pattern (`Controller -> Service -> Repository -> SQLite`).
- [ ] No raw SQL queries inside Express routes or React UI components.
- [ ] Business logic isolated inside Domain Services (`src/services/`).
- [ ] New architectural patterns or library additions documented via an ADR in `docs/ARCHITECTURE_DECISIONS.md`.
- [ ] Bounded Context boundaries respected; no data leakage across modules.

### 2.2 🔒 Security Review Checklist
- [ ] Express server bound strictly to `127.0.0.1` loopback interface.
- [ ] CORS policies restricted exclusively to `http://localhost:5173`.
- [ ] Stored credentials and sensitive tokens encrypted using AES-256-GCM.
- [ ] Zero plain-text diagnostic log dumps written to disk (`raw_cams_text.txt` checked).
- [ ] 100% of database queries use parameterized prepared statements (No SQL injection).
- [ ] Zod schema validation applied to all REST request payloads.

### 2.3 ⚡ Performance Review Checklist
- [ ] No N+1 database queries inside loop callbacks (`.map()`, `for...of`).
- [ ] Database queries execute in under 50ms.
- [ ] Indexes present for all foreign key joins and frequently queried columns (`asset_id`, `date`, `type`).
- [ ] React components prevent unnecessary re-render loops using React Query caching and Zustand stores.

### 2.4 🎨 UI / UX & Accessibility Review Checklist
- [ ] Adheres to dark glassmorphic styling system and Tailwind tokens.
- [ ] React component files stay under 200 lines.
- [ ] Interactive UI elements support full keyboard navigation (`Tab`, `Enter`, `Escape`).
- [ ] Form controls include descriptive labels and `aria-*` attributes.
- [ ] Visual error states caught gracefully by `FeatureErrorBoundary`.

### 2.5 💰 Financial Correctness Review Checklist
- [ ] Unit balances, cost basis, valuations, and return percentages match precision checks.
- [ ] Currency values rounded cleanly to 2 decimal places in UI display.
- [ ] FIFO tax lot assignment logic verified for stock and mutual fund sales.
- [ ] Zero division by zero or NaN errors under zero-balance or empty transaction states.
- [ ] Automated unit tests cover 100% of calculation code paths.

### 2.6 📚 Documentation Review Checklist
- [ ] Code comments explain non-obvious algorithms or financial edge cases.
- [ ] API endpoint modifications documented in `API_MIGRATION_PLAN.md`.
- [ ] `.ai/SESSION_CONTEXT.md` updated with modified files, rationale, and next task.
- [ ] Git commit messages follow Conventional Commits standard (`type(scope): summary`).
