# LifeAdmin — Personal Document & Deadline Management Platform

> **Tagline:** Don't just store your documents — let your documents tell you what you need to do.

---

## 1. Project Overview & Architecture
LifeAdmin is an autonomous personal document intelligence and deadline management platform designed to eliminate missed renewals, utility penalties, and expired warranties.

### Core Pipeline
```text
Document Upload (PDF/PNG/JPG)
         ↓
OCR / Direct Text Extraction
         ↓
AI Information Extraction (Gemini / Heuristic Fallback)
         ↓
Human-In-The-Loop Verification
         ↓
Action & Deadline Detection
         ↓
Dynamic Priority Calculation (Urgency + Proximity + Consequence)
         ↓
Automated Multi-Stage Reminder Scheduling (30, 14, 7, 3, 1, 0 days)
         ↓
Actionable Dashboard + Natural Language Search + Version History
```

---

## 2. Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons, React Router v6
- **Backend:** Node.js, Express, TypeScript, tsx runtime
- **Database:** PostgreSQL relational schema with seamless SQLite WAL local fallback
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt password hashing
- **OCR Engine:** Tesseract OCR & PDF text extraction
- **AI Engine:** Google Gemini API (`@google/genai`) with structured Zod schema validation and deterministic heuristic fallback
- **File Storage:** Secure storage with random UUID key naming and MIME validation

---

## 3. Getting Started

### Prerequisites
- Node.js (v20+) & npm
- Git

### Quick Setup

1. **Install Dependencies:**
   ```bash
   # From root directory:
   cd server && npm install
   cd ../client && npm install
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` or `server/.env`:
   ```bash
   cp .env.example server/.env
   ```

3. **Seed Database with Sample Data:**
   ```bash
   cd server
   npx tsx src/seed.ts
   ```

4. **Run Servers:**
   - **Backend:**
     ```bash
     cd server
     npx tsx src/index.ts
     # API runs on http://localhost:5000
     ```
   - **Frontend:**
     ```bash
     cd client
     npm run dev
     # Client runs on http://localhost:5173
     ```

### Default Demo Credentials
- **Email:** `demo@lifeadmin.local`
- **Password:** `password123`

---

## 4. Key Features Implemented

1. **Autonomous OCR & Text Extraction:** Multi-page PDF text extraction and image OCR.
2. **AI Structured Extraction:** Strict Zod schema-validated extraction (title, provider, policy numbers, amounts, expirations, actions).
3. **Human-In-The-Loop Verification:** Verification screen allowing user review, correction, and confirmation before document activation.
4. **Dynamic Priority Engine:** Automatically calculates urgency (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) factoring in deadline proximity and category consequences.
5. **Multi-Stage Automated Reminders:** Generates scheduled reminder intervals (30, 14, 7, 3, 1, 0 days before due date) with duplicate prevention.
6. **Executive Action Dashboard:** Highlights top urgent action items, upcoming expiration timelines, and priority breakdowns.
7. **Natural Language Search:** Translates natural language queries (e.g. *"Show insurance documents expiring soon"*) into safe structured queries.
8. **Document Relationships:** Maps linkages between vehicles, policies, and service records (e.g. Service Record $\leftrightarrow$ Vehicle Insurance).
9. **Family Vault Spaces:** Role-based access control (`OWNER`, `EDITOR`, `VIEWER`) for shared household and family documents.
10. **Audit Trail:** Immutable logging of document uploads, AI extractions, verifications, and action completions.
11. **Google Calendar Cross-Device Sync:** OAuth 2.0 calendar integration creating automated events and multi-stage alarms (30d, 7d, 1d) on users' Google Calendars for native smartphone notifications on Android & iOS without exposing sensitive document content.
12. **Renewal Engine & Field-Level Version Diff:** Automatically tracks year-over-year renewals (e.g., Insurance Policy 2024 $\to$ 2025) with side-by-side field diff highlighting premium hikes, coverage changes, or altered terms.
13. **Citizen Protection & Social Impact Hub (`/social-impact`):**
    - **One-Tap Emergency Medical Dossier:** Instant 1-page printable emergency card aggregating blood group, chronic conditions, health insurance TPA cashless authorization numbers, and policy cards during critical medical moments.
    - **Household Penalty & Fine Prevention Meter:** Quantifies real financial savings from avoided traffic fines (MV Act Sec 196), power utility reconnection fees, passport rush penalties, and late finance charges.
    - **Citizen Rights & Consumer Protection Advisor:** Automatically surfaces statutory rights and deadlines under Indian law (IRDAI claim settlement rules, Consumer Protection Act 2019 warranty rights, and Electricity Ombudsman dispute protocols) to protect consumers from corporate negligence.

---

## 5. Zero-Config Local Database & Production Scale
- **Default Local Mode:** Powered by embedded **SQLite WAL (`lifeadmin.db`)** via `better-sqlite3`. Zero installation, zero Docker, zero external database setup required. Runs instantly out of the box.
- **Enterprise Mode:** Set `DATABASE_URL=postgresql://user:password@host:5432/lifeadmin` in `.env` to switch to high-concurrency PostgreSQL without modifying application logic.


