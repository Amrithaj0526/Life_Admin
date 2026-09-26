# LifeAdmin REST API Reference

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP Header:
`Authorization: Bearer <jwt_token>`

---

## 1. Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account | No |
| `POST` | `/auth/login` | Authenticate user and receive JWT | No |
| `GET` | `/auth/me` | Retrieve current authenticated user profile | Yes |

---

## 2. Document Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/documents/upload` | Upload document file (PDF, PNG, JPG) for OCR & AI analysis | Yes |
| `GET` | `/documents` | List user documents (supports `?search=`, `?category=`, `?status=`) | Yes |
| `GET` | `/documents/:id` | Get full document details, relations, and extracted metadata | Yes |
| `PUT` | `/documents/:id/verify` | Human-in-the-loop verification and field corrections | Yes |
| `DELETE` | `/documents/:id` | Soft delete or purge document and associated reminders | Yes |
| `POST` | `/documents/:id/renew` | Initialize renewal cycle linking previous version | Yes |
| `GET` | `/documents/:id/diff/:previousId`| Field-level renewal comparison diff | Yes |

---

## 3. Actions & Deadlines Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/actions` | Get prioritized deadlines and obligations | Yes |
| `POST` | `/actions/:id/complete` | Mark an action item as completed | Yes |
| `GET` | `/dashboard/overview` | Executive dashboard analytics, metrics, and urgencies | Yes |

---

## 4. Google Calendar & iCal Synchronization

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/calendar/google/connect` | Generate authentic Google OAuth 2.0 authorization URL | Yes |
| `GET` | `/calendar/google/callback` | OAuth redirect callback handler (exchanges code for tokens) | No |
| `GET` | `/calendar/google/status` | Get current Google Calendar connection status and email | Yes |
| `GET` | `/calendar/google/config` | Check if server has OAuth client credentials configured | Yes |
| `POST` | `/calendar/google/config` | Save Google Client ID & Secret to platform settings | Yes |
| `POST` | `/calendar/google/sync-all`| Sync all active reminders to Google Calendar | Yes |
| `POST` | `/calendar/google/sync/:id` | Sync a single reminder item to Google Calendar | Yes |
| `DELETE`| `/calendar/google/disconnect`| Disconnect Google Calendar integration | Yes |
| `GET` | `/calendar/google/web-intent/:id`| Generate direct 1-click Google Calendar web URL | Yes |
| `GET` | `/calendar/export/ics` | Export active deadlines as RFC 5545 iCalendar (.ics) file | Yes |

---

## 5. Citizen Protection & Social Impact

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/impact/emergency-kit` | One-Tap Emergency Medical Dossier (printable format) | Yes |
| `GET` | `/impact/penalty-savings`| Quantified household fine & late fee prevention meter | Yes |
| `GET` | `/impact/citizen-rights` | Statutory citizen rights & consumer protection legal rules | Yes |

---

## 6. Vaults & Compliance

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/vaults` | List user family vaults and shared spaces | Yes |
| `POST` | `/vaults` | Create a new shared family vault | Yes |
| `POST` | `/vaults/:id/members` | Invite member to vault with role (OWNER, EDITOR, VIEWER) | Yes |
| `GET` | `/audit-logs` | Retrieve immutable compliance audit trail | Yes |
| `GET` | `/categories` | Retrieve all document taxonomy categories | No |
