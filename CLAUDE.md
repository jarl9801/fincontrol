# CLAUDE.md - FinControl

## Project Overview

FinControl is a financial management application for tracking transactions, payables/receivables, cash flow, and generating financial reports. Built with React + Firebase, deployed on Firebase Hosting.

## Tech Stack

- **React 19** with JSX (no TypeScript)
- **Vite 7** for build tooling
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no tailwind.config.js — tokens in index.css)
- **Firebase** (Firestore for data, Auth for authentication)
- **Recharts** for chart visualizations
- **Lucide React** for icons
- **jsPDF + jspdf-autotable** for PDF export

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build

## Project Structure

```
src/
├── App.jsx                # Root component with view-based routing
├── App.css                # Minimal CSS (delegates to index.css)
├── main.jsx               # Entry point
├── index.css              # Tailwind import + Apple design system tokens
├── assets/
│   └── react.svg
├── components/
│   ├── layout/
│   │   ├── MobileMenu.jsx
│   │   └── Sidebar.jsx
│   └── ui/
│       ├── Card.jsx
│       ├── ConfirmModal.jsx
│       ├── FilterPanel.jsx
│       ├── NotesModal.jsx
│       ├── PeriodSelector.jsx
│       ├── Toast.jsx
│       ├── TransactionFormModal.jsx
│       └── TransactionRow.jsx
├── constants/
│   ├── categories.js      # 21 expense + 6 income categories
│   ├── config.js           # COLORS, ADMIN/EDITOR emails, ALERT_THRESHOLDS
│   ├── costCenters.js      # 5 predefined cost centers
│   └── projects.js         # PROY-001 through PROY-005 + General
├── context/                # (empty — state lives in hooks)
├── data/
│   └── transactions2025.js # Static 2025 transaction data (bundled)
├── features/
│   ├── auth/
│   │   └── Login.jsx
│   ├── cashflow/
│   │   └── CashFlow.jsx
│   ├── cxc/
│   │   └── CXC.jsx           # Cuentas por cobrar (receivables)
│   ├── cxp/
│   │   └── CXP.jsx           # Cuentas por pagar (payables)
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   └── ProjectDetail.jsx
│   ├── reports/
│   │   ├── ExecutiveSummary.jsx
│   │   ├── FinancialRatios.jsx
│   │   ├── ReportCXC.jsx
│   │   ├── ReportCXP.jsx
│   │   └── Reports.jsx        # P&L report
│   ├── settings/
│   │   ├── BankAccount.jsx
│   │   ├── Categories.jsx
│   │   ├── CostCenters.jsx
│   │   └── Projects.jsx
│   └── transactions/
│       └── TransactionList.jsx
├── hooks/
│   ├── useAllTransactions.js   # Merges 2025 static + 2026 Firebase data
│   ├── useAuth.js              # Firebase Auth + role determination
│   ├── useBankAccount.js       # Bank balance & credit line
│   ├── useCashFlow.js          # Cash flow analysis + CSV parsing
│   ├── useCategories.js        # Expense/income category CRUD
│   ├── useCostCenters.js       # Cost center management
│   ├── useFilters.js           # Transaction filtering logic
│   ├── useHistoricalData.js    # 2025 CSV from Google Sheets
│   ├── useMetrics.js           # Financial KPIs & calculations
│   ├── useProjects.js          # Project management
│   ├── useTransactionActions.js # CRUD + notes + status toggle
│   └── useTransactions.js      # Real-time Firestore listener
├── services/
│   └── firebase.js             # Firebase init, exports auth/db/appId
└── utils/
    ├── formatters.js           # Currency (de-DE), date (es-ES), overdue calc
    └── pdfExport.js            # PDF export (transactions, CXP, CXC, reports)
```

## Key Architecture Decisions

- **No React Router** — Navigation uses `view` state in App.jsx with a switch statement
- **No Redux/Context** — All state management through custom hooks with Firestore real-time listeners (`onSnapshot`)
- **Props drilling** — App.jsx passes a `commonProps` object to feature components
- **Firestore path convention** — All collections at `artifacts/{appId}/public/data/{collection}`
- **Role-based access** — Admin/editor roles determined by email in `constants/config.js`
- **Historical data** — 2025 data from static JS file + Google Sheets CSV; 2026+ from Firestore
- **Data merging** — `useAllTransactions` combines 2025 + 2026 data for unified views

## Conventions

### Code Style
- Functional components only, no class components
- camelCase for files containing functions/hooks, PascalCase for React component files
- Custom hooks prefixed with `use` and exported as named exports
- ESLint 9 flat config: unused vars error (except capitalized/underscore-prefixed)

### UI / Styling (Apple Dark Mode Design System)
- Tailwind utility classes directly in JSX — no CSS modules or styled-components
- **Color palette** (Apple system colors):
  - Green `#30d158` (primary/success), Blue `#0a84ff` (info), Red `#ff453a` (danger/error)
  - Orange `#ff9f0a` (warning), Purple `#bf5af2`, Yellow `#ffd60a`
  - Backgrounds: `#000000` (primary), `#1c1c1e` (secondary), `#2c2c2e` (tertiary)
  - Text: `#ffffff` (primary), `#8e8e93` (secondary), `#48484a` (tertiary)
  - Borders: `rgba(255,255,255,0.08)` (subtle), `rgba(255,255,255,0.14)` (strong)
- **Frosted glass cards** with `backdrop-blur` and semi-transparent backgrounds
- Custom animations: `fadeIn`, `fadeInUp`, `scaleIn`, `slideIn`, `slideInRight`, `shimmer`
- Typography: Inter / SF Pro Display, monospace: JetBrains Mono / Fira Code

### Data Patterns
- Currency: EUR, German locale formatting (`de-DE`)
- Dates: ISO strings (`YYYY-MM-DD`) for storage, Spanish locale (`es-ES`) for display
- UI language: Spanish
- Code language: English
- Audit trail on all transactions: `createdBy`, `createdAt`, `lastModifiedBy`, `lastModifiedAt`

### Hook Pattern (data fetching)
```
[data, loading, error] = useHook()
→ useEffect sets up onSnapshot listener
→ Returns cleanup unsubscribe function
```

### Hook Pattern (actions)
```
{ createX, updateX, deleteX } = useActionHook()
→ Each returns { success, error }
→ Checks user exists before operating
→ Attaches audit metadata (timestamps, user email)
```

## Firebase

- Config uses `VITE_FIREBASE_*` env vars (see `.env.example`)
- `services/firebase.js` exports `auth`, `db` (Firestore instance), and `appId`
- All data reads use real-time `onSnapshot` listeners
- Writes use `addDoc`, `updateDoc`, `deleteDoc` with `serverTimestamp()`
- **Collections** (all under `artifacts/{appId}/public/data/`):
  - `transactions` — Main transaction ledger
  - `settings/categories` — Expense & income categories
  - `settings/bankAccount` — Bank balance & credit line
  - `projects` — Project definitions
  - `costCenters` — Cost center definitions

## Sensitive Files

- `fincontrol-firebase-admin-key.json` — Do not commit or expose
- `.env` — Firebase credentials, never commit
