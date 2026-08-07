# FamilyWealthOS — Architectural & Design Decisions (Phase 7E)

## Key Design Decisions
1. **Local-First Executable Architecture**: No external cloud database required; all queries operate directly on local SQLite.
2. **Universal Glassmorphism Tokens**: High-contrast CSS variable tokens (`card-glass`, `glass-card-base`) for crisp, readable layouts in both Light and Dark themes.
3. **Client-Side Binary PDF Generation**: `jsPDF` stream generation for 100% Adobe Acrobat compliance without browser print engine dependencies.
4. **Idempotent Recommendation Engine**: Update existing active recommendations in place to prevent database record inflation.
