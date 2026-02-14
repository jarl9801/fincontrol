# CLAUDE.md - FinControl

## Project Overview

FinControl is a financial management application for tracking transactions, payables/receivables, cash flow, and generating financial reports. Built with React + Firebase, deployed on Firebase Hosting.

## Tech Stack

- **React 19** with JSX (no TypeScript)
- **Vite 7** for build tooling
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
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
├── components/
│   ├── charts/        # Recharts-based chart components
│   ├── layout/        # Sidebar, MobileMenu
│   └── ui/            # Card, Toast, Modal, FilterPanel, etc.
├── constants/         # categories.js, projects.js, costCenters.js, config.js
├── context/           # (empty — state lives in hooks)
├── features/          # Page-level feature modules
│   ├── auth/          # Login
│   ├── cashflow/      # Cash flow analysis
│   ├── cxc/           # Cuentas por cobrar (receivables)
│   ├── cxp/           # Cuentas por pagar (payables)
│   ├── dashboard/     # Admin dashboard
│   ├── reports/       # Financial reports (executive, P&L, ratios, etc.)
│   ├── settings/      # Projects, categories, cost centers, bank account
│   └── transactions/  # Transaction list and management
├── hooks/             # Custom hooks (useAuth, useTransactions, useMetrics, etc.)
├── services/          # firebase.js — Firebase init, exports auth/db/appId
├── utils/             # formatters.js, pdfExport.js
├── App.jsx            # Root component with view-based routing
└── main.jsx           # Entry point
```

## Key Architecture Decisions

- **No React Router** — Navigation uses `view` state in App.jsx with a switch statement
- **No Redux/Context** — All state management through custom hooks with Firestore real-time listeners (`onSnapshot`)
- **Props drilling** — App.jsx passes a `commonProps` object to feature components
- **Firestore path convention** — All collections at `artifacts/{appId}/public/data/{collection}`
- **Role-based access** — Admin/editor roles determined by email in `constants/config.js`

## Conventions

### Code Style
- Functional components only, no class components
- camelCase for files containing functions/hooks, PascalCase for React component files
- Custom hooks prefixed with `use` and exported as named exports
- ESLint configured: unused vars error (except capitalized/underscore-prefixed)

### UI / Styling
- Tailwind utility classes directly in JSX — no CSS modules or styled-components
- Color palette: Blue (primary), Emerald (success), Amber (warning), Red (danger), Slate (neutral)
- Rounded corners: `rounded-xl` / `rounded-2xl` / `rounded-3xl`
- Sidebar: dark gradient (slate-900 to slate-700)
- Custom animations: `animate-fadeIn`, `animate-slideInRight`, `animate-scaleIn`

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

## Sensitive Files

- `fincontrol-firebase-admin-key.json` — Do not commit or expose
- `.env` — Firebase credentials, never commit
