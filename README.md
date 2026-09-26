# LifeAdmin — Autonomous Personal Document Intelligence & Deadline OS

> **Don't just store your documents — let your documents tell you what you need to do.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Node.js-Express-black?logo=express)](https://expressjs.com/)
[![SQLite / PostgreSQL](https://img.shields.io/badge/Dual_Database-SQLite_%7C_PostgreSQL-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Google_Gemini-8E75C2?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Project Overview & Architecture
LifeAdmin is an autonomous personal document intelligence platform that extracts dates, obligations, and consequences from policies, bills, IDs, and warranties to eliminate missed renewals, utility penalties, and expired guarantees.

```text
Document Upload (PDF / PNG / JPG)
              ↓
OCR & Text Extraction (PDF-Parse / Tesseract.js)
              ↓
AI Information Extraction (Google Gemini SDK + Heuristic Fallback)
              ↓
Human-In-The-Loop Verification & Renewal Diff Inspection
              ↓
Action & Deadline Detection (Dynamic Proximity × Consequence Engine)
              ↓
Multi-Stage Automated Reminders (30d, 14d, 7d, 3d, 1d, 0d)
              ↓
Google Calendar Real-Time Sync (OAuth 2.0 + Direct 1-Click Web Intent + .ics)
              ↓
Citizen Protection Hub (Emergency Medical Dossier + Fine Prevention Meter)
```

---

## 2. Clean Project Directory Structure

```text
Life_Admin/
├── client/                      # Frontend Application (React 19 + TypeScript + Vite)
│   ├── public/                  # Favicons and static assets
│   ├── src/
│   │   ├── components/ui/       # Modular UI library (Button, Badge, Card, Dialog, Skeleton, CommandMenu)
│   │   ├── context/             # AuthContext, ThemeContext (Light/Dark/System), ToastContext
│   │   ├── layouts/             # MainLayout (Linear-inspired sidebar, search header)
│   │   ├── pages/               # Dashboard, Documents, Deadlines, Calendar, Analytics, Settings, ER Kit
│   │   ├── services/            # Axios API client with automatic token interceptors
│   │   ├── types/               # Strong TypeScript interface definitions
│   │   └── utils/               # Calendar intent and date formatting utilities
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js       # Modern color palette (#4F46E5 primary, #0F172A dark)
│   └── vite.config.ts
│
├── server/                      # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/              # Environment config and dual database client (SQLite WAL / PostgreSQL)
│   │   ├── controllers/         # Documents, Actions, Calendar, Impact, Lifecycle controllers
│   │   ├── middleware/          # JWT authentication, Multer upload security, error handling
│   │   ├── routes/              # Express API route registrations
│   │   ├── services/            # OCR engine, Gemini AI extractor, Google Calendar service, Reminder scheduler
│   │   ├── index.ts             # Server entry point
│   │   └── seed.ts              # Demo seed data generator
│   └── package.json
│
├── database/                    # Relational Database Layer
│   ├── schema.sql               # PostgreSQL and SQLite compatible 13-table schema
│   ├── lifeadmin.db             # Local SQLite embedded database (auto-created on start)
│   └── .gitkeep
│
├── docs/                        # Complete Technical Documentation
│   ├── ARCHITECTURE.md          # In-depth system architecture & security principles
│   ├── API_REFERENCE.md         # Full REST API endpoint reference
│   └── DATABASE_SCHEMA.md       # Relational entity schema & table specifications
│
├── uploads/                     # Encrypted file storage (UUID-keyed, protected)
├── .editorconfig                # Universal indentation and charset rules
├── .env.example                 # Environment configuration template
├── .gitignore                   # Clean ignore rules (excludes local DB binaries and node_modules)
├── CONTRIBUTING.md              # Contributor guidelines and workflow
├── LICENSE                      # MIT Open-Source License
├── package.json                 # Root monorepo workspace configuration
├── README.md                    # Main documentation
└── run.bat                      # 1-Click Windows development launcher
```

---

## 3. Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Git](https://git-scm.com/)

### ⚡ Method A: One-Click Launcher (Windows)
Double-click **`run.bat`** in the project root. It will automatically start both backend and frontend servers and launch your browser!

### 🖥️ Method B: Manual CLI Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Amrithaj0526/Life_Admin.git
   cd Life_Admin
   ```

2. **Install dependencies:**
   ```bash
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

3. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   # Runs on http://localhost:5000
   ```

4. **Start the frontend application:**
   ```bash
   cd client
   npm run dev
   # Runs on http://localhost:5173
   ```

### Default Demo Credentials
- **Email:** `demo@lifeadmin.local`
- **Password:** `password123`

---

## 4. Key Feature Highlights

1. **Autonomous Document Ingestion & OCR:** Multi-page PDF text parsing and image OCR via Tesseract.js.
2. **AI Information Extraction:** Google Gemini API extraction with strict Zod schema validation (title, provider, policy numbers, amounts, expirations, action obligations) and intelligent heuristic fallback.
3. **Linear/Notion-Grade SaaS UI:** Built to the highest visual polish standards:
   - Primary `#4F46E5`, Background `#F8FAFC`, Surface `#FFFFFF`.
   - Native Dark Mode support (`#0F172A`).
   - Global Quick Search Command Menu (`⌘K` / `Ctrl + K`).
   - Non-intrusive floating Toast notifications and pulsing Skeleton loaders.
4. **Dynamic Priority & Consequence Engine:** Weighs deadline proximity against statutory fines (e.g. Motor Vehicles Act Sec 196 penalty of ₹2,000–₹4,000 vs. utility disconnection surcharges).
5. **Timeline-Grouped Deadlines:** Deadlines organized by urgency: Today, This Week, Next Month, Later.
6. **Interactive Month Calendar:** Dedicated full-month grid with visual deadline pills, date switcher, and click-to-view details.
7. **Real Google Calendar Integration:**
   - Direct 1-Click Google Calendar Web Intent (instant zero-setup sync).
   - Full automated Google OAuth 2.0 API background sync with 30d, 7d, 1d mobile alarms.
   - RFC 5545 standard `.ics` iCalendar feed download.
8. **Citizen Protection & Social Impact System (`/social-impact`):**
   - **One-Tap Emergency Medical Dossier:** Instant 1-page printable emergency card aggregating blood group, chronic conditions, health insurance policy ID, and cashless TPA authorization numbers.
   - **Household Penalty Prevention Meter:** Real-time financial tracker showing avoided fines and late fees.
   - **Citizen Rights & Consumer Legal Advisor:** Contextual legal guidance on IRDAI 30-day claim settlement rules, Consumer Protection Act 2019 warranty remedies, and electricity disconnection notice mandates.
9. **Field-Level Renewal Diff Analyzer:** Side-by-side field-level comparison comparing year-over-year renewals (e.g., Insurance 2024 $\to$ 2025) highlighting premium changes or altered clauses.
10. **Zero-Config Dual-Database Engine:** Embedded **SQLite WAL (`lifeadmin.db`)** out of the box for zero-setup execution, with seamless switch to production **PostgreSQL** by setting `DATABASE_URL` in `.env`.

---

## 5. Technical Documentation Links
- 📐 [Architecture & Engineering Design](docs/ARCHITECTURE.md)
- 🔌 [REST API Reference](docs/API_REFERENCE.md)
- 🗄️ [Database Schema & Entity Specifications](docs/DATABASE_SCHEMA.md)
- 🤝 [Contributing Guidelines](CONTRIBUTING.md)

---

## 6. License
This project is licensed under the [MIT License](LICENSE).
