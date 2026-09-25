-- PostgreSQL LifeAdmin Core Schema

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT,
    color TEXT,
    description TEXT
);

-- 3. Vaults (Family / Shared Spaces)
CREATE TABLE IF NOT EXISTS vaults (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vault Members
CREATE TABLE IF NOT EXISTS vault_members (
    id TEXT PRIMARY KEY,
    vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'VIEWER', -- OWNER, EDITOR, VIEWER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vault_id, user_id)
);

-- 5. Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_id TEXT REFERENCES vaults(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'UPLOADED', -- UPLOADED, PROCESSING, OCR_COMPLETED, AI_ANALYZING, NEEDS_REVIEW, ACTIVE, FAILED, ARCHIVED
    owner_name TEXT,
    storage_key TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    ocr_text TEXT,
    summary TEXT,
    provider TEXT,
    document_number TEXT,
    issue_date TEXT,
    expiry_date TEXT,
    amount REAL,
    currency TEXT DEFAULT 'USD',
    confidence REAL DEFAULT 0.0,
    verification_status TEXT DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    renewal_status TEXT DEFAULT 'NOT_REQUIRED', -- NOT_REQUIRED, UPCOMING, DUE, IN_PROGRESS, RENEWED, EXPIRED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- 6. Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_key TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    ocr_text TEXT,
    extracted_data TEXT, -- JSON payload
    change_summary TEXT, -- Diff notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Document Fields (EAV for granular confidence & audit)
CREATE TABLE IF NOT EXISTS document_fields (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_value TEXT,
    confidence REAL DEFAULT 1.0,
    source TEXT NOT NULL DEFAULT 'AI', -- OCR, AI, USER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Actions (Deadlines & user todos extracted from documents)
CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'OTHER', -- RENEW, PAY, SERVICE, SUBMIT, VERIFY, REPLACE, BOOK, REVIEW, UPLOAD, CONTACT_PROVIDER, OTHER
    due_date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM', -- CRITICAL, HIGH, MEDIUM, LOW
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, DISMISSED, OVERDUE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 9. Reminders
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    scheduled_for TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, SENT, CANCELLED
    channel TEXT NOT NULL DEFAULT 'IN_APP', -- IN_APP, EMAIL, GOOGLE_CALENDAR
    google_calendar_event_id TEXT,
    calendar_sync_status TEXT DEFAULT 'NOT_CONNECTED', -- NOT_CONNECTED, PENDING, SYNCED, FAILED, DISCONNECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9b. Google Calendar OAuth Tokens per user
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    scope TEXT,
    token_type TEXT,
    expiry_date INTEGER,
    sync_enabled INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 10. Document Relationships
CREATE TABLE IF NOT EXISTS document_relationships (
    id TEXT PRIMARY KEY,
    source_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    target_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- BELONGS_TO, RELATED_TO, RENEWAL_OF, VERSION_OF, SERVICE_FOR, PROOF_FOR
    confidence REAL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_document_id, target_document_id, relationship_type)
);

-- 11. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO', -- INFO, WARNING, URGENT, SUCCESS
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL, -- DOCUMENT, ACTION, REMINDER, VAULT, AUTH
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata TEXT, -- JSON string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_actions_document ON actions(document_id);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON actions(due_date);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_reminders_action ON reminders(action_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
