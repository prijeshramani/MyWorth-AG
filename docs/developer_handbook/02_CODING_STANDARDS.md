# 📖 02_CODING_STANDARDS.md — Developer Coding & Style Standards

**Document Purpose**: Define unified coding conventions, style rules, folder naming, file structures, and TypeScript standards for Family Wealth OS.  
**Target Audience**: Software Engineers, Code Reviewers, AI Coding Assistants  
**Status**: Active Engineering Standard  

---

## 1. Naming Conventions

| Artifact Category | Convention | Example |
| :--- | :--- | :--- |
| **Folders (Backend & Frontend)** | `kebab-case` or lowercase | `src/features/portfolio/`, `src/services/` |
| **Component Files (React)** | `PascalCase.tsx` | `PortfolioHeader.tsx`, `AssetTable.tsx` |
| **Non-Component Files (TS)** | `camelCase.ts` | `taxLotService.ts`, `assetRepository.ts` |
| **Interfaces** | `PascalCase` (Prefix `I` for DAOs) | `IAssetRepository`, `AssetHolding` |
| **Types & DTOs** | `PascalCase` | `CreateAssetDto`, `TaxLotSummary` |
| **Enums** | `PascalCase` (Name) / `UPPER_SNAKE` (Values)| `enum AssetType { MUTUAL_FUND = 'MUTUAL_FUND' }` |
| **Repositories** | `*Repository.ts` | `SQLiteAssetRepository.ts` |
| **Services** | `*Service.ts` | `ValuationService.ts` |
| **Controllers / Routes** | `*Controller.ts` or `*Router.ts` | `assetRouter.ts` |
| **Custom React Hooks** | `use*` (camelCase) | `usePortfolioAssets.ts` |
| **Database Tables & Columns** | `snake_case` | `family_members`, `account_number` |

---

## 2. Backend Coding Standards

### 2.1 TypeScript Configuration & Strictness
- `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `forceConsistentCasingInFileNames: true`.
- Never use `any` type in new code. Define explicit Zod schemas or TypeScript interfaces.

### 2.2 Layering & Responsibility Rules
1. **Controllers (`src/controllers/` or `src/routes/`)**:
   - MUST ONLY handle HTTP request parsing, safe Zod validation, calling domain services, and returning HTTP responses.
   - MUST NOT execute raw SQL queries (`db.prepare(...)`).
   - MUST NOT perform complex financial calculations inline.
2. **Services (`src/services/`)**:
   - Pure domain business logic.
   - Decoupled from Express `req` and `res` objects.
   - Must throw domain-specific errors (`ValidationError`, `NotFoundError`) caught by central error middleware.
3. **Repositories (`src/repositories/`)**:
   - Encapsulate all database interaction (`better-sqlite3`).
   - Implement typed interface contracts (`IAssetRepository`).
   - Cache prepared statements for maximum query performance.

---

## 3. Frontend Coding Standards

### 3.1 React 19 Component Architecture
- Use functional components with explicit TypeScript prop interfaces.
- Keep UI components small (< 200 lines). Extract sub-components and custom hooks when files exceed 200 lines.
- **Server State**: Managed via **TanStack Query (React Query v5)** hooks (`useQuery`, `useMutation`). Never perform manual `useEffect` data fetching in components.
- **Global UI State**: Managed via **Zustand** stores (`useUIStore`).
- **API Requests**: Executed through centralized typed Axios client (`src/api/apiClient.ts`). Hardcoded `'http://localhost:5000'` strings are strictly forbidden.

### 3.2 Component Template Structure
```tsx
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { usePortfolioAssets } from '../hooks/usePortfolioAssets';

interface PortfolioHeaderProps {
  entityId: string;
  onRefresh?: () => void;
}

export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({ entityId, onRefresh }) => {
  const { data: assets, isLoading } = usePortfolioAssets(entityId);

  if (isLoading) return <div>Loading header metrics...</div>;

  return (
    <header className="p-6 bg-[#0c1221] border-b border-slate-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">Portfolio Overview</h1>
      </div>
    </header>
  );
};
```

---

## 4. Import Ordering Standard

Enforce consistent import group ordering separated by blank lines:

```typescript
// 1. External Node Modules & Frameworks
import React, { useState, useEffect } from 'react';
import { Router, Request, Response } from 'express';
import { z } from 'zod';

// 2. Third-Party Component / Utility Libraries
import { AreaChart, Area } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

// 3. Application Core, API Client & Store
import { apiClient } from '../api/apiClient';
import { useUIStore } from '../store/useUIStore';

// 4. Domain Services, Repositories & Utilities
import { ValuationService } from '../services/ValuationService';
import { formatCurrency } from '../utils/formattingUtils';

// 5. Types, Interfaces & Schemas
import { AssetHolding, AssetType } from '../types/assetTypes';
```

---

## 5. Error Handling, Logging & Code Comments

### 5.1 Error Handling
- Always handle promise rejections and database exceptions explicitly.
- Use central Express error middleware for backend REST endpoints.
- Use React Error Boundaries for frontend UI component failure isolation.

### 5.2 Logging
- Use structured log utility (`logger.info()`, `logger.error()`).
- Never log plain-text passwords, full PAN numbers, or unencrypted API secret keys.

### 5.3 Code Comments
- Write self-documenting code with clear variable and function names.
- Use JSDoc comments (`/** ... */`) for complex domain algorithms (e.g. XIRR, FIFO tax lot assignment).
- Comment *WHY* non-obvious decisions or edge cases exist, not *WHAT* the syntax does.

---

## 6. Formatting, ESLint & Prettier Rules

- **Indentation**: 2 Spaces (No tabs).
- **Line Length**: Max 120 characters.
- **Semicolons**: Mandatory.
- **Quotes**: Single quotes (`'`) for string literals; backticks (`` ` ``) for template strings.
- **Prettier & ESLint**: Automated formatting enforced via pre-commit hooks (`husky` + `lint-staged`).
