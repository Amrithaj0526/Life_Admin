# LifeAdmin — Frontend Client

The frontend application for LifeAdmin is built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**, following Linear/Notion-inspired minimalist SaaS design requirements.

---

## 1. Tech Stack & Architecture

- **Framework:** React 19 + TypeScript + Vite 5
- **Styling:** Tailwind CSS (Custom `#4F46E5` primary color system + Dark Mode `#0F172A`)
- **Typography:** Inter (Google Fonts) with strict weight and line-height hierarchy
- **Icons:** Lucide React (Uniform 16px to 20px icons across all components)
- **Charts:** Recharts (Area charts, Bar charts, Donut charts)
- **State & Context:**
  - `AuthContext`: JWT persistence, login, logout, and protected route guards.
  - `ThemeContext`: Light, Dark, and System theme synchronization.
  - `ToastContext`: Accessible non-intrusive floating toasts (`toast.success`, `toast.error`, `toast.warning`).
- **Command Palette:** Global quick search (`⌘K` / `Ctrl + K`) across documents and deadlines.

---

## 2. Directory Structure

```text
client/src/
├── assets/          # Static assets & illustrations
├── components/
│   └── ui/          # Reusable component library (button, badge, card, dialog, skeleton, command-menu)
├── context/         # AuthContext, ThemeContext, ToastContext
├── layouts/         # MainLayout (Linear-style sidebar + search header)
├── pages/           # Application views
│   ├── ActionsPage.tsx          # Deadlines grouped by Today, This Week, Next Month, Later
│   ├── AnalyticsPage.tsx        # Recharts analytics & intelligence
│   ├── AuditHistoryPage.tsx     # Immutable compliance audit trail
│   ├── CalendarPage.tsx         # Interactive full-month calendar grid
│   ├── DashboardPage.tsx        # Executive summary, 4 metrics, AI insights, deadline list
│   ├── DocumentDetailPage.tsx   # Human-in-the-loop review, relations, version diffs
│   ├── DocumentsPage.tsx        # Grid & list view with category filter pills
│   ├── HelpPage.tsx             # FAQ and knowledge base
│   ├── LoginPage.tsx            # Clean sign-in screen
│   ├── RegisterPage.tsx         # Registration screen
│   ├── SearchPage.tsx           # Natural language query search
│   ├── SettingsPage.tsx         # Categorized settings (OAuth, Account, Notifications, Appearance)
│   ├── SocialImpactPage.tsx     # Emergency Medical Dossier & Citizen Rights Advisor
│   ├── UploadPage.tsx           # Drag & drop upload with step progress bar
│   └── VaultsPage.tsx           # Shared family vaults & spaces
├── services/        # Axios API client with bearer token interceptor
├── types/           # TypeScript interface definitions
└── utils/           # Helper utilities (calendar web intent link generator)
```

---

## 3. Development Commands

```bash
# Start development server on port 5173
npm run dev

# Run TypeScript typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```
