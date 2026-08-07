# FamilyWealthOS — Search Architecture Specification (Phase 7E)

## Architecture Overview
The dynamic backend `SearchService` executes multi-entity queries against SQLite:
- **Entities Indexed**: Assets, Family Members, Insurance Policies, Bank & Demat Accounts, Tax Optimizations, Estate Wills, Reports, and Knowledge Graph Nodes.
- **Relevance Scoring**: Prefix match ($100$), Keyword match ($85$), Categorical match ($70$).
- **Keyboard Navigation**: `Ctrl+K` modal trigger, `ArrowUp`/`ArrowDown` item selection, `Enter` navigation dispatch, `Escape` close.
