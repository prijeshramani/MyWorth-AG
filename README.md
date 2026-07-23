# 📈 MyWorth — Local-First Net Worth & Portfolio Aggregator

**MyWorth** is a privacy-first, local-first net worth tracker, portfolio aggregator, and cash flow analyzer built for Indian and global investors. It consolidates mutual funds, Indian equities (Zerodha, AngelOne, INDmoney), EPF (Provident Fund), NPS, Gold, Real Estate, and Bank Statements into a single unified local dashboard with **zero cloud dependencies** and **100% data privacy**.

---

## 📌 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [How to Run the Project](#-how-to-run-the-project)
3. [Key Screens & Features Breakdown](#-key-screens--features-breakdown)
4. [Database Architecture & Schema](#-database-architecture--schema)
5. [Parsers & Integrations](#-parsers--integrations)
6. [🧠 AI Agent Context & Developer Guide](#-ai-agent-context--developer-guide)

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 (TypeScript) + Vite 8
- **Styling**: Vanilla CSS + Tailwind CSS (v3 with custom dark theme, HSL color tokens, glassmorphism)
- **Charts & Data Viz**: Recharts (Interactive Area, Line, Bar, and Donut/Pie Charts)
- **Icons**: Lucide React
- **Animations**: Canvas Confetti (UX feedback for actions & ingestion)

### Backend
- **Runtime**: Node.js (v18+) with TypeScript (`ts-node-dev` for hot-reloading)
- **HTTP Server**: Express.js (REST API operating on port `5000`)
- **Database**: SQLite 3 via `better-sqlite3` (stored locally in `data/myworth.db` with automated foreign key self-healing & schema migrations)
- **Validation**: Zod (Runtime payload and schema validation)
- **FileUploads**: Multer (Handling PDF, CSV, and Excel file uploads in memory)

### Statement Parsers & Data Sync
- **PDF Extraction**: `pdfjs-dist` (Extracts text & tabulates CAMS/KFintech CAS PDFs and EPFO passbooks)
- **Excel & CSV Parsing**: `xlsx` (Parses bank statements, AngelOne tradebooks, INDmoney reports)
- **Market Data Sync**: `axios` (Syncs daily Mutual Fund NAVs from AMFI and live Stock/Gold prices via Yahoo Finance APIs)

### Monorepo Orchestration
- **Concurrently**: Single-command launcher orchestrating backend and frontend dev processes simultaneously with color-coded terminal outputs.

---

## 🚀 How to Run the Project

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 2. First-Time Setup
Install all dependencies for both the root orchestrator, backend, and frontend with a single command:
```bash
npm run install-all
```

### 3. Start Development Server (Recommended)
From the root directory, start both the Express Backend and Vite Frontend concurrently:
```bash
npm run dev
# OR
npm start
```
- **Frontend App**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000`

### 4. Alternative Individual Commands
If you prefer running services in separate terminal windows:
- **Run Backend only**: `npm run backend` *(from root)* or `cd backend && npm run dev`
- **Run Frontend only**: `npm run frontend` *(from root)* or `cd frontend && npm run dev`
- **Production Build**: `npm run build` *(compiles TypeScript for backend and builds static assets for frontend)*

---

## 🖥 Key Screens & Features Breakdown

### 1. 📊 Dashboard (`/dashboard`)
The central command center providing a high-level visual summary of total financial health.
- **Net Worth Banner**: Displays current Net Worth, total invested capital, overall profit/loss, and calculated portfolio return percentage.
- **Asset Allocation Chart**: Donut chart showing asset distribution across categories (Equity, Debt, Cash, Hybrid, Alternative, EPF, Gold).
- **Historical Net Worth Growth**: Interactive area graph plotting net worth progression over time.
- **Quick Metrics**: Highlights top asset holdings, cash balance, and recent transaction activity.

### 2. 💼 Portfolio (`/portfolio`)
A detailed granular breakdown of all tracked assets.
- **Asset Grouping**: Filterable by Asset Type (`MUTUAL_FUND`, `STOCK`, `EPF`, `NPS`, `GOLD`, `BANK_ACCOUNT`, `PROPERTY`, `OTHER`).
- **Asset Performance Metrics**: Shows Units owned, Average Purchase Price, Current NAV/Price, Total Cost, Current Market Value, Absolute Return (₹ and %), and XIRR.
- **Manual Asset & Transaction Modal**: Form to manually add un-trackable or physical assets (e.g., Real Estate, Physical Gold, Private Investments) and record Buy/Sell transactions.
- **Asset Management**: Supports asset deletion and transaction editing.

### 3. 📜 Ledger / Transactions (`/transactions`)
A unified audit trail of every transaction across all brokers and bank accounts.
- **Filtering & Search**: Filter transactions by Asset, Type (`BUY`, `SELL`, `DIVIDEND`, `CREDIT`, `DEBIT`, `INTEREST`), Date Range, or keyword search.
- **Source Badging**: Visually tags transactions based on source (`MANUAL`, `PDF_IMPORT`, `BANK_INSIGHTS`, `ZERODHA`, `ANGELONE`).
- **Exporting**: Ability to export filtered transaction lists to CSV.

### 4. 💸 Cash Flow (`/cashflow`)
Comprehensive income vs. expense analytics powered by the **BankInsights** engine.
- **Inflow vs. Outflow**: Visual comparison of monthly income vs. spending.
- **Savings Rate**: Calculates net monthly savings percentage.
- **Category Breakdown**: Automatically categorizes transactions into Salary, Utilities, Shopping, Food, Transfers, Investments, etc.
- **Bank Account Balances**: Tracks liquid balances across connected bank accounts.

### 5. 📥 Import Center (`/import`)
The multi-source statement ingestion engine supporting seamless imports:
- **CAS PDF Importer**: Parses password-protected Consolidated Account Statements (CAS) from CAMS and KFintech.
- **INDmoney Importer**: Ingests Indian stocks, US equities, and Mutual Fund tradebooks.
- **AngelOne Importer**: Parses AngelOne P&L and Tradebook Excel exports.
- **Zerodha Kite Integration**: Direct OAuth login flow via Kite Connect API to pull live holdings and positions.
- **EPF Passbook Importer**: Parses EPFO PDF passbooks to calculate employer/employee contribution totals and accumulated EPF interest.
- **BankInsights Importer**: Ingests bank account statements (CSV/Excel) with smart auto-categorization rules.
- **Ingestion Confirmation**: Displays a preview table of parsed holdings before committing them to SQLite.

---

## 🗄 Database Architecture & Schema

All application data is saved locally on your disk in SQLite at:
```
data/myworth.db
```

### Table Definitions

#### `assets`
Stores asset metadata and current holdings.
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key (Auto Increment) |
| `name` | `TEXT` | Asset name (e.g., "Parag Parikh Flexi Cap Fund") |
| `type` | `TEXT` | `MUTUAL_FUND`, `STOCK`, `NPS`, `GOLD`, `BOND`, `PROPERTY`, `BANK_ACCOUNT`, `EPF`, `OTHER` |
| `category` | `TEXT` | `Equity`, `Debt`, `Cash`, `Hybrid`, `Alternative`, `Other` |
| `identifier`| `TEXT` | ISIN, AMFI Code, Stock Ticker, or Account Number |
| `created_at`| `TEXT` | Timestamp |
| `updated_at`| `TEXT` | Timestamp |

#### `transactions`
Contains buy/sell/credit/debit history.
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key (Auto Increment) |
| `asset_id` | `INTEGER` | Foreign Key -> `assets(id)` (CASCADE DELETE) |
| `type` | `TEXT` | `BUY`, `SELL`, `REINVEST`, `DIVIDEND`, `INTEREST`, `BONUS`, `CREDIT`, `DEBIT` |
| `date` | `TEXT` | Format: `YYYY-MM-DD` |
| `quantity` | `REAL` | Number of units / shares |
| `price` | `REAL` | Price per unit |
| `amount` | `REAL` | Total transaction value |
| `source` | `TEXT` | `PDF_IMPORT`, `MANUAL`, `BANK_INSIGHTS` |
| `narration` | `TEXT` | Bank statement line item / notes |
| `tx_category`| `TEXT` | Expense/Income category |

#### `asset_prices`
Daily closing NAVs and stock prices.
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `asset_id` | `INTEGER` | Foreign Key -> `assets(id)` |
| `date` | `TEXT` | `YYYY-MM-DD` |
| `price` | `REAL` | Closing NAV or Stock Price |
| Primary Key: `(asset_id, date)` |

#### `sync_logs`
Tracks execution logs of automated price updates.
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key |
| `sync_type` | `TEXT` | `AMFI`, `YAHOO`, `NPS` |
| `status` | `TEXT` | `SUCCESS`, `FAILED` |
| `message` | `TEXT` | Log details |
| `timestamp` | `TEXT` | Timestamp |

---

## ⚡ Parsers & Integrations

- **AMFI Sync (`backend/src/services/marketSync.ts`)**: Fetches daily NAV data directly from `https://www.amfiindia.com/spages/NAVAll.txt` and matches AMFI scheme codes to update Mutual Fund valuations.
- **Yahoo Finance Sync**: Fetches stock prices and Gold rates using Yahoo Finance API endpoints.
- **CAS PDF Parser (`backend/src/services/pdfjsParser.ts`)**: Uses `pdfjs-dist` to parse layout text items from CAMS/KFintech PDFs, extracting ISIN, Scheme Name, Transaction Date, NAV, Amount, and Folio Numbers.
- **BankInsights (`backend/src/services/bankinsightsService.ts`)**: Analyzes narrations in bank CSVs/Excels using regular expression pattern matching to categorize transactions into Salary, Groceries, Rent, Utilities, Subscriptions, and Transfers.

---

## 🧠 AI Agent Context & Developer Guide

If you are an AI assistant or software engineer continuing development on **MyWorth**, follow these core architectural rules:

### 1. Architecture Principles
- **Local-First & Offline First**: Do not add cloud storage, telemetry, or external database services (Supabase, Firebase). All data must remain in local SQLite (`data/myworth.db`).
- **Strict Foreign Keys & Transactions**: SQLite foreign key constraints are enabled (`PRAGMA foreign_keys = ON`). Use `db.transaction()` for batch insertions during file imports to preserve atomic database operations.
- **Self-Healing Schema Engine**: `backend/src/db.ts` contains automated migration checks (`initDb()`) that verify and heal table schemas on backend startup. When modifying table definitions, update `initDb()` migration blocks accordingly.

### 2. Key Directories & File Map
```
MyWorth/
├── package.json               # Root orchestrator script config (runs concurrently)
├── README.md                  # Comprehensive project documentation
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express server entry point (Port 5000, CORS, Routes)
│   │   ├── db.ts              # SQLite connection, table initialization & auto-migration engine
│   │   ├── schema.ts          # Zod validation schemas
│   │   ├── routes/            # REST API controllers
│   │   │   ├── assets.ts      # Asset CRUD & portfolio calculation routes
│   │   │   ├── dashboard.ts   # Net worth aggregation & chart metrics
│   │   │   ├── import.ts      # Statement upload & parsing endpoints
│   │   │   ├── transactions.ts# Ledger query & filter routes
│   │   │   └── cashflow.ts    # Income/Expense cash flow endpoints
│   │   └── services/          # Statement parsers & live market sync
│   │       ├── pdfParser.ts           # CAS & EPF PDF text extractor
│   │       ├── csvParser.ts           # CSV statement parser
│   │       ├── excelParser.ts         # Excel sheet parser
│   │       ├── bankinsightsService.ts # Bank statement categorizer
│   │       ├── marketSync.ts          # AMFI & Yahoo Finance live NAV fetcher
│   │       ├── kiteService.ts         # Zerodha Kite integration
│   │       ├── angeloneService.ts     # AngelOne integration
│   │       └── indmoneyService.ts     # INDmoney parser
└── frontend/
    ├── src/
    │   ├── App.tsx             # Main client router & state provider
    │   ├── components/
    │   │   ├── Layout.tsx             # Sidebar, Top header, Server health check & Sync widget
    │   │   ├── Dashboard.tsx          # Main Net Worth visual analytics screen
    │   │   ├── Portfolio.tsx          # Asset holdings & performance list
    │   │   ├── Transactions.tsx       # Transaction ledger grid & filters
    │   │   ├── CashFlowDashboard.tsx  # Inflow/outflow cash flow metrics
    │   │   └── ImportCenter.tsx       # Statement drag-and-drop ingestion UI
```

### 3. REST API Contract Overview
- `GET /health` -> `{ status: "ok" }`
- `GET /api/dashboard/summary` -> Returns net worth metrics, total cost, returns, asset category breakdown.
- `GET /api/assets` -> Returns array of all assets with computed current values and XIRR.
- `POST /api/assets` -> Body: `{ name, type, category, identifier }`. Creates a new manual asset.
- `GET /api/transactions` -> Returns paginated/filtered transactions.
- `POST /api/import/pdf` -> Upload CAS PDF with password payload to parse mutual funds.
- `POST /api/import/confirm` -> Ingests previewed assets/transactions into database atomically.
- `POST /api/sync` -> Triggers AMFI and Yahoo market price sync manually.

### 4. Development & Editing Guidelines
- **Always verify UI aesthetics**: The app uses a dark theme (`#080b11` background, `#0c1221` cards, Indigo `#6366f1` accents). Keep all new UI components aligned with this glassmorphism design system.
- **Port Contracts**: Backend runs on `http://localhost:5000`. Frontend Vite proxies requests or calls `http://localhost:5000`. Maintain CORS settings in `backend/src/index.ts`.
- **Handling New Statement Parsers**: When adding support for new brokers or bank statements, implement the parsing logic under `backend/src/services/` and register the preview endpoint in `backend/src/routes/import.ts`.
