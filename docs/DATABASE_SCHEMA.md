# LifeAdmin Relational Database Architecture

The LifeAdmin schema is designed with high-concurrency production PostgreSQL compliance while maintaining 100% portable execution on local SQLite via Write-Ahead Logging (WAL).

---

## 1. Entity-Relationship Overview

```text
       users (1) ──────────< documents (N) ──────────< actions (N)
         │                         │                          │
         │                         │                          │ (1)
         v (1)                     v (1)                      v
    vaults (N)             document_versions (N)        reminders (N)
         │                         │
         v (N)                     v (N)
   vault_members         document_relationships
```

---

## 2. Table Specifications

### 1. `users`
- `id` (TEXT, PK): Unique UUID.
- `name` (TEXT): User full name.
- `email` (TEXT, UNIQUE): Account email address.
- `password_hash` (TEXT): Bcrypt salted password hash.
- `created_at`, `updated_at` (TIMESTAMP).

### 2. `categories`
- `id` (TEXT, PK): e.g. `cat_insurance`, `cat_vehicle`, `cat_bills`, `cat_warranty`.
- `name` (TEXT, UNIQUE): Display title.
- `icon` (TEXT): Lucide icon identifier.
- `color` (TEXT): Hex color string.
- `description` (TEXT): Scope description.

### 3. `vaults` & `vault_members`
- Facilitates secure, role-based family and household collaboration (`OWNER`, `EDITOR`, `VIEWER`).

### 4. `documents`
- `id` (TEXT, PK): Unique document identifier.
- `user_id` (TEXT, FK): Owner reference.
- `vault_id` (TEXT, FK, Nullable): Associated shared space.
- `title` (TEXT): Clean document display title.
- `category_id` (TEXT, FK): Classification link.
- `status` (TEXT): `UPLOADED`, `PROCESSING`, `OCR_COMPLETED`, `AI_ANALYZING`, `NEEDS_REVIEW`, `ACTIVE`, `FAILED`, `ARCHIVED`.
- `storage_key` (TEXT): UUID file storage pointer.
- `original_filename` (TEXT): Original uploaded file name.
- `mime_type` (TEXT): `application/pdf`, `image/png`, etc.
- `file_size` (INTEGER): Size in bytes.
- `ocr_text` (TEXT): Raw extracted text corpus.
- `summary` (TEXT): AI generated summary.
- `provider` (TEXT): Issuer (e.g., "HDFC ERGO", "Apple", "TNEB").
- `document_number` (TEXT): Policy, bill, or registration number.
- `issue_date`, `expiry_date` (TEXT): ISO dates.
- `amount` (REAL): Payment/premium value.
- `currency` (TEXT): Currency code.
- `confidence` (REAL): OCR/AI confidence metric (0.0 to 1.0).
- `verification_status` (TEXT): `PENDING`, `VERIFIED`, `REJECTED`.
- `renewal_status` (TEXT): `NOT_REQUIRED`, `UPCOMING`, `DUE`, `IN_PROGRESS`, `RENEWED`, `EXPIRED`.

### 5. `document_versions`
- Implements version tracking and field diffing across renewals (e.g. 2024 $\to$ 2025 policies).

### 6. `document_relationships`
- Maps relationships between documents (e.g., Insurance $\leftrightarrow$ Vehicle RC $\leftrightarrow$ Pollution Certificate).

### 7. `actions`
- `id` (TEXT, PK): Action identifier.
- `document_id` (TEXT, FK): Parent document.
- `title` (TEXT): e.g., "Renew Vehicle Comprehensive Policy".
- `type` (TEXT): `RENEWAL`, `PAYMENT`, `SERVICE`, `VERIFICATION`, `EXPIRATION`.
- `due_date` (TEXT): Critical deadline date.
- `priority` (TEXT): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
- `status` (TEXT): `PENDING`, `IN_PROGRESS`, `COMPLETED`, `DISMISSED`.
- `consequence_score` (INTEGER): Severity metric (1-100).
- `legal_consequence` (TEXT): Fine or statutory clause (e.g., MV Act Sec 196).

### 8. `reminders`
- `id` (TEXT, PK): Reminder identifier.
- `action_id` (TEXT, FK): Target action.
- `scheduled_for` (TEXT): Reminder trigger date.
- `channel` (TEXT): `IN_APP`, `EMAIL`, `GOOGLE_CALENDAR`.
- `is_sent` (INTEGER): Dispatch flag.
- `google_calendar_event_id` (TEXT): Remote Google Calendar event ID.
- `calendar_sync_status` (TEXT): `NOT_CONNECTED`, `PENDING`, `SYNCED`, `FAILED`, `DISCONNECTED`.

### 9. `google_calendar_tokens`
- Stores OAuth 2.0 access & refresh tokens, token expiry, and user Gmail address securely.

### 10. `audit_logs`
- Append-only immutable log recording all uploads, AI extractions, verifications, diff inspections, and calendar sync events.

### 11. `system_settings`
- Dynamic key-value store for Google OAuth credentials and platform configs.
