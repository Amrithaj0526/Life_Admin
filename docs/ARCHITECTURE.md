# LifeAdmin System Architecture & Engineering Design

## 1. High-Level Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 19 + Vite)                  │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Dashboard   │  │  Documents   │  │  Deadlines   │  │  Calendar   │ │
│  │  (Recharts)  │  │  (Grid/List) │  │  (Timeline)  │  │  (Month UI) │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                 │                 │        │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────┴──────┐ │
│  │              Axios Interceptors + Auth & Toast Contexts           │ │
│  └──────────────────────────────────┬────────────────────────────────┘ │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ HTTP REST API (JWT Authenticated)
┌─────────────────────────────────────▼──────────────────────────────────┐
│                     BACKEND LAYER (Node.js + Express + TS)             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Routing & Middleware: CORS, Multer Upload, JWT Auth, Global Err  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ Controller Layer: Documents, Actions, Calendar, Impact, Lifecycle│  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ Service Engines:                                                 │  │
│  │  - OCR Pipeline (Tesseract / PDF-parse)                          │  │
│  │  - AI Extractor (Google Gemini SDK + Heuristic Fallback)         │  │
│  │  - Dynamic Priority & Consequence Engine                         │  │
│  │  - Multi-Stage Automated Reminder Scheduler                     │  │
│  │  - Google Calendar OAuth 2.0 Integration & Web Intent Generator  │  │
│  │  - Field-Level Renewal Diff Analyzer                             │  │
│  │  - Citizen Protection & Social Impact Meter                      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │ Dual Database Abstraction Layer (IDatabaseClient)                │  │
│  │  - PostgreSQL Client (Production High-Concurrency Pool)          │  │
│  │  - SQLite WAL Client (Embedded Zero-Config Local Execution)      │  │
│  └──────────────────┬───────────────────────────────┬───────────────┘  │
└─────────────────────┼───────────────────────────────┼──────────────────┘
                      │                               │
                      ▼                               ▼
       ┌──────────────────────────────┐ ┌──────────────────────────────┐
       │   Local SQLite / PostgreSQL  │ │    Encrypted File Storage    │
       │   (lifeadmin.db / Port 5432) │ │    (UUID-keyed uploads/)     │
       └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Core Processing Pipeline

```text
1. Ingestion:
   User uploads PDF or Image (JPEG/PNG)
   File validated for MIME-type and size (≤ 10MB)
   Stored with cryptographically secure random UUID key.

2. Text Extraction:
   PDFs: Direct digital text extraction with OCR fallback for scans.
   Images: Multi-stage Tesseract OCR with image contrast enhancement.

3. AI Structured Extraction:
   Extracted text processed by Google Gemini 1.5 / 2.0 via @google/genai SDK.
   Strict Zod schema enforcement for fields:
   - title, category, provider, policy/document number,
   - issue_date, expiry_date, total_amount, currency,
   - identified obligations and critical action dates.
   Deterministic heuristic analyzer fallback if API offline.

4. Human-In-The-Loop Verification:
   User reviews extracted values on Document Detail screen.
   Corrections logged to immutable audit trail.
   Document status upgraded to ACTIVE.

5. Dynamic Priority & Consequence Engine:
   Priority = Proximity (Days remaining) × Category Legal/Financial Consequence.
   - Motor Insurance / Driver's License: High legal consequence (MV Act penalties).
   - Health Insurance: Extreme emergency consequence (cashless hospital admission).
   - Utility Bills: Power board disconnection surcharge.
   - Assigned urgency: CRITICAL (≤7d), HIGH (≤14d), MEDIUM (≤30d), LOW (>30d).

6. Multi-Stage Automated Reminders:
   Automated schedule generated: 30 days, 14 days, 7 days, 3 days, 1 day, and day-of.
   Duplicate reminder prevention and lifecycle status synchronization.

7. Cross-Platform Calendar Synchronization:
   - Method A: Direct 1-Click Google Calendar Web Intent.
   - Method B: Background Google Calendar v3 API via OAuth 2.0 with alarms (30d, 7d, 1d).
   - Method C: RFC 5545 standard iCalendar (.ics) download for all calendar applications.
```

---

## 3. Security & Privacy Design Principles

1. **Zero Content Leakage to External Services:**
   Only abstract metadata (e.g., `[LifeAdmin] Vehicle Insurance Renewal` and due date `2026-10-15`) is sent to Google Calendar. Sensitive identifiers, vehicle VIN numbers, and financial details are NEVER exported.
2. **Encrypted Storage:**
   Original filenames are decoupled from filesystem paths. Storage uses UUID-based keys.
3. **Stateless JWT Authentication:**
   Token expiry enforced with bcrypt salt rounds (10) for credential protection.
4. **Immutable Audit Trail:**
   All document creations, modifications, AI extractions, and status transitions append to the `audit_logs` table.
